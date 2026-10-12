import { and, desc, eq, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import type { Movie, Person } from '#lib/server/db/schema.ts';
import { displayTitle, type DisplayTitle } from '#lib/titles.ts';
import { tally, type Tally, type VoteValue } from '#lib/scoring.ts';
import { toMember, type Member } from '#lib/server/users.ts';
import { availabilityMap } from '#lib/server/arr.ts';
import type { AvailabilityStatus } from '#lib/server/availability.ts';
import type { Providers } from '#lib/server/providers.ts';
import type { AgeRating } from '#lib/server/age-rating.ts';
import type { Releases } from '#lib/server/release-dates.ts';
import { fetchMovieMeta } from '#lib/server/tmdb.ts';
import { closeNightWith, openNight } from '#lib/server/nights.ts';

export type MovieView = {
	id: number;
	tmdbId: number;
	title: DisplayTitle;
	/** TMDB's ISO 639-1 code. */
	originalLanguage: string;
	year: number | null;
	releaseDate: string | null;
	runtime: number | null;
	genres: string[];
	rating: number | null;
	overview: string;
	posterPath: string | null;
	imdbId: string | null;
	trailerKey: string | null;
	directors: Person[];
	cast: Person[];
	providers: Providers;
	ageRating: AgeRating | null;
	releases: Releases;
	addedAt: number;
	addedBy: Member;
	watchedAt: number | null;
	votes: { member: Member; value: VoteValue }[];
	/** All members' votes; shown on the buttons. */
	tally: Tally;
	/** Votes of the next night's attendees; ranks the "only who's coming" view. */
	nightTally: Tally;
	myVote: VoteValue | null;
	seenBy: Member[];
	/** How many of the next night's attendees have seen it; used by "best bet". */
	nightSeen: number;
	mySeen: boolean;
	commentCount: number;
	availability: AvailabilityStatus | null;
};

/** Credits cached before links were added are bare names; they show unlinked until the refresh. */
const people = (list: (Person | string)[] = []): Person[] =>
	list.map((p) => (typeof p === 'string' ? { name: p, tmdbId: null, imdbId: null } : p));

function membersById(): Map<number, Member> {
	return new Map(
		db
			.select()
			.from(schema.users)
			.all()
			.map((u) => [u.id, toMember(u)])
	);
}

/** Builds display views for movies, with `voters` (when given) scoping the night tally. */
function buildViews(rows: Movie[], meId: number, voters?: ReadonlySet<number>): MovieView[] {
	if (rows.length === 0) return [];
	const ids = rows.map((m) => m.id);
	const members = membersById();
	const avail = availabilityMap();

	const votes = db.select().from(schema.votes).where(inArray(schema.votes.movieId, ids)).all();
	const seen = db.select().from(schema.seen).where(inArray(schema.seen.movieId, ids)).all();
	const commentCounts = new Map(
		db
			.select({ movieId: schema.comments.movieId, n: sql<number>`count(*)` })
			.from(schema.comments)
			.where(and(inArray(schema.comments.movieId, ids), isNull(schema.comments.deletedAt)))
			.groupBy(schema.comments.movieId)
			.all()
			.map((r) => [r.movieId, r.n])
	);

	const unknown: Member = { id: 0, nickname: 'volt tag', avatarSeed: 'x', removed: true };
	const member = (id: number) => members.get(id) ?? unknown;

	return rows.map((m) => {
		const mv = votes
			.filter((v) => v.movieId === m.id)
			.map((v) => ({ userId: v.userId, value: v.value as VoteValue }));
		const active = mv.filter((v) => !member(v.userId).removed);
		const ms = seen.filter((s) => s.movieId === m.id);
		return {
			id: m.id,
			tmdbId: m.tmdbId,
			title: displayTitle(m.meta),
			originalLanguage: m.meta.originalLanguage,
			year: m.meta.year,
			releaseDate: m.meta.releaseDate ?? null,
			runtime: m.meta.runtime,
			genres: m.meta.genres,
			rating: m.meta.rating,
			overview: m.meta.overview,
			posterPath: m.meta.posterPath,
			imdbId: m.meta.imdbId,
			trailerKey: m.meta.trailerKey,
			directors: people(m.meta.directors),
			cast: people(m.meta.cast),
			providers: m.meta.watch ?? { link: null, stream: [], rent: [] },
			ageRating: m.meta.ageRating ?? null,
			releases: {
				theatrical: m.meta.releases?.theatrical ?? null,
				home: m.meta.releases?.home ?? null
			},
			addedAt: m.addedAt.getTime(),
			addedBy: member(m.addedBy),
			watchedAt: m.watchedAt?.getTime() ?? null,
			votes: mv
				.map((v) => ({ member: member(v.userId), value: v.value }))
				.filter((v) => !v.member.removed),
			tally: tally(active),
			nightTally: tally(active, voters),
			myVote: mv.find((v) => v.userId === meId)?.value ?? null,
			seenBy: ms.map((s) => member(s.userId)).filter((x) => !x.removed),
			nightSeen: ms.filter((s) => !member(s.userId).removed && (!voters || voters.has(s.userId)))
				.length,
			mySeen: ms.some((s) => s.userId === meId),
			commentCount: commentCounts.get(m.id) ?? 0,
			availability: avail.get(m.tmdbId)?.status ?? null
		};
	});
}

export function activeMovies(meId: number, voters?: ReadonlySet<number>): MovieView[] {
	const rows = db
		.select()
		.from(schema.movies)
		.where(and(isNull(schema.movies.watchedAt), isNull(schema.movies.deletedAt)))
		.all();
	return buildViews(rows, meId, voters);
}

export function watchedMovies(meId: number) {
	const rows = db
		.select()
		.from(schema.movies)
		.where(and(isNotNull(schema.movies.watchedAt), isNull(schema.movies.deletedAt)))
		.orderBy(desc(schema.movies.watchedAt))
		.all();
	const nights = new Map(
		db
			.select()
			.from(schema.nights)
			.all()
			.map((n) => [n.id, n])
	);
	return buildViews(rows, meId).map((v, i) => {
		const night = rows[i].watchedNightId ? nights.get(rows[i].watchedNightId!) : undefined;
		return { ...v, nightLabel: night?.label ?? null, nightDate: night?.date ?? null };
	});
}

export function getMovie(id: number, meId: number): MovieView | null {
	const row = db
		.select()
		.from(schema.movies)
		.where(and(eq(schema.movies.id, id), isNull(schema.movies.deletedAt)))
		.get();
	return row ? buildViews([row], meId)[0] : null;
}

export function existingTmdbIds(): Map<number, { id: number; watched: boolean }> {
	return new Map(
		db
			.select({
				id: schema.movies.id,
				tmdbId: schema.movies.tmdbId,
				watchedAt: schema.movies.watchedAt
			})
			.from(schema.movies)
			.where(isNull(schema.movies.deletedAt))
			.all()
			.map((m) => [m.tmdbId, { id: m.id, watched: !!m.watchedAt }])
	);
}

/**
 * Recommends a movie. Adding one that's already listed just records the
 * recommender's 👍; a previously removed movie comes back as a fresh pick.
 */
export async function recommend(tmdbId: number, userId: number): Promise<number> {
	const existing = db.select().from(schema.movies).where(eq(schema.movies.tmdbId, tmdbId)).get();
	if (existing && !existing.deletedAt) {
		if (!existing.watchedAt) castVote(existing.id, userId, 1);
		return existing.id;
	}

	const meta = await fetchMovieMeta(tmdbId);
	const now = new Date();
	return db.transaction((tx) => {
		let id: number;
		if (existing) {
			tx.update(schema.movies)
				.set({
					meta,
					metaRefreshedAt: now,
					addedBy: userId,
					addedAt: now,
					deletedAt: null,
					watchedAt: null,
					watchedNightId: null
				})
				.where(eq(schema.movies.id, existing.id))
				.run();
			id = existing.id;
		} else {
			id = tx
				.insert(schema.movies)
				.values({ tmdbId, meta, addedBy: userId, addedAt: now, metaRefreshedAt: now })
				.returning({ id: schema.movies.id })
				.get().id;
		}
		tx.insert(schema.votes)
			.values({ movieId: id, userId, value: 1 })
			.onConflictDoUpdate({
				target: [schema.votes.userId, schema.votes.movieId],
				set: { value: 1, updatedAt: now }
			})
			.run();
		return id;
	});
}

function isOpenForVoting(movieId: number) {
	const m = db
		.select({ watchedAt: schema.movies.watchedAt, deletedAt: schema.movies.deletedAt })
		.from(schema.movies)
		.where(eq(schema.movies.id, movieId))
		.get();
	return !!m && !m.watchedAt && !m.deletedAt;
}

/** Sets a vote; voting the same value again clears it. Watched movies are frozen. */
export function castVote(movieId: number, userId: number, value: VoteValue, toggle = false) {
	if (!isOpenForVoting(movieId)) return false;
	const current = db
		.select()
		.from(schema.votes)
		.where(and(eq(schema.votes.movieId, movieId), eq(schema.votes.userId, userId)))
		.get();
	if (toggle && current?.value === value) {
		db.delete(schema.votes)
			.where(and(eq(schema.votes.movieId, movieId), eq(schema.votes.userId, userId)))
			.run();
		return true;
	}
	db.insert(schema.votes)
		.values({ movieId, userId, value })
		.onConflictDoUpdate({
			target: [schema.votes.userId, schema.votes.movieId],
			set: { value, updatedAt: new Date() }
		})
		.run();
	return true;
}

export function toggleSeen(movieId: number, userId: number) {
	const where = and(eq(schema.seen.movieId, movieId), eq(schema.seen.userId, userId));
	const current = db.select().from(schema.seen).where(where).get();
	if (current) db.delete(schema.seen).where(where).run();
	else db.insert(schema.seen).values({ movieId, userId, source: 'self' }).run();
}

/**
 * The group watched it: archive the movie, mark the next night's attendees as
 * having seen it, and roll over to a new night with the same attendees.
 */
export function markWatched(movieId: number) {
	if (!isOpenForVoting(movieId)) return;
	db.transaction((tx) => {
		const night = openNight(tx);
		const attendees = tx
			.select({ userId: schema.nightAttendees.userId })
			.from(schema.nightAttendees)
			.where(eq(schema.nightAttendees.nightId, night.id))
			.all();
		tx.update(schema.movies)
			.set({ watchedAt: new Date(), watchedNightId: night.id })
			.where(eq(schema.movies.id, movieId))
			.run();
		for (const { userId } of attendees) {
			tx.insert(schema.seen)
				.values({ movieId, userId, source: 'night', nightId: night.id })
				.onConflictDoNothing()
				.run();
		}
		closeNightWith(tx, night.id, movieId);
	});
}

/** Reverts a group watch: the movie returns to the picks and the night's seen marks go away. */
export function undoWatched(movieId: number) {
	db.transaction((tx) => {
		const movie = tx.select().from(schema.movies).where(eq(schema.movies.id, movieId)).get();
		if (!movie?.watchedAt) return;
		if (movie.watchedNightId) {
			tx.delete(schema.seen)
				.where(
					and(
						eq(schema.seen.movieId, movieId),
						eq(schema.seen.source, 'night'),
						eq(schema.seen.nightId, movie.watchedNightId)
					)
				)
				.run();
			tx.update(schema.nights)
				.set({ movieId: null })
				.where(eq(schema.nights.id, movie.watchedNightId))
				.run();
		}
		tx.update(schema.movies)
			.set({ watchedAt: null, watchedNightId: null })
			.where(eq(schema.movies.id, movieId))
			.run();
	});
}

export function removeMovie(movieId: number) {
	db.update(schema.movies)
		.set({ deletedAt: new Date() })
		.where(eq(schema.movies.id, movieId))
		.run();
}

const WEEK = 7 * 24 * 60 * 60 * 1000;

/** Refreshes TMDB metadata older than a week, a few movies per run to stay gentle on the API. */
export async function refreshStaleMeta(limit = 10) {
	const stale = db
		.select({ id: schema.movies.id, tmdbId: schema.movies.tmdbId })
		.from(schema.movies)
		.where(
			and(
				isNull(schema.movies.deletedAt),
				// Stale, or cached before `releaseDate` / credits / providers / age rating / home releases existed (a JSON null means TMDB has none).
				or(
					sql`${schema.movies.metaRefreshedAt} < ${Date.now() - WEEK}`,
					sql`json_type(${schema.movies.meta}, '$.releaseDate') IS NULL`,
					sql`json_type(${schema.movies.meta}, '$.cast') IS NULL`,
					// Credits cached as bare names, before person links.
					sql`json_type(${schema.movies.meta}, '$.cast[0]') = 'text'`,
					sql`json_type(${schema.movies.meta}, '$.directors[0]') = 'text'`,
					sql`json_type(${schema.movies.meta}, '$.watch') IS NULL`,
					sql`json_type(${schema.movies.meta}, '$.ageRating') IS NULL`,
					sql`json_type(${schema.movies.meta}, '$.releases.home') IS NULL`
				)
			)
		)
		.limit(limit)
		.all();
	for (const m of stale) {
		try {
			const meta = await fetchMovieMeta(m.tmdbId);
			db.update(schema.movies)
				.set({ meta, metaRefreshedAt: new Date() })
				.where(eq(schema.movies.id, m.id))
				.run();
		} catch (e) {
			console.error(`Metadata refresh failed for ${m.tmdbId}`, e);
		}
	}
}
