// Simple avatars: one emoji on a colored disc, both picked from the seed.
// Animals, food and objects rather than faces, so they read well at 24px.
const EMOJI = [
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

export function avatarSvg(seed: string): string {
	const { emoji, color } = avatarParts(seed);
	return (
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
		`<circle cx="32" cy="32" r="32" fill="${color}"/>` +
		'<text x="32" y="34" font-size="36" text-anchor="middle" dominant-baseline="central" ' +
		`font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${emoji}</text>` +
		'</svg>'
	);
}
