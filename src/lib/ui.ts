import type { VoteValue } from './scoring.ts';

export const VOTE_OPTIONS: { value: VoteValue; emoji: string; label: string }[] = [
	{ value: 1, emoji: '👍', label: 'Want to watch' },
	{ value: 0, emoji: '🤷', label: 'Fine either way' },
	{ value: -1, emoji: '👎', label: 'Please no' }
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
	return h ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
}

export function trailerUrl(key: string | null, title: string, year: number | null) {
	return key
		? `https://www.youtube.com/watch?v=${encodeURIComponent(key)}`
		: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${year ?? ''} trailer`)}`;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric'
});
export const formatDate = (ms: number) => dateFmt.format(ms);

export function formatNightDate(iso: string | null) {
	if (!iso) return null;
	const d = new Date(`${iso}T12:00:00`);
	return new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short'
	}).format(d);
}

export function timeAgo(ms: number, now = Date.now()) {
	const s = Math.round((now - ms) / 1000);
	if (s < 60) return 'just now';
	const m = Math.round(s / 60);
	if (m < 60) return `${m}m ago`;
	const h = Math.round(m / 60);
	if (h < 24) return `${h}h ago`;
	const d = Math.round(h / 24);
	if (d < 30) return `${d}d ago`;
	return formatDate(ms);
}
