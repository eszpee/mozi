CREATE TABLE `availability` (
	`tmdb_id` integer PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`synced_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`movie_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`edited_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `comments_movie_idx` ON `comments` (`movie_id`);--> statement-breakpoint
CREATE TABLE `invites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_hash` text NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`revoked_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invites_token_hash_unique` ON `invites` (`token_hash`);--> statement-breakpoint
CREATE TABLE `kv` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `movies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tmdb_id` integer NOT NULL,
	`meta` text NOT NULL,
	`meta_refreshed_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`added_by` integer NOT NULL,
	`added_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`watched_at` integer,
	`watched_night_id` integer,
	`deleted_at` integer,
	FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `movies_tmdb_id_unique` ON `movies` (`tmdb_id`);--> statement-breakpoint
CREATE INDEX `movies_watched_idx` ON `movies` (`watched_at`);--> statement-breakpoint
CREATE TABLE `night_attendees` (
	`night_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	PRIMARY KEY(`night_id`, `user_id`),
	FOREIGN KEY (`night_id`) REFERENCES `nights`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `nights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text,
	`date` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`closed_at` integer,
	`movie_id` integer
);
--> statement-breakpoint
CREATE TABLE `seen` (
	`user_id` integer NOT NULL,
	`movie_id` integer NOT NULL,
	`source` text NOT NULL,
	`night_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`user_id`, `movie_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `seen_movie_idx` ON `seen` (`movie_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`google_sub` text NOT NULL,
	`email` text NOT NULL,
	`nickname` text,
	`avatar_seed` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`removed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_sub_unique` ON `users` (`google_sub`);--> statement-breakpoint
CREATE TABLE `votes` (
	`user_id` integer NOT NULL,
	`movie_id` integer NOT NULL,
	`value` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`user_id`, `movie_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `votes_movie_idx` ON `votes` (`movie_id`);