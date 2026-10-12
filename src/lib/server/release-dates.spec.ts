import { describe, expect, it } from 'vitest';
import { RELEASES_VERSION, pickReleases } from './release-dates.ts';

const country = (iso_3166_1: string, ...dates: [type: number, date: string][]) => ({
	iso_3166_1,
	release_dates: dates.map(([type, date]) => ({
		certification: '',
		type,
		release_date: `${date}T00:00:00.000Z`
	}))
});

describe('pickReleases', () => {
	it('gives the earliest theatrical date with its countries, and the Hungarian one', () => {
		const r = pickReleases([
			country('US', [3, '2026-10-03']),
			country('GB', [3, '2026-10-03']),
			country('DE', [3, '2026-10-09']),
			country('HU', [3, '2026-10-16'])
		]);
		expect(r.theatrical).toEqual({
			date: '2026-10-03',
			countries: ['US', 'GB'],
			hu: '2026-10-16'
		});
	});

	it('leaves out the Hungarian date when Hungary is among the earliest', () => {
		const r = pickReleases([country('US', [3, '2026-10-03']), country('HU', [3, '2026-10-03'])]);
		expect(r.theatrical).toEqual({ date: '2026-10-03', countries: ['US', 'HU'], hu: null });
	});

	it('skips premieres and limited releases when there is a regular one', () => {
		const r = pickReleases([
			country('RO', [2, '2026-06-13'], [3, '2027-01-15']),
			country('FR', [1, '2026-05-18'], [3, '2026-08-19']),
			country('CH', [3, '2026-08-19'])
		]);
		expect(r.theatrical).toEqual({ date: '2026-08-19', countries: ['FR', 'CH'], hu: null });
	});

	it('falls back to limited releases when there is no regular one', () => {
		const r = pickReleases([
			country('US', [1, '2026-01-20'], [2, '2026-03-06']),
			country('GB', [2, '2026-04-10'])
		]);
		expect(r.theatrical).toEqual({ date: '2026-03-06', countries: ['US'], hu: null });
	});

	it('picks the first digital or physical release anywhere as the home release', () => {
		const r = pickReleases([
			country('US', [3, '2026-10-03'], [4, '2026-11-18'], [5, '2026-12-20']),
			country('DE', [5, '2026-11-12']),
			country('HU', [3, '2026-10-16'])
		]);
		expect(r.home).toBe('2026-11-12');
	});

	it('is null where TMDB has no date', () => {
		expect(pickReleases([country('US', [1, '2026-05-20'])])).toEqual({
			v: RELEASES_VERSION,
			theatrical: null,
			home: null
		});
		expect(pickReleases(undefined)).toEqual({ v: RELEASES_VERSION, theatrical: null, home: null });
	});
});
