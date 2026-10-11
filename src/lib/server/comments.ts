import { and, asc, eq, isNull } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { toMember, type Member } from '#lib/server/users.ts';
import type { VoteValue } from '#lib/scoring.ts';

export const COMMENT_MAX = 2000;

export type CommentView = {
	id: number;
	author: Member;
	authorVote: VoteValue | null;
	body: string;
	createdAt: number;
	edited: boolean;
	mine: boolean;
};

export function listComments(movieId: number, meId: number): CommentView[] {
	const rows = db
		.select({ comment: schema.comments, user: schema.users, vote: schema.votes.value })
		.from(schema.comments)
		.innerJoin(schema.users, eq(schema.users.id, schema.comments.userId))
		.leftJoin(
			schema.votes,
			and(
				eq(schema.votes.movieId, schema.comments.movieId),
				eq(schema.votes.userId, schema.comments.userId)
			)
		)
		.where(and(eq(schema.comments.movieId, movieId), isNull(schema.comments.deletedAt)))
		.orderBy(asc(schema.comments.createdAt), asc(schema.comments.id))
		.all();
	return rows.map(({ comment, user, vote }) => ({
		id: comment.id,
		author: toMember(user),
		authorVote: (vote ?? null) as VoteValue | null,
		body: comment.body,
		createdAt: comment.createdAt.getTime(),
		edited: !!comment.editedAt,
		mine: comment.userId === meId
	}));
}

export function addComment(movieId: number, userId: number, body: string) {
	db.insert(schema.comments).values({ movieId, userId, body }).run();
}

/** Edits are only allowed by the author. */
export function editComment(id: number, userId: number, body: string) {
	db.update(schema.comments)
		.set({ body, editedAt: new Date() })
		.where(and(eq(schema.comments.id, id), eq(schema.comments.userId, userId)))
		.run();
}

/** Authors delete their own comments; admins may delete any. */
export function deleteComment(id: number, userId: number, admin: boolean) {
	const own = and(eq(schema.comments.id, id), eq(schema.comments.userId, userId));
	db.update(schema.comments)
		.set({ deletedAt: new Date() })
		.where(admin ? eq(schema.comments.id, id) : own)
		.run();
}
