import { error, fail } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '#lib/server/db/index.ts';
import { castVote, toggleSeen } from '#lib/server/movies.ts';
import { setAttendance } from '#lib/server/nights.ts';

/** Form actions shared by every page that shows vote buttons or the next-night strip. */

type Event = { request: Request; locals: App.Locals };

const id = z.coerce.number().int().positive();

export async function parseForm<T extends z.ZodType>(request: Request, shape: T) {
	const form = Object.fromEntries(await request.formData());
	const parsed = shape.safeParse(form);
	if (!parsed.success) error(400, 'Invalid form');
	return parsed.data as z.infer<T>;
}

export async function vote({ request, locals }: Event) {
	const { movieId, value } = await parseForm(
		request,
		z.object({ movieId: id, value: z.enum(['1', '0', '-1']).transform(Number) })
	);
	if (!castVote(movieId, locals.user!.id, value as 1 | 0 | -1, true)) {
		return fail(409, { message: 'Voting is closed for this movie' });
	}
}

export async function seen({ request, locals }: Event) {
	const { movieId } = await parseForm(request, z.object({ movieId: id }));
	toggleSeen(movieId, locals.user!.id);
}

export async function attend({ request }: Event) {
	const { userId, attending } = await parseForm(
		request,
		z.object({ userId: id, attending: z.enum(['true', 'false']) })
	);
	const member = db
		.select({ id: schema.users.id })
		.from(schema.users)
		.where(and(eq(schema.users.id, userId), isNull(schema.users.removedAt)))
		.get();
	if (!member) error(404, 'No such member');
	setAttendance(userId, attending === 'true');
}
