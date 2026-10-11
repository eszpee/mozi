import { describe, expect, it } from 'vitest';
import { stableOrder } from './stable-order.ts';

describe('stableOrder', () => {
	it('keeps the shown order even when the ranking changed', () => {
		expect(stableOrder([1, 2, 3], [3, 1, 2], new Set([1, 2, 3]))).toEqual([1, 2, 3]);
	});

	it('keeps items that dropped out of the filter, as long as they still exist', () => {
		// Voting under "needs my vote" removes 2 from the fresh list; it stays put.
		expect(stableOrder([1, 2, 3], [1, 3], new Set([1, 2, 3]))).toEqual([1, 2, 3]);
	});

	it('drops items that no longer exist and appends new ones', () => {
		expect(stableOrder([1, 2, 3], [4, 1, 3], new Set([1, 3, 4]))).toEqual([1, 3, 4]);
	});

	it('starts from the fresh ranking when nothing is shown yet', () => {
		expect(stableOrder([], [3, 1, 2], new Set([1, 2, 3]))).toEqual([3, 1, 2]);
	});
});
