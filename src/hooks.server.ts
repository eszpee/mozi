import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import {
	SESSION_COOKIE,
	clearSessionCookie,
	setSessionCookie,
	validateSession
} from '#lib/server/auth/session.ts';
import { isAdmin } from '#lib/server/users.ts';
import { allow } from '#lib/server/rate-limit.ts';
import { startBackgroundJobs } from '#lib/server/jobs.ts';

if (!building) startBackgroundJobs();

// Reachable without a session.
const PUBLIC_PREFIXES = ['/login', '/join/', '/auth/', '/healthz', '/robots.txt', '/dev/'];

const SECURITY_HEADERS: Record<string, string> = {
	'x-robots-tag': 'noindex, nofollow',
	// Only ever served over https in production (Cloudflare); browsers ignore it on http://localhost.
	'strict-transport-security': 'max-age=31536000',
	'x-content-type-options': 'nosniff',
	'referrer-policy': 'strict-origin-when-cross-origin',
	'permissions-policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
};

export const handle: Handle = async ({ event, resolve }) => {
	const { cookies, url, request } = event;

	const mutating = request.method !== 'GET' && request.method !== 'HEAD';
	if (mutating || url.pathname.startsWith('/auth/') || url.pathname.startsWith('/join/')) {
		let ip = 'unknown';
		try {
			ip = event.getClientAddress();
		} catch {
			// The address header is absent outside the proxy chain (e.g. health checks).
		}
		if (!allow(`${ip}:${mutating ? 'w' : 'auth'}`, mutating ? 120 : 30, 60_000)) {
			return new Response('Too many requests', { status: 429 });
		}
	}

	event.locals.user = null;
	event.locals.admin = false;
	const token = cookies.get(SESSION_COOKIE);
	if (token) {
		const result = validateSession(token);
		if (result) {
			event.locals.user = result.user;
			event.locals.admin = isAdmin(result.user);
			if (result.renewedUntil) setSessionCookie(cookies, token, result.renewedUntil);
		} else {
			clearSessionCookie(cookies);
		}
	}

	const isPublic = PUBLIC_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(p));
	if (!isPublic) {
		if (!event.locals.user) redirect(303, '/login');
		if (
			!event.locals.user.nickname &&
			url.pathname !== '/welcome' &&
			!url.pathname.startsWith('/avatar/')
		) {
			redirect(303, '/welcome');
		}
	}

	const response = await resolve(event);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
	return response;
};
