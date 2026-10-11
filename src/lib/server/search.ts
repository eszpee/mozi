import { displayTitle } from '#lib/titles.ts';
import { searchMovies } from '#lib/server/tmdb.ts';
import { existingTmdbIds } from '#lib/server/movies.ts';
import { availabilityMap } from '#lib/server/arr.ts';

export type SearchHit = Awaited<ReturnType<typeof search>>[number];

/** TMDB search decorated with what the group already has (listed, watched, in Plex). */
export async function search(query: string) {
	const q = query.trim().slice(0, 100);
	if (q.length < 2) return [];
	const [results, existing, avail] = [await searchMovies(q), existingTmdbIds(), availabilityMap()];
	return results.map((r) => {
		const listed = existing.get(r.tmdbId);
		return {
			tmdbId: r.tmdbId,
			title: displayTitle({ ...r, huTitle: null }),
			year: r.year,
			posterPath: r.posterPath,
			availability: avail.get(r.tmdbId) ?? null,
			listedId: listed?.id ?? null,
			watched: listed?.watched ?? false
		};
	});
}
