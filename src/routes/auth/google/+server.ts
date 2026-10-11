import { redirect } from '@sveltejs/kit';
import { SECURE_COOKIES } from '#lib/server/auth/session.ts';
import { STATE_COOKIE, VERIFIER_COOKIE, startGoogleLogin } from '#lib/server/auth/google.ts';

const tempCookie = {
	path: '/',
	httpOnly: true,
	secure: SECURE_COOKIES,
	sameSite: 'lax',
	maxAge: 600
} as const;

export function GET({ url, cookies }) {
	const { url: authUrl, state, verifier } = startGoogleLogin(url.origin);
	cookies.set(STATE_COOKIE, state, tempCookie);
	cookies.set(VERIFIER_COOKIE, verifier, tempCookie);
	redirect(302, authUrl.toString(), { external: ['https://accounts.google.com'] });
}
