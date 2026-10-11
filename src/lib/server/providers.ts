/** A streaming service or store, as shown on the movie page. `logo` is a TMDB image path. */
export type Provider = { name: string; logo: string };
export type Providers = { link: string | null; stream: Provider[]; rent: Provider[] };

type TmdbProvider = { provider_name: string; logo_path: string; display_priority: number };
export type TmdbCountryProviders = {
	link?: string;
	flatrate?: TmdbProvider[];
	free?: TmdbProvider[];
	ads?: TmdbProvider[];
	rent?: TmdbProvider[];
	buy?: TmdbProvider[];
};

/**
 * One country's TMDB (JustWatch) offers, as subscription/free services and rent/buy stores.
 * Keeps TMDB's display order within each group, and lists each service once.
 */
export function summarizeProviders(c: TmdbCountryProviders | undefined): Providers {
	const seen: string[] = [];
	const pick = (...groups: (TmdbProvider[] | undefined)[]) =>
		groups.flatMap((g) =>
			(g ?? [])
				.toSorted((a, b) => a.display_priority - b.display_priority)
				.filter((p) => {
					// "Netflix basic with Ads" is just another tier of "Netflix".
					if (seen.some((s) => p.provider_name.startsWith(s))) return false;
					seen.push(p.provider_name);
					return true;
				})
				.map((p) => ({ name: p.provider_name, logo: p.logo_path }))
		);
	const stream = pick(c?.flatrate, c?.free, c?.ads);
	const rent = pick(c?.rent, c?.buy);
	return { link: c?.link ?? null, stream, rent };
}
