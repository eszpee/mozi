import { error } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '#lib/server/db/index.ts';
import { currentInvite, rotateInvite } from '#lib/server/auth/invites.ts';
import { deleteUserSessions } from '#lib/server/auth/session.ts';
import { getLastSync, availabilityCount, syncAvailability } from '#lib/server/arr.ts';
import { parseForm } from '#lib/server/actions.ts';
import { tmdbConfigured } from '#lib/server/tmdb.ts';

function requireAdmin(locals: App.Locals) {
	if (!locals.admin) error(404, 'Not found');
}

export function load({ locals, url }) {
	requireAdmin(locals);
	const invite = currentInvite();
	const members = db
		.select()
		.from(schema.users)
		.orderBy(asc(schema.users.createdAt))
		.all()
		.map((u) => ({
			id: u.id,
			nickname: u.nickname ?? '(no name yet)',
			email: u.email,
			avatarSeed: u.avatarSeed,
			joined: u.createdAt.getTime(),
			removed: !!u.removedAt,
			me: u.id === locals.user!.id
		}));
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
		if (userId === locals.user!.id) error(400, 'You can’t remove yourself');
		db.update(schema.users).set({ removedAt: new Date() }).where(eq(schema.users.id, userId)).run();
		deleteUserSessions(userId);
	},
	sync: async ({ locals }) => {
		requireAdmin(locals);
		await syncAvailability();
	}
};
