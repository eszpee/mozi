import { activeMovies } from '#lib/server/movies.ts';
import { attendeeIds, openNight } from '#lib/server/nights.ts';
import { activeMembers, toMember } from '#lib/server/users.ts';
import { attend, vote } from '#lib/server/actions.ts';
import { isSortKey } from '#lib/scoring.ts';

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

	// Filtering and ranking happen in the page, so it can keep the order stable
	// while people vote (see stable-order.ts).
	return {
		movies: activeMovies(me.id, voters),
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
