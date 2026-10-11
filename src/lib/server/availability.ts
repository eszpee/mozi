export type AvailabilityStatus = 'plex' | 'downloading' | 'requested';

export type RadarrMovie = { id: number; tmdbId: number; hasFile: boolean; monitored: boolean };
export type RadarrQueueItem = { movieId?: number };

/**
 * Merges Plex and Radarr into one status per TMDB id, strongest first:
 * playable in Plex > downloading > requested (monitored in Radarr, no file yet).
 * Movies Radarr has a file for count as Plex too, since Plex reads the same folder.
 */
export function computeAvailability(
	plexTmdbIds: Iterable<number>,
	radarrMovies: RadarrMovie[],
	queue: RadarrQueueItem[]
): Map<number, AvailabilityStatus> {
	const result = new Map<number, AvailabilityStatus>();
	const downloading = new Set(queue.map((q) => q.movieId).filter((id) => id !== undefined));

	for (const m of radarrMovies) {
		if (m.hasFile) result.set(m.tmdbId, 'plex');
		else if (downloading.has(m.id)) result.set(m.tmdbId, 'downloading');
		else if (m.monitored) result.set(m.tmdbId, 'requested');
	}
	for (const id of plexTmdbIds) result.set(id, 'plex');
	return result;
}

/** Extracts TMDB ids from Plex `Guid` entries like `{ id: 'tmdb://389' }`. */
export function tmdbIdsFromPlexGuids(guids: { id: string }[] | undefined): number[] {
	return (guids ?? [])
		.map((g) => /^tmdb:\/\/(\d+)$/.exec(g.id)?.[1])
		.filter((x): x is string => !!x)
		.map(Number);
}
