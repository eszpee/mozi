import { redirect } from '@sveltejs/kit';
import { INVITE_COOKIE, isValidInvite } from '#lib/server/auth/invites.ts';

export function load({ params, cookies, locals }) {
	if (locals.user) redirect(303, '/');
	const valid = isValidInvite(params.token);
	if (valid) {
		cookies.set(INVITE_COOKIE, params.token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60
		});
	}
	return { valid };
}
