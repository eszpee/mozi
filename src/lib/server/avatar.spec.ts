import { describe, expect, it } from 'vitest';
import { AVATAR_COUNT, EMOJI, avatarParts, avatarSvg } from './avatar.ts';
import glyphs from './avatar-glyphs.json' with { type: 'json' };

describe('avatar', () => {
	it('is deterministic per seed', () => {
		expect(avatarSvg('abc')).toBe(avatarSvg('abc'));
	});

	it('spreads seeds over many emoji and colors', () => {
		const emoji = new Set<string>();
		const colors = new Set<string>();
		for (let i = 0; i < 2000; i++) {
			const p = avatarParts(`seed-${i}`);
			emoji.add(p.emoji);
			colors.add(p.color);
		}
		expect(emoji.size).toBeGreaterThan(100);
		expect(colors.size).toBe(12);
		expect(AVATAR_COUNT).toBeGreaterThan(1500);
	});

	it('has a drawing for every emoji, so none falls back to a font', () => {
		expect(EMOJI.filter((e) => !(e in glyphs))).toEqual([]);
		expect(avatarSvg('abc')).not.toContain('<text');
	});
});
