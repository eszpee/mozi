import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { attendeeIds, openNight, updateNight } from '#lib/server/nights.ts';
import { activeMembers, toMember } from '#lib/server/users.ts';
import { attend } from '#lib/server/actions.ts';

export function load() {
	const night = openNight();
	return {
		night: { label: night.label, date: night.date, attendees: [...attendeeIds(night.id)] },
		members: activeMembers().map(toMember)
	};
}

const NightForm = z.object({
	label: z.string().trim().max(60, 'A név legfeljebb 60 karakter lehet'),
	date: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Hibás dátum')])
});

export const actions = {
	attend,
	save: async ({ request }) => {
		const parsed = NightForm.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { error: parsed.error.issues[0].message });
		updateNight(parsed.data.label || null, parsed.data.date || null);
		redirect(303, '/');
	}
};
