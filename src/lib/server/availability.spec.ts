import { describe, expect, it } from 'vitest';
import { computeAvailability, tmdbIdsFromPlexGuids } from './availability.ts';

describe('computeAvailability', () => {
	const radarr = [
		{ id: 1, tmdbId: 100, hasFile: true, monitored: false, isAvailable: true },
		{ id: 2, tmdbId: 200, hasFile: false, monitored: true, isAvailable: true },
		{ id: 3, tmdbId: 300, hasFile: false, monitored: true, isAvailable: true },
		{ id: 4, tmdbId: 400, hasFile: false, monitored: false, isAvailable: true },
		{ id: 5, tmdbId: 600, hasFile: false, monitored: true, isAvailable: true }
	];
	const status = (m: ReturnType<typeof computeAvailability>) => Object.fromEntries(m);

	it('ranks plex over downloading over requested', () => {
		const result = computeAvailability([500, 300], radarr, [{ movieId: 2 }, {}]);
		expect(status(result)).toEqual({
			100: 'plex',
			200: 'downloading',
			300: 'plex',
			500: 'plex',
			600: 'requested'
		});
	});

	it('ignores unmonitored movies without a file', () => {
		expect(computeAvailability([], radarr, []).has(400)).toBe(false);
	});

	it('waits for a movie Radarr does not count as released yet', () => {
		const result = computeAvailability(
			[],
			[
				{ id: 8, tmdbId: 800, hasFile: false, monitored: true, isAvailable: false },
				{ id: 9, tmdbId: 900, hasFile: false, monitored: true, isAvailable: false }
			],
			[{ movieId: 9 }]
		);
		expect(Object.fromEntries(result)).toEqual({ 800: 'waiting', 900: 'downloading' });
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
