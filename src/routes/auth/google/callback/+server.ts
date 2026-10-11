import { redirect } from '@sveltejs/kit';
import { SECURE_COOKIES } from '#lib/server/auth/session.ts';
import { STATE_COOKIE, VERIFIER_COOKIE, finishGoogleLogin } from '#lib/server/auth/google.ts';
import { INVITE_COOKIE, isValidInvite } from '#lib/server/auth/invites.ts';
import { createSession, setSessionCookie } from '#lib/server/auth/session.ts';
import { findUserByGoogleSub, isAdmin, upsertMember } from '#lib/server/users.ts';

export async function GET({ url, cookies }) {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get(STATE_COOKIE);
	const verifier = cookies.get(VERIFIER_COOKIE);
	cookies.delete(STATE_COOKIE, { path: '/', secure: SECURE_COOKIES });
	cookies.delete(VERIFIER_COOKIE, { path: '/', secure: SECURE_COOKIES });

	if (!code || !state || !storedState || !verifier || state !== storedState) {
		redirect(303, '/login?error=expired');
	}

	let identity;
	try {
		identity = await finishGoogleLogin(url.origin, code, verifier);
	} catch (e) {
		console.error('Google login failed', e);
		redirect(303, '/login?error=google');
	}

	const existing = findUserByGoogleSub(identity.sub);
	// Admins (ADMIN_EMAILS) may join without an invite: someone has to be first.
	const invited = isAdmin(identity) || isValidInvite(cookies.get(INVITE_COOKIE));
	if (!invited && (!existing || existing.removedAt)) redirect(303, '/login?error=not-invited');

	const user =
		existing && !existing.removedAt ? existing : upsertMember(identity.sub, identity.email);
	cookies.delete(INVITE_COOKIE, { path: '/', secure: SECURE_COOKIES });

	const session = createSession(user.id);
	setSessionCookie(cookies, session.token, session.expiresAt);
	redirect(303, user.nickname ? '/' : '/welcome');
}
