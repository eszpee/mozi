import glyphs from './avatar-glyphs.json' with { type: 'json' };
import { avatarParts } from '#lib/avatar.ts';

// The emoji are Google Noto drawings (Apache-2.0), vendored by scripts/avatar-glyphs.ts:
// a font glyph lands off center by a different amount on every platform.
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
