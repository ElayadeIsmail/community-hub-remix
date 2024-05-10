import { redirect } from '@remix-run/node';
import { and, eq, gt } from 'drizzle-orm';
import { safeRedirect } from 'remix-utils/safe-redirect';
import { db } from '~/database/client';
import { sessions } from '~/database/schemas';
import { combineResponseInits } from './misc.tsx';
import { sessionStorage } from './session.server';

const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 days

export const getExpirationTimeStampMs = () => {
	return Date.now() + SESSION_EXPIRATION_TIME;
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
		// do logout
		return null;
	}
	return session.user.id;
};

export const requireUserId = async (
	request: Request,
	{ redirectTo }: { redirectTo?: string | null }
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

export const logout = async (
	{ request, redirectTo }: { request: Request; redirectTo?: string | null },
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
