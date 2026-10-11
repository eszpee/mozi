import { describe, expect, it } from 'vitest';
import { pickAgeRating } from './age-rating.ts';

const country = (iso_3166_1: string, ...certs: string[]) => ({
	iso_3166_1,
	release_dates: certs.map((certification) => ({ certification }))
});

describe('pickAgeRating', () => {
	it('uses the Hungarian rating', () => {
		expect(pickAgeRating([country('US', 'R'), country('HU', '', '16')])).toBe(16);
	});

	it('reads KN as all ages and X as adults only', () => {
		expect(pickAgeRating([country('HU', 'KN')])).toBe(0);
		expect(pickAgeRating([country('HU', 'X')])).toBe(18);
	});

	it('falls back to the German rating, which uses the same ages', () => {
		expect(pickAgeRating([country('DE', '12'), country('US', 'PG-13')])).toBe(12);
		expect(pickAgeRating([country('HU', ''), country('DE', '0')])).toBe(0);
	});

	it('is null without a usable rating', () => {
		expect(pickAgeRating([country('US', 'R')])).toBeNull();
		expect(pickAgeRating([country('HU', 'unknown')])).toBeNull();
		expect(pickAgeRating(undefined)).toBeNull();
	});
});
