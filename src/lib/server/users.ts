import { asc, eq, isNull } from 'drizzle-orm';
import { ADMIN_EMAILS } from '$app/env/private';
import { db, schema } from '#lib/server/db/index.ts';
import type { User } from '#lib/server/db/schema.ts';
import { generateToken } from '#lib/server/auth/tokens.ts';

export const NICKNAME_MAX = 24;

const adminEmails = new Set(
	ADMIN_EMAILS.split(',')
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean)
);

export function isAdmin(user: Pick<User, 'email'>): boolean {
	return adminEmails.has(user.email.toLowerCase());
}

export function newAvatarSeed(): string {
	return generateToken(9);
}

export function findUserByGoogleSub(sub: string) {
	return db.select().from(schema.users).where(eq(schema.users.googleSub, sub)).get();
}

/**
 * Creates the account on first sign-in, or brings back a removed member who
 * arrives with a fresh invite.
 */
export function upsertMember(sub: string, email: string): User {
	const existing = findUserByGoogleSub(sub);
	if (existing) {
		return db
			.update(schema.users)
			.set({ email, removedAt: null })
			.where(eq(schema.users.id, existing.id))
			.returning()
			.get();
	}
	return db
		.insert(schema.users)
		.values({ googleSub: sub, email, avatarSeed: newAvatarSeed() })
		.returning()
		.get();
}

export function activeMembers() {
	return db
		.select()
		.from(schema.users)
		.where(isNull(schema.users.removedAt))
		.orderBy(asc(schema.users.nickname))
		.all()
		.filter((u) => u.nickname);
}

/** A public, display-safe view of a user (no email, no Google id). */
export type Member = { id: number; nickname: string; avatarSeed: string; removed: boolean };

export function toMember(u: User): Member {
	return {
		id: u.id,
		nickname: u.removedAt ? 'former member' : (u.nickname ?? '…'),
		avatarSeed: u.avatarSeed,
		removed: !!u.removedAt
	};
}
