import { error } from '@sveltejs/kit';
import { asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '#lib/server/db/index.ts';
import { currentInvite, rotateInvite } from '#lib/server/auth/invites.ts';
import { deleteUserSessions } from '#lib/server/auth/session.ts';
import { getLastSync, availabilityCount, syncAvailability } from '#lib/server/arr.ts';
import { parseForm } from '#lib/server/actions.ts';
import { tmdbConfigured } from '#lib/server/tmdb.ts';

function requireAdmin(locals: App.Locals) {
	if (!locals.admin) error(404, 'Nincs ilyen oldal');
}

/** Each member's latest vote, recommendation, comment or own "seen" mark (ms). */
function lastActions(): Map<number, number> {
	const rows = db.all<{ userId: number; at: number }>(sql`
		SELECT user_id AS userId, MAX(at) AS at FROM (
			SELECT user_id, updated_at AS at FROM votes
			UNION ALL SELECT added_by, added_at FROM movies
			UNION ALL SELECT user_id, COALESCE(edited_at, created_at) FROM comments
			UNION ALL SELECT user_id, created_at FROM seen WHERE source = 'self'
		) GROUP BY user_id`);
	return new Map(rows.map((r) => [r.userId, r.at]));
}

export function load({ locals, url }) {
	requireAdmin(locals);
	const invite = currentInvite();
	const last = lastActions();
	const members = db
		.select()
		.from(schema.users)
		.orderBy(asc(schema.users.createdAt))
		.all()
		.map((u) => ({
			id: u.id,
			nickname: u.nickname ?? '(még nincs neve)',
			email: u.email,
			avatarSeed: u.avatarSeed,
			joined: u.createdAt.getTime(),
			lastAction: last.get(u.id) ?? null,
			removed: !!u.removedAt,
			me: u.id === locals.user!.id
		}))
		// Deactivated members at the bottom; otherwise by join date.
		.sort((a, b) => Number(a.removed) - Number(b.removed));
	return {
		inviteUrl: `${url.origin}/join/${invite.token}`,
		members,
		sync: getLastSync(),
		availabilityCount: availabilityCount(),
		tmdb: tmdbConfigured()
	};
}

export const actions = {
	rotate: ({ locals }) => {
		requireAdmin(locals);
		rotateInvite();
	},
	remove: async ({ request, locals }) => {
		requireAdmin(locals);
		const { userId } = await parseForm(request, z.object({ userId: z.coerce.number().int() }));
		if (userId === locals.user!.id) error(400, 'Saját magadat nem távolíthatod el');
		db.update(schema.users).set({ removedAt: new Date() }).where(eq(schema.users.id, userId)).run();
		deleteUserSessions(userId);
	},
	sync: async ({ locals }) => {
		requireAdmin(locals);
		await syncAvailability();
	}
};
