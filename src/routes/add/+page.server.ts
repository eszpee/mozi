import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { recommend } from '#lib/server/movies.ts';
import { search } from '#lib/server/search.ts';
import { parseForm } from '#lib/server/actions.ts';

export async function load({ url }) {
	const q = url.searchParams.get('q') ?? '';
	try {
		return { q, hits: q ? await search(q) : [], error: null };
	} catch (e) {
		console.error('Search failed', e);
		return { q, hits: [], error: 'Search is unavailable right now' };
	}
}

export const actions = {
	recommend: async ({ request, locals }) => {
		const { tmdbId } = await parseForm(
			request,
			z.object({ tmdbId: z.coerce.number().int().positive() })
		);
		let id: number;
		try {
			id = await recommend(tmdbId, locals.user!.id);
		} catch (e) {
			console.error('Recommend failed', e);
			return fail(502, { error: 'Couldn’t fetch that movie from TMDB. Try again?' });
		}
		redirect(303, `/movie/${id}`);
	}
};
