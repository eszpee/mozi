import { describe, expect, it } from 'vitest';
import { formatRelease, languageName, personUrl, providerUrl } from './ui.ts';

describe('languageName', () => {
	it('names languages in Hungarian', () => {
		expect(languageName('pt')).toBe('portugál');
		expect(languageName('hu')).toBe('magyar');
		expect(languageName('ja')).toBe('japán');
	});

	it('maps TMDB’s nonstandard Cantonese code', () => {
		expect(languageName('cn')).toBe('kantoni');
	});

	it('hides missing or unknown languages', () => {
		expect(languageName('xx')).toBeNull();
		expect(languageName(null)).toBeNull();
		expect(languageName('')).toBeNull();
	});
});

describe('providerUrl', () => {
	it('searches the service for the title', () => {
		expect(providerUrl('Netflix', 'Inception', null)).toBe(
			'https://www.netflix.com/search?q=Inception'
		);
		expect(providerUrl('HBO Max', 'Son of Saul', null)).toBe(
			'https://play.hbomax.com/search?q=Son%20of%20Saul'
		);
		expect(providerUrl('Google Play Movies', 'Amélie', null)).toBe(
			'https://play.google.com/store/search?q=Am%C3%A9lie&c=movies'
		);
	});

	it('treats tiers and renamed services as the same service', () => {
		expect(providerUrl('Netflix basic with Ads', 'Dune', null)).toContain('netflix.com');
		expect(providerUrl('Max', 'Dune', null)).toContain('hbomax.com');
		expect(providerUrl('Apple TV Plus', 'Dune', null)).toContain('tv.apple.com');
	});

	it('falls back to the TMDB watch page for unknown services', () => {
		const tmdb = 'https://www.themoviedb.org/movie/27205/watch?locale=HU';
		expect(providerUrl('Filmio', 'Inception', tmdb)).toBe(tmdb);
		expect(providerUrl('Filmio', 'Inception', null)).toBeNull();
	});
});

describe('personUrl', () => {
	it('prefers IMDb, falls back to TMDB, and gives nothing for a bare name', () => {
		expect(personUrl({ tmdbId: 2419, imdbId: 'nm0000466' })).toBe(
			'https://www.imdb.com/name/nm0000466/'
		);
		expect(personUrl({ tmdbId: 2419, imdbId: null })).toBe(
			'https://www.themoviedb.org/person/2419'
		);
		expect(personUrl({ tmdbId: null, imdbId: null })).toBeNull();
	});
});

describe('formatRelease', () => {
	it('names the countries of the first release, then Hungary’s date', () => {
		expect(formatRelease({ date: '2026-10-03', countries: ['US', 'GB'], hu: '2026-10-16' })).toBe(
			'2026. okt. 3. (US, GB) · 2026. okt. 16. (HU)'
		);
		expect(formatRelease({ date: '2026-10-03', countries: ['US'], hu: null })).toBe(
			'2026. okt. 3. (US)'
		);
	});

	it('is just the date when Hungary was among the first', () => {
		expect(formatRelease({ date: '2026-10-03', countries: ['US', 'HU'], hu: null })).toBe(
			'2026. okt. 3.'
		);
	});

	it('shortens long country lists', () => {
		expect(
			formatRelease({ date: '2026-10-03', countries: ['US', 'GB', 'DE', 'FR', 'IT'], hu: null })
		).toBe('2026. okt. 3. (US, GB, DE +2)');
	});
});
