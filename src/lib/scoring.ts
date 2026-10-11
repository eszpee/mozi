export type VoteValue = 1 | 0 | -1;
export type Vote = { userId: number; value: VoteValue };

export const SORTS = {
	best: 'Best bet',
	liked: 'Most liked',
	hated: 'Least hated',
	controversial: 'Most controversial',
	rated: 'Highest rated',
	newest: 'Newest'
} as const;
export type SortKey = keyof typeof SORTS;

export const isSortKey = (s: string | null): s is SortKey => !!s && s in SORTS;

export type Tally = { up: number; meh: number; down: number; score: number };

/** A 👎 weighs more than a 👍: one strong veto should sink a movie faster than one fan lifts it. */
export const DOWN_WEIGHT = 1.5;

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

/** `rating` is the TMDB rating (0–10), used by the "Highest rated" sort. */
type Rankable = { tally: Tally; addedAt: number; rating?: number | null };

const byNewest = (a: Rankable, b: Rankable) => b.addedAt - a.addedAt;

const COMPARATORS: Record<SortKey, (a: Rankable, b: Rankable) => number> = {
	best: (a, b) => b.tally.score - a.tally.score || b.tally.up - a.tally.up || byNewest(a, b),
	liked: (a, b) => b.tally.up - a.tally.up || a.tally.down - b.tally.down || byNewest(a, b),
	hated: (a, b) => a.tally.down - b.tally.down || b.tally.up - a.tally.up || byNewest(a, b),
	controversial: (a, b) =>
		Math.min(b.tally.up, b.tally.down) - Math.min(a.tally.up, a.tally.down) ||
		total(b.tally) - total(a.tally) ||
		byNewest(a, b),
	// Unrated movies go last.
	rated: (a, b) =>
		(b.rating ?? -1) - (a.rating ?? -1) || b.tally.score - a.tally.score || byNewest(a, b),
	newest: byNewest
};

function total(t: Tally) {
	return t.up + t.meh + t.down;
}

/** Returns a new array sorted by `key`; ties fall back to newest first. */
export function rank<T extends Rankable>(items: T[], key: SortKey): T[] {
	return [...items].sort(COMPARATORS[key]);
}
