import type { MovieMeta } from '#lib/server/db/schema.ts';

/** A tiny offline catalog for development and e2e tests (used only when no TMDB token is set). */
export const FIXTURE_MOVIES: { tmdbId: number; meta: MovieMeta }[] = [
	{
		tmdbId: 194,
		meta: {
			title: 'Amélie',
			originalTitle: 'Le Fabuleux Destin d’Amélie Poulain',
			originalLanguage: 'fr',
			huTitle: 'Amélie csodálatos élete',
			year: 2001,
			runtime: 122,
			genres: ['Comedy', 'Romance'],
			overview: 'A shy waitress decides to change the lives of those around her for the better.',
			posterPath: null,
			rating: 7.9,
			imdbId: 'tt0211915',
			trailerKey: null
		}
	},
	{
		tmdbId: 18843,
		meta: {
			title: 'Kontroll',
			originalTitle: 'Kontroll',
			originalLanguage: 'hu',
			huTitle: 'Kontroll',
			year: 2003,
			runtime: 111,
			genres: ['Comedy', 'Crime', 'Thriller'],
			overview: 'Ticket inspectors patrol the Budapest metro.',
			posterPath: null,
			rating: 7.5,
			imdbId: 'tt0373981',
			trailerKey: null
		}
	},
	{
		tmdbId: 693134,
		meta: {
			title: 'Dune: Part Two',
			originalTitle: 'Dune: Part Two',
			originalLanguage: 'en',
			huTitle: 'Dűne: Második rész',
			year: 2024,
			runtime: 167,
			genres: ['Science Fiction', 'Adventure'],
			overview: 'Paul Atreides unites with the Fremen.',
			posterPath: null,
			rating: 8.1,
			imdbId: 'tt15239678',
			trailerKey: null
		}
	},
	{
		tmdbId: 389,
		meta: {
			title: '12 Angry Men',
			originalTitle: '12 Angry Men',
			originalLanguage: 'en',
			huTitle: 'Tizenkét dühös ember',
			year: 1957,
			runtime: 97,
			genres: ['Drama'],
			overview: 'A jury holdout attempts to prevent a miscarriage of justice.',
			posterPath: null,
			rating: 8.5,
			imdbId: 'tt0050083',
			trailerKey: null
		}
	}
];
