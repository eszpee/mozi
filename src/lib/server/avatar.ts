import glyphs from './avatar-glyphs.json' with { type: 'json' };

// Simple avatars: one emoji on a colored disc, both picked from the seed.
// Animals, food and objects rather than faces, so they read well at 24px.
// The emoji are Google Noto drawings (Apache-2.0), vendored by scripts/avatar-glyphs.ts:
// a font glyph lands off center by a different amount on every platform.
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

export function avatarSvg(seed: string): string {
	const { emoji, color } = avatarParts(seed);
	const { body, size } = (glyphs as Record<string, { body: string; size: number }>)[emoji];
	return (
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
		`<circle cx="32" cy="32" r="32" fill="${color}"/>` +
		`<svg x="13" y="13" width="38" height="38" viewBox="0 0 ${size} ${size}">${body}</svg>` +
		'</svg>'
	);
}
