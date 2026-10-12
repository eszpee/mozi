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
	const status = (m: ReturnType<typeof computeAvailability>) =>
		Object.fromEntries([...m].map(([id, a]) => [id, a.status]));

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

	it('waits for a movie Radarr does not count as released yet, with its first home release', () => {
		const result = computeAvailability(
			[],
			[
				{
					id: 7,
					tmdbId: 700,
					hasFile: false,
					monitored: true,
					isAvailable: false,
					inCinemas: '2026-07-15T00:00:00Z',
					digitalRelease: '2026-11-17T00:00:00Z',
					physicalRelease: '2026-12-01T00:00:00Z'
				},
				{ id: 8, tmdbId: 800, hasFile: false, monitored: true, isAvailable: false },
				{ id: 9, tmdbId: 900, hasFile: false, monitored: true, isAvailable: false },
				{
					id: 10,
					tmdbId: 1000,
					hasFile: false,
					monitored: true,
					isAvailable: false,
					digitalRelease: '2027-01-10T00:00:00Z',
					physicalRelease: '2026-12-20T00:00:00Z'
				}
			],
			[{ movieId: 9 }]
		);
		expect(Object.fromEntries(result)).toEqual({
			700: { status: 'waiting', expected: '2026-11-17' },
			800: { status: 'waiting', expected: null },
			900: { status: 'downloading', expected: null },
			1000: { status: 'waiting', expected: '2026-12-20' }
		});
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
