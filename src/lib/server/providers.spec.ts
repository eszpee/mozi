import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseWatchLinks, summarizeProviders } from './providers.ts';

const p = (provider_name: string, display_priority: number) => ({
	provider_id: display_priority,
	provider_name,
	display_priority,
	logo_path: `/${provider_name.toLowerCase().replace(/\W/g, '')}.jpg`
});

describe('summarizeProviders', () => {
	it('splits subscription and free services from rent and buy stores', () => {
		const result = summarizeProviders({
			link: 'https://www.themoviedb.org/movie/27205/watch?locale=HU',
			flatrate: [p('HBO Max', 2), p('Netflix', 1)],
			free: [p('Filmio', 9)],
			rent: [p('Apple TV', 4), p('Google Play Movies', 5)],
			buy: [p('Apple TV', 4)]
		});
		expect(result).toEqual({
			link: 'https://www.themoviedb.org/movie/27205/watch?locale=HU',
			stream: [
				{ name: 'Netflix', logo: '/netflix.jpg', url: null },
				{ name: 'HBO Max', logo: '/hbomax.jpg', url: null },
				{ name: 'Filmio', logo: '/filmio.jpg', url: null }
			],
			rent: [
				{ name: 'Apple TV', logo: '/appletv.jpg', url: null },
				{ name: 'Google Play Movies', logo: '/googleplaymovies.jpg', url: null }
			]
		});
	});

	it('drops ad-supported tiers of a service already listed', () => {
		const result = summarizeProviders({
			flatrate: [p('Netflix', 1), p('Netflix basic with Ads', 3)]
		});
		expect(result.stream.map((s) => s.name)).toEqual(['Netflix']);
	});

	it('does not repeat a subscription service among the stores', () => {
		const result = summarizeProviders({
			flatrate: [p('Amazon Prime Video', 1)],
			rent: [p('Amazon Prime Video', 1), p('Apple TV', 4)]
		});
		expect(result.rent.map((s) => s.name)).toEqual(['Apple TV']);
	});

	it('is empty when the movie is not offered in the country', () => {
		expect(summarizeProviders(undefined)).toEqual({ link: null, stream: [], rent: [] });
	});
});

describe('parseWatchLinks', () => {
	const html = readFileSync(
		new URL('./fixtures/tmdb-watch-inception-hu.html', import.meta.url),
		'utf8'
	);

	it("reads each provider's deep link from TMDB's watch page, by provider id", () => {
		const links = parseWatchLinks(html);
		expect(links.get(1899)).toBe(
			'https://play.hbomax.com/show/14552c93-d318-4563-a00b-343df7e35d0b?utm_source=universal_search'
		);
		expect(links.get(2)).toMatch(/^https:\/\/tv\.apple\.com\/hu\/movie\/inception\//);
		expect(links.get(3)).toMatch(/^https:\/\/play\.google\.com\/store\/movies\/details\//);
		expect(links.size).toBe(5);
	});

	it('ignores anything that is not a valid JustWatch click-out link', () => {
		const junk =
			'<a href="https://click.justwatch.com/a?cx=notbase64&r=https%3A%2F%2Fx.com"></a>' +
			'<a href="https://click.justwatch.com/a?r=javascript%3Aalert(1)"></a>';
		expect(parseWatchLinks(junk).size).toBe(0);
	});
});

describe('summarizeProviders with deep links', () => {
	it('attaches the deep link to the matching provider', () => {
		const result = summarizeProviders(
			{ flatrate: [{ ...p('HBO Max', 1), provider_id: 1899 }] },
			new Map([[1899, 'https://play.hbomax.com/show/x']])
		);
		expect(result.stream[0].url).toBe('https://play.hbomax.com/show/x');
	});
});
