/** The earliest release of a kind: its ISO date, the countries that had it then, and Hungary's when later. */
export type Release = { date: string; countries: string[]; hu: string | null };
export type Releases = { theatrical: Release | null; digital: Release | null };

export type TmdbReleaseCountry = {
	iso_3166_1: string;
	release_dates: { certification: string; type?: number; release_date?: string }[];
};

// TMDB release types: 1 premiere, 2 limited theatrical, 3 theatrical, 4 digital, 5 physical, 6 TV.
const THEATRICAL = [2, 3];
const DIGITAL = [4];

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

/** The first theatrical and digital releases, from TMDB's per-country release dates. */
export function pickReleases(countries: TmdbReleaseCountry[] | undefined): Releases {
	return { theatrical: pick(countries ?? [], THEATRICAL), digital: pick(countries ?? [], DIGITAL) };
}
