import { describe, expect, it } from 'vitest';
import { rank, tally, type Vote, type VoteValue } from './scoring.ts';

const votes = (...values: VoteValue[]): Vote[] =>
	values.map((value, i) => ({ userId: i + 1, value }));

function item(name: string, v: Vote[], addedAt = 0, voters?: Set<number>) {
	return { name, addedAt, tally: tally(v, voters) };
}

const names = (xs: { name: string }[]) => xs.map((x) => x.name);

describe('tally', () => {
	it('counts votes and weighs a thumbs-down at 1.5', () => {
		expect(tally(votes(1, 1, 0, -1))).toEqual({ up: 2, meh: 1, down: 1, score: 0.5 });
	});

	it('only counts the given voters', () => {
		expect(tally(votes(1, -1, -1), new Set([1, 3]))).toEqual({
			up: 1,
			meh: 0,
			down: 1,
			score: -0.5
		});
	});
});

describe('rank', () => {
	const a = item('a', votes(1, 1, 1, -1), 1); // score 1.5, up 3, down 1
	const b = item('b', votes(1, 1), 2); // score 2, up 2, down 0
	const c = item('c', votes(1, 1, -1, -1), 3); // score -1, up 2, down 2
	const d = item('d', [], 4); // no votes, newest

	it('best bet sorts by weighted score', () => {
		expect(names(rank([a, b, c, d], 'best'))).toEqual(['b', 'a', 'd', 'c']);
	});

	it('most liked sorts by thumbs-up, fewer thumbs-down first on ties', () => {
		expect(names(rank([a, b, c, d], 'liked'))).toEqual(['a', 'b', 'c', 'd']);
	});

	it('least hated sorts by fewest thumbs-down, more thumbs-up first on ties', () => {
		expect(names(rank([a, b, c, d], 'hated'))).toEqual(['b', 'd', 'a', 'c']);
	});

	it('most controversial favors movies with both fans and haters', () => {
		expect(names(rank([a, b, c, d], 'controversial'))).toEqual(['c', 'a', 'b', 'd']);
	});

	it('highest rated sorts by TMDB rating, unrated last', () => {
		const rated = [
			{ ...a, rating: 6.1 },
			{ ...b, rating: null },
			{ ...c, rating: 8.4 },
			{ ...d, rating: 7 }
		];
		expect(names(rank(rated, 'rated'))).toEqual(['c', 'd', 'a', 'b']);
	});

	it('newest sorts by date added', () => {
		expect(names(rank([a, b, c, d], 'newest'))).toEqual(['d', 'c', 'b', 'a']);
	});

	it('scoping to attendees changes the order', () => {
		const attendees = new Set([1, 2]);
		const x = item('x', votes(-1, -1, 1, 1, 1), 1, attendees); // attendees both say no
		const y = item('y', votes(1, 0), 2, attendees);
		expect(names(rank([x, y], 'best'))).toEqual(['y', 'x']);
	});

	it('does not mutate its input', () => {
		const input = [a, b];
		rank(input, 'newest');
		expect(names(input)).toEqual(['a', 'b']);
	});
});
