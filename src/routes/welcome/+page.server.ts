import { fail, redirect } from '@sveltejs/kit';
import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '#lib/server/db/index.ts';
import { NICKNAME_MAX } from '#lib/server/users.ts';
import { AVATAR_SEED } from '#lib/server/avatar.ts';

export function load({ locals }) {
	const user = locals.user!;
	return { nickname: user.nickname ?? '', avatarSeed: user.avatarSeed, firstTime: !user.nickname };
}

const Nickname = z
	.string()
	.trim()
	.min(1, 'Válassz nevet')
	.max(NICKNAME_MAX, `Legfeljebb ${NICKNAME_MAX} karakter`);

export const actions = {
	save: async ({ request, locals }) => {
		const form = await request.formData();
		const parsed = Nickname.safeParse(form.get('nickname'));
		if (!parsed.success) return fail(400, { error: parsed.error.issues[0].message });
		const nickname = parsed.data;
		// The avatar is picked client-side; any seed in the avatar route's shape is fine.
		const seed = String(form.get('avatarSeed') ?? '');
		const avatarSeed = AVATAR_SEED.test(seed) ? seed : locals.user!.avatarSeed;

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
		if (taken) return fail(400, { error: 'Ezt a nevet már valaki használja' });

		db.update(schema.users)
			.set({ nickname, avatarSeed })
			.where(eq(schema.users.id, locals.user!.id))
			.run();
		redirect(303, '/');
	}
};
