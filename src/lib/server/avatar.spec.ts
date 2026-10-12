import { describe, expect, it } from 'vitest';
import { EMOJI } from '#lib/avatar.ts';
import { avatarSvg } from './avatar.ts';
import glyphs from './avatar-glyphs.json' with { type: 'json' };

describe('avatarSvg', () => {
	it('is deterministic per seed', () => {
		expect(avatarSvg('abc')).toBe(avatarSvg('abc'));
	});

	it('has a drawing for every emoji, so none falls back to a font', () => {
		expect(EMOJI.filter((e) => !(e in glyphs))).toEqual([]);
		expect(avatarSvg('abc')).not.toContain('<text');
	});
});
