import { generateTOTP, verifyTOTP } from '@epic-web/totp';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { db } from '~/database/client.js';
import { verifications } from '~/database/schemas/users.schema.js';
import { getDomainUrl } from './misc.tsx.js';
import {
	codeQueryParam,
	redirectToQueryParam,
	targetQueryParam,
	typeQueryParam,
	VerificationTypes,
} from './verify.js';

export function getRedirectToUrl({
	request,
	type,
	target,
	redirectTo,
}: {
	request: Request;
	type: VerificationTypes;
	target: string;
	redirectTo?: string;
}) {
	const redirectToUrl = new URL(`${getDomainUrl(request)}/verify`);
	redirectToUrl.searchParams.set(typeQueryParam, type);
	redirectToUrl.searchParams.set(targetQueryParam, target);
	if (redirectTo) {
		redirectToUrl.searchParams.set(redirectToQueryParam, redirectTo);
	}
	return redirectToUrl;
}

export async function prepareVerification({
	period,
	request,
	type,
	target,
	redirectTo: postVerificationRedirectTo,
}: {
	period: number;
	request: Request;
	type: VerificationTypes;
	target: string;
	redirectTo?: string;
}) {
	const verifyUrl = getRedirectToUrl({
		request,
		type,
		target,
		redirectTo: postVerificationRedirectTo,
	});
	const redirectTo = new URL(verifyUrl.toString());

	const { otp, ...verificationConfig } = generateTOTP({
		algorithm: 'SHA256',
		period,
	});

	const verificationData = {
		type,
		target,
		...verificationConfig,
		expiresAt: new Date(Date.now() + verificationConfig.period * 1000),
	};
	await db
		.insert(verifications)
		.values({
			...verificationData,
		})
		.onConflictDoUpdate({
			target: [verifications.type, verifications.target],
			set: { ...verificationData },
		});

	// add the otp to the url we'll email the user.
	verifyUrl.searchParams.set(codeQueryParam, otp);

	return { otp, redirectTo, verifyUrl };
}

export const isCodeValid = async ({
	code,
	type,
	target,
}: {
	code: string;
	type: VerificationTypes;
	target: string;
}) => {
	const verification = await db.query.verifications.findFirst({
		columns: { algorithm: true, secret: true, period: true, charSet: true },
		where: and(
			eq(verifications.target, target),
			eq(verifications.type, type),
			or(
				gt(verifications.expiresAt, new Date()),
				isNull(verifications.expiresAt)
			)
		),
	});

	if (!verification) return false;
	const result = verifyTOTP({
		otp: code,
		secret: verification.secret,
		algorithm: verification.algorithm,
		period: verification.period,
		charSet: verification.charSet,
	});
	if (!result) return false;

	return true;
};
