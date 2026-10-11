import { describe, expect, it } from 'vitest';
import { computeAvailability, tmdbIdsFromPlexGuids } from './availability.ts';

describe('computeAvailability', () => {
	const radarr = [
		{ id: 1, tmdbId: 100, hasFile: true, monitored: false },
		{ id: 2, tmdbId: 200, hasFile: false, monitored: true },
		{ id: 3, tmdbId: 300, hasFile: false, monitored: true },
		{ id: 4, tmdbId: 400, hasFile: false, monitored: false }
	];

	it('ranks plex over downloading over requested', () => {
		const result = computeAvailability([500, 300], radarr, [{ movieId: 2 }, {}]);
		expect(Object.fromEntries(result)).toEqual({
			100: 'plex',
			200: 'downloading',
			300: 'plex',
			500: 'plex'
		});
	});

	it('ignores unmonitored movies without a file', () => {
		expect(computeAvailability([], radarr, []).has(400)).toBe(false);
	});
});

describe('tmdbIdsFromPlexGuids', () => {
	it('picks the tmdb guid', () => {
		expect(
			tmdbIdsFromPlexGuids([{ id: 'imdb://tt0050083' }, { id: 'tmdb://389' }, { id: 'tvdb://572' }])
		).toEqual([389]);
	});

	it('handles items without guids', () => {
		expect(tmdbIdsFromPlexGuids(undefined)).toEqual([]);
	});
});
