import { redirect } from '@sveltejs/kit';
import { SECURE_COOKIES } from '#lib/server/auth/session.ts';
import { INVITE_COOKIE, isValidInvite } from '#lib/server/auth/invites.ts';

export function load({ params, cookies, locals }) {
	if (locals.user) redirect(303, '/');
	const valid = isValidInvite(params.token);
	if (valid) {
		cookies.set(INVITE_COOKIE, params.token, {
			path: '/',
			httpOnly: true,
			secure: SECURE_COOKIES,
			sameSite: 'lax',
			maxAge: 60 * 60
		});
	}
	return { valid };
}
