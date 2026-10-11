import { describe, expect, it } from 'vitest';
import { displayTitle } from './titles.ts';

describe('displayTitle', () => {
	it('shows only the Hungarian title for Hungarian-language films', () => {
		expect(
			displayTitle({
				title: 'Kontroll',
				originalTitle: 'Kontroll',
				originalLanguage: 'hu',
				huTitle: 'Kontroll'
			})
		).toEqual({ main: 'Kontroll', original: null });
		expect(
			displayTitle({
				title: 'The Turin Horse',
				originalTitle: 'A torinói ló',
				originalLanguage: 'hu',
				huTitle: 'A torinói ló'
			})
		).toEqual({ main: 'A torinói ló', original: null });
	});

	it('falls back to the original title when a Hungarian film has no Hungarian translation', () => {
		expect(
			displayTitle({
				title: 'Werckmeister Harmonies',
				originalTitle: 'Werckmeister harmóniák',
				originalLanguage: 'hu',
				huTitle: null
			}).main
		).toBe('Werckmeister harmóniák');
	});

	it('shows the English title with the original in parentheses for foreign films', () => {
		expect(
			displayTitle({
				title: 'Amélie',
				originalTitle: 'Le Fabuleux Destin d’Amélie Poulain',
				originalLanguage: 'fr',
				huTitle: 'Amélie csodálatos élete'
			})
		).toEqual({ main: 'Amélie', original: 'Le Fabuleux Destin d’Amélie Poulain' });
	});

	it('omits the original title when it matches the English one', () => {
		expect(
			displayTitle({
				title: 'Dune: Part Two',
				originalTitle: 'Dune: Part Two',
				originalLanguage: 'en',
				huTitle: 'Dűne: Második rész'
			})
		).toEqual({ main: 'Dune: Part Two', original: null });
	});
});
