import { error, redirect } from '@sveltejs/kit';
import { dev } from '$app/env';
import { DEV_LOGIN } from '$app/env/private';
import { createSession, setSessionCookie } from '#lib/server/auth/session.ts';
import { upsertMember } from '#lib/server/users.ts';

/**
 * Development and e2e only: sign in as `?as=<name>` without Google. `dev` is
 * false in every production build, so this route is dead code there.
 */
export function GET({ url, cookies }) {
	if (!dev || DEV_LOGIN !== '1') error(404, 'Not found');
	const name =
		(url.searchParams.get('as') ?? 'dev').replace(/[^a-z0-9]/gi, '').slice(0, 20) || 'dev';
	const user = upsertMember(`dev-${name}`, `${name.toLowerCase()}@dev.local`);
	const session = createSession(user.id);
	setSessionCookie(cookies, session.token, session.expiresAt);
	redirect(303, user.nickname ? '/' : '/welcome');
}
