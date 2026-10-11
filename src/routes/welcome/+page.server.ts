import { fail, redirect } from '@sveltejs/kit';
import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '#lib/server/db/index.ts';
import { NICKNAME_MAX, newAvatarSeed } from '#lib/server/users.ts';

export function load({ locals }) {
	const user = locals.user!;
	return { nickname: user.nickname ?? '', avatarSeed: user.avatarSeed, firstTime: !user.nickname };
}

const Nickname = z
	.string()
	.trim()
	.min(1, 'Pick a name')
	.max(NICKNAME_MAX, `At most ${NICKNAME_MAX} characters`);

export const actions = {
	reroll: ({ locals }) => {
		const seed = newAvatarSeed();
		db.update(schema.users)
			.set({ avatarSeed: seed })
			.where(eq(schema.users.id, locals.user!.id))
			.run();
		return { avatarSeed: seed };
	},
	save: async ({ request, locals }) => {
		const form = await request.formData();
		const parsed = Nickname.safeParse(form.get('nickname'));
		if (!parsed.success) return fail(400, { error: parsed.error.issues[0].message });
		const nickname = parsed.data;

		const taken = db
			.select({ id: schema.users.id })
			.from(schema.users)
			.where(
				and(
					sql`lower(${schema.users.nickname}) = lower(${nickname})`,
					ne(schema.users.id, locals.user!.id),
					isNull(schema.users.removedAt)
				)
			)
			.get();
		if (taken) return fail(400, { error: 'Someone already goes by that name' });

		db.update(schema.users).set({ nickname }).where(eq(schema.users.id, locals.user!.id)).run();
		redirect(303, '/');
	}
};
