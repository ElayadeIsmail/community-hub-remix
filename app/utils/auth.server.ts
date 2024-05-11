import { redirect } from '@remix-run/node';
import bcrypt from 'bcryptjs';
import { and, eq, gt } from 'drizzle-orm';
import { safeRedirect } from 'remix-utils/safe-redirect';
import { db } from '~/database/client';
import { passwords, sessions, users } from '~/database/schemas';
import { combineResponseInits } from './misc.tsx';
import { sessionStorage } from './session.server';

const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 days

export const getExpirationTimeStampMs = () => {
	return new Date(Date.now() + SESSION_EXPIRATION_TIME);
};
export const sessionKey = 'sessionId';

export const getUserId = async (request: Request) => {
	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie')
	);
	const sessionId = cookieSession.get(sessionKey);
	if (!sessionId) return null;
	const session = await db.query.sessions.findFirst({
		where: and(
			eq(sessions.id, sessionId),
			gt(sessions.expiresAt, new Date())
		),
		with: { user: true },
	});
	if (!session?.user) {
		throw await logout({ request });
	}
	return session.user.id;
};

export const getOptionalUser = async (request: Request) => {
	const userId = await getUserId(request);
	if (!userId) return null;
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: {
			id: true,
			username: true,
			name: true,
			email: true,
		},
	});
	return user;
};

export const requireUserId = async (
	request: Request,
	{ redirectTo }: { redirectTo?: string | null } = {}
) => {
	const userId = await getUserId(request);
	if (!userId) {
		const requestUrl = new URL(request.url);
		redirectTo =
			redirectTo === null
				? null
				: redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`;
		const loginParams = redirectTo
			? new URLSearchParams({ redirectTo })
			: null;
		const loginRedirect = ['/login', loginParams?.toString()]
			.filter(Boolean)
			.join('?');
		throw redirect(loginRedirect);
	}
	return userId;
};

export const requireAnonymous = async (request: Request) => {
	const userId = await getUserId(request);
	if (userId) {
		throw redirect('/');
	}
};

export const requireUser = async (request: Request) => {
	const userId = await requireUserId(request);
	const user = await db
		.select({
			username: users.username,
			id: users.id,
			email: users.email,
		})
		.from(users)
		.where(eq(users.id, userId));
	if (!user) {
		throw await logout({ request });
	}
	return user;
};

export const logout = async (
	{
		request,
		redirectTo = '/',
	}: { request: Request; redirectTo?: string | null },
	responseInit?: ResponseInit
) => {
	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie')
	);
	const sessionId = cookieSession.get(sessionKey);
	if (sessionId) void db.delete(sessions).where(eq(sessions.id, sessionId));
	throw redirect(
		safeRedirect(redirectTo),
		combineResponseInits(responseInit, {
			headers: {
				'set-cookie': await sessionStorage.destroySession(
					cookieSession
				),
			},
		})
	);
};

interface SignUpProps {
	username: string;
	name: string;
	email: string;
	password: string;
	agent: string | null;
}

export const signup = async ({
	username,
	email,
	name,
	password,
	agent,
}: SignUpProps) => {
	const hash = await getPasswordHash(password);
	const session = await db.transaction(async (tx) => {
		const [user] = await tx
			.insert(users)
			.values({ email, name, username })
			.returning({ id: users.id });
		const [[session]] = await Promise.all([
			tx
				.insert(sessions)
				.values({
					userId: user.id,
					expiresAt: getExpirationTimeStampMs(),
					agent,
				})
				.returning({ id: sessions.id, expiresAt: sessions.expiresAt }),
			tx.insert(passwords).values({
				userId: user.id,
				hash,
			}),
		]);
		return session;
	});
	return session;
};

export async function getPasswordHash(password: string) {
	const hash = await bcrypt.hash(password, 10);
	return hash;
}

export const verifyUserPassword = async (userId: string, password: string) => {
	const user = await db.query.users.findFirst({
		columns: {
			id: true,
		},
		where: eq(users.id, userId),
		with: {
			password: {
				columns: {
					hash: true,
				},
			},
		},
	});
	if (!user || !user.password) return null;
	const isPasswordMatch = await bcrypt.compare(password, user.password.hash);
	if (!isPasswordMatch) return null;
	return { id: user.id };
};
