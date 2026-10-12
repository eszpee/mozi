import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { toMember, type Member } from '#lib/server/users.ts';
import type { VoteValue } from '#lib/scoring.ts';
import { displayTitle, type DisplayTitle } from '#lib/titles.ts';

export const COMMENT_MAX = 2000;

export type CommentView = {
	id: number;
	author: Member;
	authorVote: VoteValue | null;
	body: string;
	createdAt: number;
	edited: boolean;
	mine: boolean;
	/** Someone else's, posted since the viewer last opened this thread. */
	isNew: boolean;
};

/**
 * Comments by others that `meId` hasn't seen, counted per movie. A thread is seen up to
 * the last time its movie page was opened; with no record, up to when the member joined.
 */
export function unreadByThread(meId: number): Map<number, number> {
	const rows = db.all<{ movieId: number; n: number }>(sql`
		SELECT c.movie_id AS movieId, count(*) AS n
		FROM comments c
		JOIN movies m ON m.id = c.movie_id
		JOIN users me ON me.id = ${meId}
		LEFT JOIN comment_reads r ON r.movie_id = c.movie_id AND r.user_id = ${meId}
		WHERE c.deleted_at IS NULL AND m.deleted_at IS NULL AND c.user_id != ${meId}
			AND c.created_at > coalesce(r.read_at, me.created_at)
		GROUP BY c.movie_id`);
	return new Map(rows.map((r) => [r.movieId, r.n]));
}

/** Marks a thread read now; returns when it was last read before (or when the member joined). */
export function markThreadRead(movieId: number, meId: number): number {
	const before = db.get<{ at: number }>(sql`
		SELECT coalesce(
			(SELECT read_at FROM comment_reads WHERE user_id = ${meId} AND movie_id = ${movieId}),
			(SELECT created_at FROM users WHERE id = ${meId})
		) AS at`);
	const readAt = new Date();
	db.insert(schema.commentReads)
		.values({ userId: meId, movieId, readAt })
		.onConflictDoUpdate({
			target: [schema.commentReads.userId, schema.commentReads.movieId],
			set: { readAt }
		})
		.run();
	return before?.at ?? 0;
}

export function listComments(movieId: number, meId: number, readBefore = Infinity): CommentView[] {
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
		mine: comment.userId === meId,
		isNew: comment.userId !== meId && comment.createdAt.getTime() > readBefore
	}));
}

export type ConversationView = {
	movieId: number;
	title: DisplayTitle;
	posterPath: string | null;
	latest: { author: Member; body: string; createdAt: number };
	/** Comments by others the viewer hasn't seen yet. */
	newCount: number;
};

/** Every movie with comments, each with its newest one, most recently discussed first. */
export function listConversations(meId: number): ConversationView[] {
	const unread = unreadByThread(meId);
	const rows = db
		.select({ comment: schema.comments, user: schema.users, movie: schema.movies })
		.from(schema.comments)
		.innerJoin(schema.users, eq(schema.users.id, schema.comments.userId))
		.innerJoin(schema.movies, eq(schema.movies.id, schema.comments.movieId))
		.where(and(isNull(schema.comments.deletedAt), isNull(schema.movies.deletedAt)))
		.orderBy(desc(schema.comments.createdAt), desc(schema.comments.id))
		.all();
	const seen = new Set<number>();
	const views: ConversationView[] = [];
	for (const { comment, user, movie } of rows) {
		if (seen.has(movie.id)) continue;
		seen.add(movie.id);
		views.push({
			movieId: movie.id,
			title: displayTitle(movie.meta),
			posterPath: movie.meta.posterPath,
			latest: {
				author: toMember(user),
				body: comment.body,
				createdAt: comment.createdAt.getTime()
			},
			newCount: unread.get(movie.id) ?? 0
		});
	}
	return views;
}

export function addComment(movieId: number, userId: number, body: string) {
	// Millisecond time (the column default is whole seconds), so it sorts against read marks.
	db.insert(schema.comments).values({ movieId, userId, body, createdAt: new Date() }).run();
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
