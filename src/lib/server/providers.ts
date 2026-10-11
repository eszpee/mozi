/**
 * A streaming service or store, as shown on the movie page. `logo` is a TMDB image path;
 * `url` opens the movie on that service, when TMDB's watch page had a link for it.
 */
export type Provider = { name: string; logo: string; url: string | null };
export type Providers = { link: string | null; stream: Provider[]; rent: Provider[] };

type TmdbProvider = {
	provider_id: number;
	provider_name: string;
	logo_path: string;
	display_priority: number;
};
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
export function summarizeProviders(
	c: TmdbCountryProviders | undefined,
	deepLinks: Map<number, string> = new Map()
): Providers {
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
				.map((p) => ({
					name: p.provider_name,
					logo: p.logo_path,
					url: deepLinks.get(p.provider_id) ?? null
				}))
		);
	const stream = pick(c?.flatrate, c?.free, c?.ads);
	const rent = pick(c?.rent, c?.buy);
	return { link: c?.link ?? null, stream, rent };
}

/**
 * TMDB's API has no per-service links, but its public watch page links each offer
 * through JustWatch (`click.justwatch.com/a?cx=…&r=<target>`), with the provider id in
 * the base64 `cx` context. Returns provider id → the target URL, i.e. the movie itself.
 */
export function parseWatchLinks(html: string): Map<number, string> {
	const links = new Map<number, string>();
	for (const [, href] of html.matchAll(/href="(https:\/\/click\.justwatch\.com\/a\?[^"]+)"/g)) {
		try {
			const params = new URL(href.replaceAll('&amp;', '&')).searchParams;
			const target = new URL(params.get('r') ?? '');
			if (target.protocol !== 'https:') continue;
			const cx = JSON.parse(Buffer.from(params.get('cx') ?? '', 'base64url').toString('utf8'));
			const id = cx.data?.find?.((d: { data?: { providerId?: unknown } }) => d.data?.providerId)
				?.data.providerId;
			if (typeof id === 'number' && !links.has(id)) links.set(id, target.href);
		} catch {
			// Not a link we understand; the logo falls back to a search link.
		}
	}
	return links;
}
