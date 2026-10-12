/** The earliest release of a kind: its ISO date, the countries that had it then, and Hungary's when later. */
export type Release = { date: string; countries: string[]; hu: string | null };
/** `home` is the first digital or physical (Blu-ray/DVD) release anywhere, as an ISO date. */
export type Releases = { theatrical: Release | null; home: string | null };
/** As cached in the movie's metadata; `v` (missing before versions) says which rules made it. */
export type CachedReleases = Releases & { v?: number };

/** Bump when the picking rules change, so cached movies are picked again after the deploy. */
export const RELEASES_VERSION = 2;

export type TmdbReleaseCountry = {
	iso_3166_1: string;
	release_dates: { certification: string; type?: number; release_date?: string }[];
};

// TMDB release types: 1 premiere, 2 limited theatrical, 3 theatrical, 4 digital, 5 physical, 6 TV.
const THEATRICAL = [3];
const LIMITED = [2];
const HOME = [4, 5];

function pick(all: TmdbReleaseCountry[], types: number[]): Release | null {
	const firsts = all
		.map((c) => {
			const dates = c.release_dates
				.filter((r) => types.includes(r.type ?? 0) && r.release_date)
				.map((r) => r.release_date!.slice(0, 10))
				.toSorted();
			return { iso: c.iso_3166_1, date: dates[0] };
		})
		.filter((c): c is { iso: string; date: string } => !!c.date);
	if (firsts.length === 0) return null;

	const date = firsts.map((c) => c.date).toSorted()[0];
	const countries = firsts.filter((c) => c.date === date).map((c) => c.iso);
	const hu = countries.includes('HU') ? null : (firsts.find((c) => c.iso === 'HU')?.date ?? null);
	return { date, countries, hu };
}

/**
 * The first theatrical and home releases, from TMDB's per-country release dates.
 * Limited releases (often festival-like screenings) count only when there's no regular one.
 */
export function pickReleases(countries: TmdbReleaseCountry[] | undefined): CachedReleases {
	return {
		v: RELEASES_VERSION,
		theatrical: pick(countries ?? [], THEATRICAL) ?? pick(countries ?? [], LIMITED),
		home: pick(countries ?? [], HOME)?.date ?? null
	};
}
