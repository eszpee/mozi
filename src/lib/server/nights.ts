import { and, desc, eq, isNull } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import type { Night } from '#lib/server/db/schema.ts';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Conn = typeof db | Tx;

/** There is always exactly one open night; it's created on first use. */
export function openNight(conn: Conn = db): Night {
	const open = conn
		.select()
		.from(schema.nights)
		.where(isNull(schema.nights.closedAt))
		.orderBy(desc(schema.nights.id))
		.get();
	return open ?? conn.insert(schema.nights).values({}).returning().get();
}

export function attendeeIds(nightId: number, conn: Conn = db): Set<number> {
	return new Set(
		conn
			.select({ userId: schema.nightAttendees.userId })
			.from(schema.nightAttendees)
			.innerJoin(schema.users, eq(schema.users.id, schema.nightAttendees.userId))
			.where(and(eq(schema.nightAttendees.nightId, nightId), isNull(schema.users.removedAt)))
			.all()
			.map((r) => r.userId)
	);
}

/** Closes the night with the movie that was watched and opens the next one, same people pre-filled. */
export function closeNightWith(conn: Conn, nightId: number, movieId: number) {
	conn
		.update(schema.nights)
		.set({ closedAt: new Date(), movieId })
		.where(eq(schema.nights.id, nightId))
		.run();
	const next = conn.insert(schema.nights).values({}).returning().get();
	for (const userId of attendeeIds(nightId, conn)) {
		conn.insert(schema.nightAttendees).values({ nightId: next.id, userId }).run();
	}
}

export function setAttendance(userId: number, attending: boolean) {
	const night = openNight();
	if (attending) {
		db.insert(schema.nightAttendees)
			.values({ nightId: night.id, userId })
			.onConflictDoNothing()
			.run();
	} else {
		db.delete(schema.nightAttendees)
			.where(
				and(eq(schema.nightAttendees.nightId, night.id), eq(schema.nightAttendees.userId, userId))
			)
			.run();
	}
}

export function updateNight(label: string | null, date: string | null) {
	const night = openNight();
	db.update(schema.nights).set({ label, date }).where(eq(schema.nights.id, night.id)).run();
}
