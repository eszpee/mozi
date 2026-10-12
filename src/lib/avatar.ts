// Simple avatars: one emoji on a colored disc, both picked from the seed.
// Animals, food and objects rather than faces, so they read well at 24px.
// Shared with the browser, which picks new seeds; the server draws them (server/avatar.ts).
export const EMOJI = [
	...new Set([
		...'🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🐤🦆🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐢🐍🦎🐙🦑🦀🐡🐠🐟🐬🐳🦈🐊🦓🦒🦔🦥🦦🦩🦜🐘🦛🐪🦘🦫',
		...'🍎🍐🍊🍋🍌🍉🍇🍓🫐🍒🍑🥭🍍🥥🥝🍅🥑🌽🥕🥐🥨🧀🥞🧇🍔🍟🍕🌭🌮🌯🍿🍩🍪🎂🧁🍭🍫🍦🍉',
		...'🌵🌲🌴🍀🍁🍄🌻🌼🌷🌹🌈⭐🌙🔥💧⚡🌊',
		...'⚽🏀🏈⚾🎾🏐🎱🏓🎯🎳🎮🎲🧩🎸🎺🎷🥁🎻🎨🎬🎧🚀🛸🚲🛹⛵🚂🎈🎁🔮💎🔑🧸🪁🪀🧲🔭💡📚📷⏰'
	])
];

const COLORS = [
	'#f2c14e',
	'#f78154',
	'#e85d75',
	'#b388eb',
	'#7aa2f7',
	'#4fb3bf',
	'#5fbf77',
	'#a3c45a',
	'#e0a96d',
	'#9aa5b1',
	'#d4a5a5',
	'#6c8ead'
];

/** FNV-1a: a small, stable string hash. */
function hash(s: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
	return h >>> 0;
}

export function avatarParts(seed: string) {
	const h = hash(seed);
	return {
		emoji: EMOJI[h % EMOJI.length],
		color: COLORS[Math.floor(h / EMOJI.length) % COLORS.length]
	};
}

export const AVATAR_COUNT = EMOJI.length * COLORS.length;

/** Valid seeds; also the avatar route's URL check. */
export const AVATAR_SEED = /^[A-Za-z0-9_-]{1,32}$/;

/** A random seed in the same shape as the server's (base64url). */
function randomSeed(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(9));
	return btoa(String.fromCharCode(...bytes))
		.replaceAll('+', '-')
		.replaceAll('/', '_');
}

/**
 * A new seed that changes one part of the avatar and keeps the other: a new emoji on the
 * same color, or the same emoji on a new color. Both come from one hash, so this draws
 * random seeds until one fits; that takes ~13 tries for a color, ~165 for an emoji.
 */
export function rerollSeed(seed: string, change: 'emoji' | 'color', random = randomSeed): string {
	const now = avatarParts(seed);
	const keep = change === 'emoji' ? 'color' : 'emoji';
	for (;;) {
		const next = random();
		const parts = avatarParts(next);
		if (parts[keep] === now[keep] && parts[change] !== now[change]) return next;
	}
}
