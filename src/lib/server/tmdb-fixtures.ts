import type { MovieMeta } from '#lib/server/db/schema.ts';

/**
 * A small offline catalog for development and e2e tests, used only when no TMDB
 * token is set. Real TMDB data (snapshot), so posters and links work in dev.
 */
export const FIXTURE_MOVIES: { tmdbId: number; meta: MovieMeta }[] = [
	{
		tmdbId: 194,
		meta: {
			title: 'Amélie',
			originalTitle: "Le Fabuleux Destin d'Amélie Poulain",
			originalLanguage: 'fr',
			huTitle: 'Amelie csodálatos élete',
			year: 2001,
			runtime: 122,
			genres: ['Comedy', 'Romance'],
			overview:
				'At a tiny Parisian café, the adorable yet painfully shy Amélie accidentally discovers a gift for helping others. Soon Amelie is spending her days as a matchmaker, guardian angel, and all-around do-gooder. But when she bumps into a handsome stranger, will she find the courage to become the star of her very own love story?',
			posterPath: '/nSxDa3M9aMvGVLoItzWTepQ5h5d.jpg',
			rating: 7.9,
			imdbId: 'tt0211915',
			trailerKey: '555A7T_kmIc',
			directors: ['Jean-Pierre Jeunet'],
			cast: ['Audrey Tautou', 'Mathieu Kassovitz', 'Rufus'],
			providers: {
				link: null,
				stream: [],
				rent: [{ name: 'Apple TV', logo: '/9ghgSC0MA082EL6HLCW3GalykFD.jpg' }]
			},
			ageRating: 12
		}
	},
	{
		tmdbId: 5204,
		meta: {
			title: 'Kontroll',
			originalTitle: 'Kontroll',
			originalLanguage: 'hu',
			huTitle: 'Kontroll',
			year: 2003,
			runtime: 107,
			genres: ['Comedy', 'Crime', 'Drama', 'Thriller'],
			overview:
				'Ki ne érezte volna már úgy egy adott pillanatban, rövid vagy hosszabb élete során, hogy ki kell lépnie megszokott környezetéből. El kell bújnia a világ elől. Menekülni a múlt elől, saját maga elől és a jelenből egyaránt. "Eltűnni a föld színéről". Bulcsú (20 év körül) életében is elérkezett ez a pillanat.A film a mese és a valóság speciális keveréke. Történet egy furcsa fiatalemberről, Bulcsúról, az ellenőr társakról egy rivális ellenőr csapatról, és mindarról, ami körülöttük van. Az utazók és a jegyellenőrök -jól ismert- drámai, de legtöbbször komikus viszonyáról. Egy kegyetlen gyilkológépről, aki utasokat lök a metró elé, és a metróvezetőség embereiről, akik számára csak egyetlen fontos szempont létezik az utasok metróba vetett hite.',
			posterPath: '/wtK8xY4gxSw9Sm85sNjinknQjRq.jpg',
			rating: 7.2,
			imdbId: 'tt0373981',
			trailerKey: 'Dx5Rt2BPLLc',
			directors: ['Nimród Antal'],
			cast: ['Sándor Csányi', 'Zoltán Mucsi', 'Csaba Pindroch'],
			providers: { link: null, stream: [], rent: [] },
			ageRating: 16
		}
	},
	{
		tmdbId: 336050,
		meta: {
			title: 'Son of Saul',
			originalTitle: 'Saul fia',
			originalLanguage: 'hu',
			huTitle: 'Saul fia',
			year: 2015,
			runtime: 107,
			genres: ['War', 'Drama', 'Thriller'],
			overview:
				'1944, Auschwitz-Birkenau. Saul Auslander egyike a krematóriumokban dolgozó sonderkommandósoknak. Társai tudják, hogy bármelyik pillanatban kivégezhetik őket, fegyvereket gyűjtenek és lázadást szerveznek. Saul viszont az elégetésre váró holttestek között felfedezni véli saját fiát, és ettől kezdve a férfit a menekülés helyett egy másik lehetetlen küldetés élteti: elhatározza, hogy kicsempészi a testet és keres egy rabbit, hogy méltó módon eltemethesse a gyermeket.',
			posterPath: '/2Wwry3NpctToC0qzMyTOqFxZVdZ.jpg',
			rating: 7.1,
			imdbId: 'tt3808342',
			trailerKey: 'PSabBa9IWYs',
			directors: ['László Nemes'],
			cast: ['Géza Röhrig', 'Levente Molnár', 'Urs Rechn'],
			providers: { link: null, stream: [], rent: [] },
			ageRating: 16
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
			overview:
				'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, Paul endeavors to prevent a terrible future only he can foresee.',
			posterPath: '/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg',
			rating: 8.1,
			imdbId: 'tt15239678',
			trailerKey: 'U2Qp5pL3ovA',
			directors: ['Denis Villeneuve'],
			cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'],
			providers: { link: null, stream: [], rent: [] },
			ageRating: 12
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
			overview:
				"The defense and the prosecution have rested and the jury is filing into the jury room to decide if a young Spanish-American is guilty or innocent of murdering his father. What begins as an open and shut case soon becomes a mini-drama of each of the jurors' prejudices and preconceptions about the trial, the accused, and each other.",
			posterPath: '/zhG3vKWyDRaZYoaww1UVAi29T9h.jpg',
			rating: 8.6,
			imdbId: 'tt0050083',
			trailerKey: 'TEN-2uTi2c0',
			directors: ['Sidney Lumet'],
			cast: ['Henry Fonda', 'Lee J. Cobb', 'Martin Balsam'],
			providers: { link: null, stream: [], rent: [] },
			ageRating: 0
		}
	},
	{
		tmdbId: 27205,
		meta: {
			title: 'Inception',
			originalTitle: 'Inception',
			originalLanguage: 'en',
			huTitle: 'Eredet',
			year: 2010,
			runtime: 148,
			genres: ['Action', 'Science Fiction', 'Adventure'],
			overview:
				'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception", the implantation of another person\'s idea into a target\'s subconscious.',
			posterPath: '/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg',
			rating: 8.4,
			imdbId: 'tt1375666',
			trailerKey: 'cdx31ak4KbQ',
			directors: ['Christopher Nolan'],
			cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Ken Watanabe'],
			providers: {
				link: null,
				stream: [{ name: 'Netflix', logo: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg' }],
				rent: [
					{ name: 'Apple TV', logo: '/9ghgSC0MA082EL6HLCW3GalykFD.jpg' },
					{ name: 'Google Play Movies', logo: '/8z7rC8uIDaTM91X0ZfkRf04ydj2.jpg' }
				]
			},
			ageRating: 12
		}
	}
];
