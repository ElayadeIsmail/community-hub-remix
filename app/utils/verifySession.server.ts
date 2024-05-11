import { createCookieSessionStorage } from '@remix-run/node';

export const verifySessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'en_verification',
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		secrets: ENV.SESSION_SECRETS.split(','),
		secure: process.env.NODE_ENV === 'production',
	},
});
