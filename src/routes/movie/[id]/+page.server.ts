import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { getMovie, markWatched, removeMovie } from '#lib/server/movies.ts';
import {
	COMMENT_MAX,
	addComment,
	deleteComment,
	editComment,
	listComments
} from '#lib/server/comments.ts';
import { attendeeIds, openNight } from '#lib/server/nights.ts';
import { activeMembers, toMember } from '#lib/server/users.ts';
import { parseForm, seen, vote } from '#lib/server/actions.ts';
import { requestInSeerr, seerrConfigured } from '#lib/server/seerr.ts';

const movieId = (params: { id: string }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) error(404, 'Nincs ilyen oldal');
	return id;
};

export function load({ params, locals }) {
	const me = locals.user!;
	const movie = getMovie(movieId(params), me.id);
	if (!movie) error(404, 'Nincs ilyen film');

	const night = openNight();
	const attending = attendeeIds(night.id);
	return {
		movie,
		comments: listComments(movie.id, me.id),
		attendees: activeMembers()
			.filter((m) => attending.has(m.id))
			.map(toMember),
		canRequest: locals.admin && seerrConfigured() && movie.availability === null,
		admin: locals.admin
	};
}

const Body = z.string().trim().min(1, 'Előbb írj valamit').max(COMMENT_MAX, 'Túl hosszú');

export const actions = {
	vote,
	seen,
	watched: ({ params }) => {
		markWatched(movieId(params));
	},
	comment: async ({ params, request, locals }) => {
		const form = await request.formData();
		const parsed = Body.safeParse(form.get('body'));
		if (!parsed.success) return fail(400, { commentError: parsed.error.issues[0].message });
		const id = movieId(params);
		if (!getMovie(id, locals.user!.id)) error(404, 'Nincs ilyen film');
		addComment(id, locals.user!.id, parsed.data);
	},
	editComment: async ({ request, locals }) => {
		const { commentId, body } = await parseForm(
			request,
			z.object({ commentId: z.coerce.number().int().positive(), body: Body })
		);
		editComment(commentId, locals.user!.id, body);
	},
	deleteComment: async ({ request, locals }) => {
		const { commentId } = await parseForm(
			request,
			z.object({ commentId: z.coerce.number().int().positive() })
		);
		deleteComment(commentId, locals.user!.id, locals.admin);
	},
	request: async ({ params, locals }) => {
		if (!locals.admin) error(403, 'Csak adminoknak');
		const movie = getMovie(movieId(params), locals.user!.id);
		if (!movie) error(404, 'Nincs ilyen film');
		try {
			await requestInSeerr(movie.tmdbId);
		} catch (e) {
			console.error('Seerr request failed', e);
			return fail(502, { requestError: 'A Seerr nem fogadta el a kérést.' });
		}
	},
	remove: ({ params, locals }) => {
		if (!locals.admin) error(403, 'Csak adminoknak');
		removeMovie(movieId(params));
		redirect(303, '/');
	}
};
