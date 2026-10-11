import { z } from 'zod';
import { undoWatched, watchedMovies } from '#lib/server/movies.ts';
import { parseForm } from '#lib/server/actions.ts';

export function load({ locals }) {
	return { movies: watchedMovies(locals.user!.id) };
}

export const actions = {
	undo: async ({ request }) => {
		const { movieId } = await parseForm(
			request,
			z.object({ movieId: z.coerce.number().int().positive() })
		);
		undoWatched(movieId);
	}
};
