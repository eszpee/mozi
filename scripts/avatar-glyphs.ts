// Copies the avatar emoji from Google Noto into src/lib/server/avatar-glyphs.json, so the
// server doesn't load the whole 24 MB set. Rerun after changing EMOJI in avatar.ts:
//   node scripts/avatar-glyphs.ts && npx prettier --write src/lib/server/avatar-glyphs.json
import { writeFileSync } from 'node:fs';
import { getIconData, iconToSVG } from '@iconify/utils';
import icons from '@iconify-json/noto/icons.json' with { type: 'json' };
import chars from '@iconify-json/noto/chars.json' with { type: 'json' };
import { EMOJI } from '../src/lib/server/avatar.ts';

const codepoints = (e: string) =>
	[...e]
		.map((c) => c.codePointAt(0)!.toString(16))
		.filter((h) => h !== 'fe0f')
		.join('-');

const glyphs: Record<string, { body: string; size: number }> = {};
for (const emoji of EMOJI) {
	const name = (chars as Record<string, string>)[codepoints(emoji)];
	const data = name ? getIconData(icons, name) : null;
	if (!data) throw new Error(`Noto has no ${emoji}`);
	const { body, attributes } = iconToSVG(data);
	const [, , w, h] = attributes.viewBox.split(' ').map(Number);
	if (w !== h) throw new Error(`${emoji} isn't square`);
	glyphs[emoji] = { body, size: w };
}
writeFileSync(
	new URL('../src/lib/server/avatar-glyphs.json', import.meta.url),
	JSON.stringify(glyphs, null, '\t') + '\n'
);
console.log(`${EMOJI.length} glyphs`);
