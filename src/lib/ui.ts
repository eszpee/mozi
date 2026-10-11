import type { VoteValue } from './scoring.ts';

export const VOTE_OPTIONS: { value: VoteValue; emoji: string; label: string }[] = [
	{ value: 1, emoji: '👍', label: 'Megnézném' },
	{ value: 0, emoji: '🤷', label: 'Nekem mindegy' },
	{ value: -1, emoji: '👎', label: 'Inkább ne' }
];

export const voteEmoji = (v: VoteValue | null) =>
	v === null ? '' : (VOTE_OPTIONS.find((o) => o.value === v)?.emoji ?? '');

export function posterUrl(path: string | null, width: 185 | 342 | 500 | 780 = 342) {
	return path ? `https://image.tmdb.org/t/p/w${width}${path}` : null;
}

/** A TMDB watch-provider logo (square). */
export const providerLogoUrl = (path: string) => `https://image.tmdb.org/t/p/w92${path}`;

// TMDB has no per-service link to a movie, so each logo opens that service's search
// for the title. Keyed by name prefix, which also covers tiers like "Netflix basic with Ads".
const PROVIDER_SEARCH: [prefix: string, url: (q: string) => string][] = [
	['netflix', (q) => `https://www.netflix.com/search?q=${q}`],
	['hbo max', (q) => `https://play.hbomax.com/search?q=${q}`],
	['max', (q) => `https://play.hbomax.com/search?q=${q}`],
	['apple tv', (q) => `https://tv.apple.com/hu/search?term=${q}`],
	['google play', (q) => `https://play.google.com/store/search?q=${q}&c=movies`],
	['disney', (q) => `https://www.disneyplus.com/search?q=${q}`],
	['amazon', (q) => `https://www.primevideo.com/search?phrase=${q}`],
	['skyshowtime', (q) => `https://www.skyshowtime.com/hu/search?q=${q}`],
	['plex', (q) => `https://app.plex.tv/desktop/#!/search?query=${q}`]
];

/** Where a provider logo links: the service's search for the title, else TMDB's watch page. */
export function providerUrl(name: string, title: string, fallback: string | null) {
	const n = name.toLowerCase();
	const hit = PROVIDER_SEARCH.find(([prefix]) => n.startsWith(prefix));
	return hit ? hit[1](encodeURIComponent(title)) : fallback;
}

export function formatRuntime(minutes: number | null) {
	if (!minutes) return null;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return h ? `${h} ó ${m} p` : `${m} p`;
}

export function trailerUrl(key: string | null, title: string, year: number | null) {
	return key
		? `https://www.youtube.com/watch?v=${encodeURIComponent(key)}`
		: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${year ?? ''} trailer`)}`;
}

const dateFmt = new Intl.DateTimeFormat('hu-HU', {
	day: 'numeric',
	month: 'short',
	year: 'numeric'
});
export const formatDate = (ms: number) => dateFmt.format(ms);

/** "okt. 18., V", or with a `long` weekday "okt. 18., Vasárnap". */
export function formatNightDate(iso: string | null, weekday: 'short' | 'long' = 'short') {
	if (!iso) return null;
	const d = new Date(`${iso}T12:00:00`);
	return new Intl.DateTimeFormat('hu-HU', { weekday, day: 'numeric', month: 'short' })
		.formatToParts(d)
		.map((p) => (p.type === 'weekday' ? p.value[0].toUpperCase() + p.value.slice(1) : p.value))
		.join('');
}

const languageNames = new Intl.DisplayNames('hu-HU', { type: 'language' });

/** TMDB's language code as a Hungarian name ("portugál"); null when unknown. */
export function languageName(code: string | null | undefined): string | null {
	if (!code || code === 'xx') return null; // xx: no language
	try {
		// TMDB uses the nonstandard "cn" for Cantonese.
		const name = languageNames.of(code === 'cn' ? 'yue' : code);
		return name && name !== code ? name : null;
	} catch {
		return null;
	}
}

export function timeAgo(ms: number, now = Date.now()) {
	const s = Math.round((now - ms) / 1000);
	if (s < 60) return 'épp most';
	const m = Math.round(s / 60);
	if (m < 60) return `${m} perce`;
	const h = Math.round(m / 60);
	if (h < 24) return `${h} órája`;
	const d = Math.round(h / 24);
	if (d < 30) return `${d} napja`;
	return formatDate(ms);
}
