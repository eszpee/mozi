import { sql } from 'drizzle-orm';
import type { Providers } from '#lib/server/providers.ts';
import type { AgeRating } from '#lib/server/age-rating.ts';
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const now = sql`(unixepoch() * 1000)`;
const timestamp = (name: string) => integer(name, { mode: 'timestamp_ms' });

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	googleSub: text('google_sub').notNull().unique(),
	email: text('email').notNull(),
	// Null until the user has picked one on /welcome.
	nickname: text('nickname'),
	avatarSeed: text('avatar_seed').notNull(),
	createdAt: timestamp('created_at').notNull().default(now),
	removedAt: timestamp('removed_at')
});

export const sessions = sqliteTable(
	'sessions',
	{
		// SHA-256 of the cookie token, hex. The raw token never touches the database.
		id: text('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').notNull().default(now)
	},
	(t) => [index('sessions_user_idx').on(t.userId)]
);

export const invites = sqliteTable('invites', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	// SHA-256 of the token; the token itself is shown to the admin and kept here for display.
	tokenHash: text('token_hash').notNull().unique(),
	token: text('token').notNull(),
	createdAt: timestamp('created_at').notNull().default(now),
	revokedAt: timestamp('revoked_at')
});

/** A credited person; ids are missing on names cached before links were added. */
export type Person = { name: string; tmdbId: number | null; imdbId: string | null };

export type MovieMeta = {
	title: string;
	originalTitle: string;
	originalLanguage: string;
	huTitle: string | null;
	year: number | null;
	/** ISO date; missing on movies cached before it was added. */
	releaseDate?: string | null;
	runtime: number | null;
	genres: string[];
	overview: string;
	posterPath: string | null;
	rating: number | null;
	imdbId: string | null;
	trailerKey: string | null;
	/** Missing on movies cached before credits were added. */
	directors?: (Person | string)[];
	/** Top-billed cast, at most three. */
	cast?: (Person | string)[];
	/** Where it streams in Hungary (TMDB / JustWatch), with deep links. Missing on movies cached before. */
	watch?: Providers;
	/** Minimum age (Hungarian rating, else German). Missing on movies cached before. */
	ageRating?: AgeRating | null;
};

export const movies = sqliteTable(
	'movies',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		tmdbId: integer('tmdb_id').notNull().unique(),
		meta: text('meta', { mode: 'json' }).$type<MovieMeta>().notNull(),
		metaRefreshedAt: timestamp('meta_refreshed_at').notNull().default(now),
		addedBy: integer('added_by')
			.notNull()
			.references(() => users.id),
		addedAt: timestamp('added_at').notNull().default(now),
		watchedAt: timestamp('watched_at'),
		watchedNightId: integer('watched_night_id'),
		deletedAt: timestamp('deleted_at')
	},
	(t) => [index('movies_watched_idx').on(t.watchedAt)]
);

export const votes = sqliteTable(
	'votes',
	{
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
		movieId: integer('movie_id')
			.notNull()
			.references(() => movies.id),
		// 1 = want to watch, 0 = fine either way, -1 = please no
		value: integer('value').notNull(),
		updatedAt: timestamp('updated_at').notNull().default(now)
	},
	(t) => [primaryKey({ columns: [t.userId, t.movieId] }), index('votes_movie_idx').on(t.movieId)]
);

export const seen = sqliteTable(
	'seen',
	{
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
		movieId: integer('movie_id')
			.notNull()
			.references(() => movies.id),
		// 'self' = marked by the user, 'night' = attended the group watch
		source: text('source', { enum: ['self', 'night'] }).notNull(),
		nightId: integer('night_id'),
		createdAt: timestamp('created_at').notNull().default(now)
	},
	(t) => [primaryKey({ columns: [t.userId, t.movieId] }), index('seen_movie_idx').on(t.movieId)]
);

export const comments = sqliteTable(
	'comments',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		movieId: integer('movie_id')
			.notNull()
			.references(() => movies.id),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
		body: text('body').notNull(),
		createdAt: timestamp('created_at').notNull().default(now),
		editedAt: timestamp('edited_at'),
		deletedAt: timestamp('deleted_at')
	},
	(t) => [index('comments_movie_idx').on(t.movieId)]
);

/**
 * When each member last opened a movie's comment thread. Comments by others posted after
 * it (or, with no row, after the member joined) count as new for them.
 */
export const commentReads = sqliteTable(
	'comment_reads',
	{
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
		movieId: integer('movie_id')
			.notNull()
			.references(() => movies.id),
		readAt: timestamp('read_at').notNull()
	},
	(t) => [primaryKey({ columns: [t.userId, t.movieId] })]
);

export const nights = sqliteTable('nights', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	label: text('label'),
	// ISO date (YYYY-MM-DD), optional
	date: text('date'),
	createdAt: timestamp('created_at').notNull().default(now),
	closedAt: timestamp('closed_at'),
	movieId: integer('movie_id')
});

export const nightAttendees = sqliteTable(
	'night_attendees',
	{
		nightId: integer('night_id')
			.notNull()
			.references(() => nights.id),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id)
	},
	(t) => [primaryKey({ columns: [t.nightId, t.userId] })]
);

export const availability = sqliteTable('availability', {
	tmdbId: integer('tmdb_id').primaryKey(),
	status: text('status', { enum: ['plex', 'downloading', 'requested', 'waiting'] }).notNull(),
	/** First home release (YYYY-MM-DD) of a movie that isn't out yet. */
	expected: text('expected'),
	syncedAt: timestamp('synced_at').notNull().default(now)
});

// Small key/value store for app state such as the last availability sync.
export const kv = sqliteTable('kv', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});

export type User = typeof users.$inferSelect;
export type Movie = typeof movies.$inferSelect;
export type Night = typeof nights.$inferSelect;
