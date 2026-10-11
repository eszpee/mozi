import { dev } from '$app/env';
import { TMDB_TOKEN } from '$app/env/private';
import type { MovieMeta } from '#lib/server/db/schema.ts';
import { FIXTURE_MOVIES } from './tmdb-fixtures.ts';
import { parseWatchLinks, summarizeProviders, type TmdbCountryProviders } from './providers.ts';
import { pickAgeRating } from './age-rating.ts';

const API = 'https://api.themoviedb.org/3';

export type SearchResult = {
	tmdbId: number;
	title: string;
	originalTitle: string;
	originalLanguage: string;
	year: number | null;
	posterPath: string | null;
};

// Without a token, development and e2e runs use a small built-in catalog.
const useFixtures = () => !TMDB_TOKEN && dev;

async function tmdb<T>(path: string, params: Record<string, string>): Promise<T> {
	if (!TMDB_TOKEN) throw new Error('TMDB is not configured');
	const url = new URL(API + path);
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
	const res = await fetch(url, {
		headers: { authorization: `Bearer ${TMDB_TOKEN}`, accept: 'application/json' },
		signal: AbortSignal.timeout(10_000)
	});
	if (!res.ok) throw new Error(`TMDB ${path}: ${res.status}`);
	return res.json() as Promise<T>;
}

const yearOf = (date: string | undefined | null) =>
	date ? Number(date.slice(0, 4)) || null : null;

type TmdbSearchMovie = {
	id: number;
	title: string;
	original_title: string;
	original_language: string;
	release_date?: string;
	poster_path: string | null;
	popularity: number;
};

export async function searchMovies(query: string): Promise<SearchResult[]> {
	if (useFixtures()) {
		const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
		const q = fold(query);
		return FIXTURE_MOVIES.filter(
			(m) => fold(m.meta.title).includes(q) || fold(m.meta.originalTitle).includes(q)
		).map((m) => ({
			tmdbId: m.tmdbId,
			title: m.meta.title,
			originalTitle: m.meta.originalTitle,
			originalLanguage: m.meta.originalLanguage,
			year: m.meta.year,
			posterPath: m.meta.posterPath
		}));
	}
	const data = await tmdb<{ results: TmdbSearchMovie[] }>('/search/movie', {
		query,
		include_adult: 'false',
		language: 'en-US'
	});
	return data.results.slice(0, 12).map((m) => ({
		tmdbId: m.id,
		title: m.title,
		originalTitle: m.original_title,
		originalLanguage: m.original_language,
		year: yearOf(m.release_date),
		posterPath: m.poster_path
	}));
}

type TmdbDetails = {
	id: number;
	title: string;
	original_title: string;
	original_language: string;
	release_date?: string;
	runtime: number | null;
	genres: { name: string }[];
	overview: string;
	poster_path: string | null;
	vote_average: number;
	vote_count: number;
	imdb_id: string | null;
	videos?: {
		results: { key: string; site: string; type: string; official: boolean; iso_639_1: string }[];
	};
	translations?: {
		translations: { iso_639_1: string; data: { title?: string; overview?: string } }[];
	};
	images?: { posters: { file_path: string; iso_639_1: string | null }[] };
	release_dates?: {
		results: { iso_3166_1: string; release_dates: { certification: string }[] }[];
	};
	'watch/providers'?: { results: Record<string, TmdbCountryProviders> };
	credits?: { cast: { name: string; order: number }[]; crew: { name: string; job: string }[] };
};

/** Deep links from TMDB's public watch page; empty if it can't be read (logos then fall back to search). */
async function watchPageLinks(url: string | undefined): Promise<Map<number, string>> {
	if (!url) return new Map();
	try {
		// Node's own user agent: a browser-like one from a non-browser gets a 403.
		const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
		if (!res.ok) throw new Error(`${res.status}`);
		return parseWatchLinks(await res.text());
	} catch (e) {
		console.error(`TMDB watch page ${url}`, e);
		return new Map();
	}
}

/** Picks the most fitting YouTube trailer: official trailers first, then teasers. */
function pickTrailer(videos: NonNullable<TmdbDetails['videos']>['results'], language: string) {
	const yt = videos.filter((v) => v.site === 'YouTube');
	const score = (v: (typeof yt)[number]) =>
		(v.type === 'Trailer' ? 4 : v.type === 'Teaser' ? 2 : 0) +
		(v.official ? 2 : 0) +
		(v.iso_639_1 === 'en' || v.iso_639_1 === language ? 1 : 0);
	return yt.sort((a, b) => score(b) - score(a))[0]?.key ?? null;
}

export async function fetchMovieMeta(tmdbId: number): Promise<MovieMeta> {
	if (useFixtures()) {
		const fixture = FIXTURE_MOVIES.find((m) => m.tmdbId === tmdbId);
		if (!fixture) throw new Error(`Unknown fixture movie ${tmdbId}`);
		return fixture.meta;
	}
	const d = await tmdb<TmdbDetails>(`/movie/${tmdbId}`, {
		language: 'en-US',
		append_to_response: 'videos,translations,images,credits,watch/providers,release_dates',
		include_video_language: 'en,hu,null',
		include_image_language: 'hu,en,null'
	});
	const huWatch = d['watch/providers']?.results.HU;
	const hu = d.translations?.translations.find((t) => t.iso_639_1 === 'hu');
	const isHungarian = d.original_language === 'hu';
	// Hungarian films get their Hungarian poster when TMDB has one.
	const huPoster = isHungarian
		? d.images?.posters.find((p) => p.iso_639_1 === 'hu')?.file_path
		: undefined;

	return {
		title: d.title,
		originalTitle: d.original_title,
		originalLanguage: d.original_language,
		huTitle: hu?.data.title?.trim() || null,
		year: yearOf(d.release_date),
		releaseDate: d.release_date || null,
		runtime: d.runtime || null,
		genres: d.genres.map((g) => g.name),
		// Hungarian films read in Hungarian (title and overview); everything else in English.
		overview: (isHungarian && hu?.data.overview) || d.overview || '',
		posterPath: huPoster ?? d.poster_path,
		rating: d.vote_count > 0 ? Math.round(d.vote_average * 10) / 10 : null,
		imdbId: d.imdb_id || null,
		trailerKey: pickTrailer(d.videos?.results ?? [], d.original_language),
		directors: (d.credits?.crew ?? []).filter((c) => c.job === 'Director').map((c) => c.name),
		cast: (d.credits?.cast ?? [])
			.toSorted((a, b) => a.order - b.order)
			.slice(0, 3)
			.map((c) => c.name),
		watch: summarizeProviders(huWatch, await watchPageLinks(huWatch?.link)),
		ageRating: pickAgeRating(d.release_dates?.results)
	};
}

export const tmdbConfigured = () => !!TMDB_TOKEN || dev;
