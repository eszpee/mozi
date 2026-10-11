import { and, eq, isNull } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/env';
import { db, schema } from '#lib/server/db/index.ts';
import { generateToken, hashToken } from './tokens.ts';

// Production always runs on https. The dev server may be opened over plain http
// from another device (e.g. via the tailnet), where browsers drop Secure cookies.
export const SECURE_COOKIES = !dev;
export const SESSION_COOKIE = SECURE_COOKIES ? '__Host-mozi_session' : 'mozi_session';

const DAY = 24 * 60 * 60 * 1000;
// Browsers cap cookie lifetime at 400 days; sliding renewal makes the login effectively permanent.
const SESSION_LIFETIME = 400 * DAY;
// Renew at most once a day to avoid a write per request.
const RENEW_AFTER = DAY;

export function createSession(userId: number): { token: string; expiresAt: Date } {
	const token = generateToken();
	const expiresAt = new Date(Date.now() + SESSION_LIFETIME);
	db.insert(schema.sessions)
		.values({ id: hashToken(token), userId, expiresAt })
		.run();
	return { token, expiresAt };
}

export function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: SECURE_COOKIES,
		sameSite: 'lax',
		expires: expiresAt
	});
}

export function clearSessionCookie(cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/', secure: SECURE_COOKIES });
}

/**
 * Resolves a cookie token to an active user. Expired sessions and sessions of
 * removed users are rejected. Returns a new expiry when the session was renewed,
 * so the caller can refresh the cookie.
 */
export function validateSession(token: string) {
	const id = hashToken(token);
	const row = db
		.select({ session: schema.sessions, user: schema.users })
		.from(schema.sessions)
		.innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
		.where(and(eq(schema.sessions.id, id), isNull(schema.users.removedAt)))
		.get();
	if (!row) return null;

	const now = Date.now();
	if (row.session.expiresAt.getTime() <= now) {
		db.delete(schema.sessions).where(eq(schema.sessions.id, id)).run();
		return null;
	}

	let renewedUntil: Date | null = null;
	if (row.session.expiresAt.getTime() - now < SESSION_LIFETIME - RENEW_AFTER) {
		renewedUntil = new Date(now + SESSION_LIFETIME);
		db.update(schema.sessions)
			.set({ expiresAt: renewedUntil })
			.where(eq(schema.sessions.id, id))
			.run();
	}
	return { user: row.user, renewedUntil };
}

export function deleteSession(token: string) {
	db.delete(schema.sessions)
		.where(eq(schema.sessions.id, hashToken(token)))
		.run();
}

export function deleteUserSessions(userId: number) {
	db.delete(schema.sessions).where(eq(schema.sessions.userId, userId)).run();
}
