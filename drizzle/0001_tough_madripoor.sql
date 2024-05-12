CREATE TABLE `communities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `community_to_topic` (
	`community_id` text NOT NULL,
	`topic_id` text NOT NULL,
	PRIMARY KEY(`community_id`, `topic_id`),
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `communities_name_unique` ON `communities` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `communities_slug_unique` ON `communities` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `topics_name_unique` ON `topics` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `topics_slug_unique` ON `topics` (`slug`);