export type AvailabilityStatus = 'plex' | 'downloading' | 'requested' | 'waiting';
/** `expected` is the first home release (YYYY-MM-DD) of a movie that isn't out yet. */
export type Availability = { status: AvailabilityStatus; expected: string | null };

export type RadarrMovie = {
	id: number;
	tmdbId: number;
	hasFile: boolean;
	monitored: boolean;
	/** Released by the movie's minimum availability, so Radarr searches for it. */
	isAvailable?: boolean;
	inCinemas?: string;
	digitalRelease?: string;
	physicalRelease?: string;
};
export type RadarrQueueItem = { movieId?: number };

/** The earlier of the digital and physical release dates, if Radarr knows either. */
function firstHomeRelease(m: RadarrMovie): string | null {
	const dates = [m.digitalRelease, m.physicalRelease]
		.filter((d): d is string => !!d)
		.map((d) => d.slice(0, 10))
		.sort();
	return dates[0] ?? null;
}

/**
 * Merges Plex and Radarr into one status per TMDB id, strongest first:
 * playable in Plex > downloading > requested (monitored in Radarr, no file yet),
 * or waiting when the requested movie isn't released yet, so nothing can be found.
 * Movies Radarr has a file for count as Plex too, since Plex reads the same folder.
 */
export function computeAvailability(
	plexTmdbIds: Iterable<number>,
	radarrMovies: RadarrMovie[],
	queue: RadarrQueueItem[]
): Map<number, Availability> {
	const result = new Map<number, Availability>();
	const set = (tmdbId: number, status: AvailabilityStatus, expected: string | null = null) =>
		result.set(tmdbId, { status, expected });
	const downloading = new Set(queue.map((q) => q.movieId).filter((id) => id !== undefined));

	for (const m of radarrMovies) {
		if (m.hasFile) set(m.tmdbId, 'plex');
		else if (downloading.has(m.id)) set(m.tmdbId, 'downloading');
		else if (m.monitored && m.isAvailable === false) set(m.tmdbId, 'waiting', firstHomeRelease(m));
		else if (m.monitored) set(m.tmdbId, 'requested');
	}
	for (const id of plexTmdbIds) set(id, 'plex');
	return result;
}

/** Extracts TMDB ids from Plex `Guid` entries like `{ id: 'tmdb://389' }`. */
export function tmdbIdsFromPlexGuids(guids: { id: string }[] | undefined): number[] {
	return (guids ?? [])
		.map((g) => /^tmdb:\/\/(\d+)$/.exec(g.id)?.[1])
		.filter((x): x is string => !!x)
		.map(Number);
}
