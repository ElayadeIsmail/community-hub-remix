import { redirect } from '@remix-run/node';
import { requireAnonymous } from './auth.server';
import { invariant } from './misc.tsx';
import { VerifyFunctionArgs } from './verify';
import { verifySessionStorage } from './verifySession.server';

export const onboardingEmailSessionKey = 'onBoardingEmail';

export async function handleVerification({
	request,
	submission,
}: VerifyFunctionArgs) {
	invariant(
		submission.payload,
		'submission.payload should be defined by now'
	);
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);
	verifySession.set(onboardingEmailSessionKey, submission.payload.target);
	return redirect('/onboarding', {
		headers: {
			'set-cookie': await verifySessionStorage.commitSession(
				verifySession
			),
		},
	});
}

export const requireEmail = async (request: Request) => {
	await requireAnonymous(request);
	const verifySession = await verifySessionStorage.getSession(
		request.headers.get('cookie')
	);
	const email = verifySession.get(onboardingEmailSessionKey);
	if (!email) {
		redirect('/signup');
	}
	return email;
};
