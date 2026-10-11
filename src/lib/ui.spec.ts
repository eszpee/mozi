import { describe, expect, it } from 'vitest';
import { languageName } from './ui.ts';

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
