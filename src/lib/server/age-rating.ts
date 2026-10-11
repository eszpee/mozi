/** Minimum age: 0 (all ages), 6, 12, 16 or 18. */
export type AgeRating = 0 | 6 | 12 | 16 | 18;

type TmdbReleaseCountry = { iso_3166_1: string; release_dates: { certification: string }[] };

const AGES: Record<string, AgeRating> = {
	KN: 0,
	'0': 0,
	'6': 6,
	'12': 12,
	'16': 16,
	'18': 18,
	X: 18
};

/**
 * The Hungarian age rating from TMDB's release dates. Many films have none, so it
 * falls back to the German (FSK) rating, which uses the same age steps.
 */
export function pickAgeRating(countries: TmdbReleaseCountry[] | undefined): AgeRating | null {
	for (const iso of ['HU', 'DE']) {
		const certs = countries?.find((c) => c.iso_3166_1 === iso)?.release_dates ?? [];
		for (const { certification } of certs) {
			const age = AGES[certification.trim().toUpperCase()];
			if (age !== undefined) return age;
		}
	}
	return null;
}
