import { describe, expect, it } from 'vitest';
import { AVATAR_COUNT, avatarParts, rerollSeed } from './avatar.ts';

describe('avatar', () => {
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

	it('rerolls the emoji or the color and keeps the other', () => {
		const before = avatarParts('abc');
		const newEmoji = avatarParts(rerollSeed('abc', 'emoji'));
		expect(newEmoji.color).toBe(before.color);
		expect(newEmoji.emoji).not.toBe(before.emoji);
		const newColor = avatarParts(rerollSeed('abc', 'color'));
		expect(newColor.emoji).toBe(before.emoji);
		expect(newColor.color).not.toBe(before.color);
	});
});
