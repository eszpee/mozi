import { describe, expect, it } from 'vitest';
import { AVATAR_COUNT, avatarParts, avatarSvg } from './avatar.ts';

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
});
