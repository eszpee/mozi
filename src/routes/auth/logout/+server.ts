import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, clearSessionCookie, deleteSession } from '#lib/server/auth/session.ts';

export function POST({ cookies }) {
	const token = cookies.get(SESSION_COOKIE);
	if (token) deleteSession(token);
	clearSessionCookie(cookies);
	redirect(303, '/login');
}
