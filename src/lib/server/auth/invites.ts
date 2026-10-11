import { and, desc, eq, isNull } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { generateToken, hashToken } from './tokens.ts';

export const INVITE_COOKIE = 'mozi_invite';

/** The single active invite, created on first use. */
export function currentInvite() {
	const existing = db
		.select()
		.from(schema.invites)
		.where(isNull(schema.invites.revokedAt))
		.orderBy(desc(schema.invites.id))
		.get();
	return existing ?? rotateInvite();
}

/** Revokes every invite and issues a fresh one; old links stop working immediately. */
export function rotateInvite() {
	return db.transaction((tx) => {
		tx.update(schema.invites)
			.set({ revokedAt: new Date() })
			.where(isNull(schema.invites.revokedAt))
			.run();
		const token = generateToken(18);
		return tx
			.insert(schema.invites)
			.values({ token, tokenHash: hashToken(token) })
			.returning()
			.get();
	});
}

export function isValidInvite(token: string | undefined): boolean {
	if (!token) return false;
	const row = db
		.select({ id: schema.invites.id })
		.from(schema.invites)
		.where(and(eq(schema.invites.tokenHash, hashToken(token)), isNull(schema.invites.revokedAt)))
		.get();
	return !!row;
}
