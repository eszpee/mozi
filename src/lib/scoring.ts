export type VoteValue = 1 | 0 | -1;
export type Vote = { userId: number; value: VoteValue };

export const SORTS = {
	best: 'Legjobb tipp',
	liked: 'Legnépszerűbb',
	hated: 'Legkevésbé utált',
	controversial: 'Legmegosztóbb',
	rated: 'Legjobb értékelés',
	released: 'Legújabb',
	added: 'Legutóbb ajánlott'
} as const;
export type SortKey = keyof typeof SORTS;

export const isSortKey = (s: string | null): s is SortKey => !!s && s in SORTS;

export type Tally = { up: number; meh: number; down: number; score: number };

/** A 👎 weighs more than a 👍: one strong veto should sink a movie faster than one fan lifts it. */
export const DOWN_WEIGHT = 1.5;

/**
 * "Best bet" weights. Votes dominate: a 🤷 is a small plus (more people fine with it
 * beats fewer voters), and the TMDB rating only breaks near-ties: even a 4-point
 * rating gap (0.8) is worth less than one 👍.
 */
export const MEH_WEIGHT = 0.25;
export const RATING_WEIGHT = 0.2;
export const RATING_PIVOT = 6.5;
/** Per person who has already seen it: two viewers cancel out one 👍. */
export const SEEN_WEIGHT = 0.5;

export function bestBetScore(t: Tally, rating?: number | null, seen = 0): number {
	const ratingBonus = rating == null ? 0 : RATING_WEIGHT * (rating - RATING_PIVOT);
	return t.up + MEH_WEIGHT * t.meh - DOWN_WEIGHT * t.down + ratingBonus - SEEN_WEIGHT * seen;
}

/** Counts votes, optionally only those cast by `voters` (e.g. the next night's attendees). */
export function tally(votes: Vote[], voters?: ReadonlySet<number>): Tally {
	let up = 0;
	let meh = 0;
	let down = 0;
	for (const v of votes) {
		if (voters && !voters.has(v.userId)) continue;
		if (v.value === 1) up++;
		else if (v.value === -1) down++;
		else meh++;
	}
	return { up, meh, down, score: up - DOWN_WEIGHT * down };
}

/**
 * `rating` is the TMDB rating (0–10); `released` is an ISO date or just a year.
 * Both are optional and missing values sort last.
 */
type Rankable = {
	tally: Tally;
	addedAt: number;
	rating?: number | null;
	released?: string | null;
	/** People (in the ranking scope) who have already seen it. */
	seen?: number;
};

const byNewest = (a: Rankable, b: Rankable) => b.addedAt - a.addedAt;

const COMPARATORS: Record<SortKey, (a: Rankable, b: Rankable) => number> = {
	best: (a, b) =>
		bestBetScore(b.tally, b.rating, b.seen) - bestBetScore(a.tally, a.rating, a.seen) ||
		b.tally.up - a.tally.up ||
		byNewest(a, b),
	liked: (a, b) => b.tally.up - a.tally.up || a.tally.down - b.tally.down || byNewest(a, b),
	hated: (a, b) => a.tally.down - b.tally.down || b.tally.up - a.tally.up || byNewest(a, b),
	controversial: (a, b) =>
		Math.min(b.tally.up, b.tally.down) - Math.min(a.tally.up, a.tally.down) ||
		total(b.tally) - total(a.tally) ||
		byNewest(a, b),
	// Unrated movies go last.
	rated: (a, b) =>
		(b.rating ?? -1) - (a.rating ?? -1) || b.tally.score - a.tally.score || byNewest(a, b),
	released: (a, b) => (b.released ?? '').localeCompare(a.released ?? '') || byNewest(a, b),
	added: byNewest
};

function total(t: Tally) {
	return t.up + t.meh + t.down;
}

/** Returns a new array sorted by `key`; ties fall back to newest first. */
export function rank<T extends Rankable>(items: T[], key: SortKey): T[] {
	return [...items].sort(COMPARATORS[key]);
}
