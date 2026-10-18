import { and, desc, inArray, isNull } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { activeMembers, toMember } from '#lib/server/users.ts';
import { displayTitle } from '#lib/titles.ts';
import type { VoteValue } from '#lib/scoring.ts';

/** Every open movie against every member, with each vote. Open to all members. */
export function load() {
	const members = activeMembers().map(toMember);
	const users = new Map(
		db
			.select()
			.from(schema.users)
			.all()
			.map((u) => [u.id, toMember(u)])
	);
	const movies = db
		.select()
		.from(schema.movies)
		.where(and(isNull(schema.movies.deletedAt), isNull(schema.movies.watchedAt)))
		.orderBy(desc(schema.movies.addedAt), desc(schema.movies.id))
		.all();
	const votes = movies.length
		? db
				.select()
				.from(schema.votes)
				.where(
					inArray(
						schema.votes.movieId,
						movies.map((m) => m.id)
					)
				)
				.all()
		: [];
	const byMovie = new Map<number, Record<number, VoteValue>>();
	// Only the members shown as columns count; removed members' votes stay out of the totals.
	const shown = new Set(members.map((m) => m.id));
	for (const v of votes) {
		if (!shown.has(v.userId)) continue;
		const row = byMovie.get(v.movieId) ?? {};
		row[v.userId] = v.value as VoteValue;
		byMovie.set(v.movieId, row);
	}

	return {
		members,
		rows: movies.map((m) => ({
			id: m.id,
			title: displayTitle(m.meta).main,
			year: m.meta.year,
			posterPath: m.meta.posterPath,
			addedBy: users.get(m.addedBy)!,
			votes: byMovie.get(m.id) ?? {}
		}))
	};
}
