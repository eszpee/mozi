import { activeMovies } from '#lib/server/movies.ts';
import { attendeeIds, openNight } from '#lib/server/nights.ts';
import { activeMembers, toMember } from '#lib/server/users.ts';
import { attend, vote } from '#lib/server/actions.ts';
import { isSortKey, rank } from '#lib/scoring.ts';

export function load({ locals, url }) {
	const me = locals.user!;
	const sortParam = url.searchParams.get('sort');
	const sort = isSortKey(sortParam) ? sortParam : 'best';
	const scope = url.searchParams.get('scope') === 'night' ? 'night' : 'everyone';
	const needsVote = url.searchParams.has('needs-vote');
	const inPlex = url.searchParams.has('plex');

	const night = openNight();
	const attendees = attendeeIds(night.id);
	// With nobody marked as attending yet, the night scope falls back to everyone.
	const voters = scope === 'night' && attendees.size > 0 ? attendees : undefined;

	let movies = activeMovies(me.id, voters);
	const total = movies.length;
	if (needsVote) movies = movies.filter((m) => m.myVote === null);
	if (inPlex) movies = movies.filter((m) => m.availability === 'plex');

	const ranked = rank(
		movies.map((m) => ({ movie: m, tally: m.rankTally, addedAt: m.addedAt })),
		sort
	).map((r) => r.movie);

	return {
		movies: ranked,
		total,
		unvoted: activeMovies(me.id).filter((m) => m.myVote === null).length,
		sort,
		scope,
		needsVote,
		inPlex,
		night: {
			label: night.label,
			date: night.date,
			attendees: [...attendees]
		},
		members: activeMembers().map(toMember)
	};
}

export const actions = { vote, attend };
