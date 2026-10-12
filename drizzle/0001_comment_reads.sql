CREATE TABLE `comment_reads` (
	`user_id` integer NOT NULL,
	`movie_id` integer NOT NULL,
	`read_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `movie_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`movie_id`) REFERENCES `movies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
-- Everything said before this feature counts as read, so nobody starts with every old thread marked new.
INSERT INTO `comment_reads` (`user_id`, `movie_id`, `read_at`)
SELECT `users`.`id`, `threads`.`movie_id`, unixepoch() * 1000
FROM `users` CROSS JOIN (SELECT DISTINCT `movie_id` FROM `comments`) AS `threads`;
