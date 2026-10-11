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
