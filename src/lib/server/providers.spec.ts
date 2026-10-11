import { describe, expect, it } from 'vitest';
import { summarizeProviders } from './providers.ts';

const p = (provider_name: string, display_priority: number) => ({
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
				{ name: 'Netflix', logo: '/netflix.jpg' },
				{ name: 'HBO Max', logo: '/hbomax.jpg' },
				{ name: 'Filmio', logo: '/filmio.jpg' }
			],
			rent: [
				{ name: 'Apple TV', logo: '/appletv.jpg' },
				{ name: 'Google Play Movies', logo: '/googleplaymovies.jpg' }
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
