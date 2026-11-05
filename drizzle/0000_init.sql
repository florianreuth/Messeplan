CREATE TABLE `booths` (
	`exhibitor_id` text PRIMARY KEY NOT NULL,
	`floor_id` text NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`width` real NOT NULL,
	`height` real NOT NULL,
	FOREIGN KEY (`exhibitor_id`) REFERENCES `exhibitors`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`floor_id`) REFERENCES `floors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `booths_floor` ON `booths` (`floor_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`color` text NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`track` text NOT NULL,
	`year` integer NOT NULL,
	`section` text,
	`student_count` integer,
	`teachers` text DEFAULT '[]' NOT NULL,
	`notes` text,
	FOREIGN KEY (`track`) REFERENCES `tracks`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `classes_track` ON `classes` (`track`);--> statement-breakpoint
CREATE TABLE `exhibitors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`zone_id` text,
	`category_id` text,
	`stand_number` integer,
	`description` text,
	`website` text,
	`location_note` text,
	`contact` text,
	`contact_email` text,
	`logo_url` text,
	FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `exhibitors_zone` ON `exhibitors` (`zone_id`);--> statement-breakpoint
CREATE INDEX `exhibitors_category` ON `exhibitors` (`category_id`);--> statement-breakpoint
CREATE TABLE `floor_labels` (
	`id` text PRIMARY KEY NOT NULL,
	`floor_id` text NOT NULL,
	`text` text NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`font_size` real,
	`color` text,
	FOREIGN KEY (`floor_id`) REFERENCES `floors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `floor_labels_floor` ON `floor_labels` (`floor_id`);--> statement-breakpoint
CREATE TABLE `floor_shapes` (
	`id` text PRIMARY KEY NOT NULL,
	`floor_id` text NOT NULL,
	`type` text NOT NULL,
	`props` text NOT NULL,
	FOREIGN KEY (`floor_id`) REFERENCES `floors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `floor_shapes_floor` ON `floor_shapes` (`floor_id`);--> statement-breakpoint
CREATE TABLE `floors` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`width` real NOT NULL,
	`height` real NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`mime` text NOT NULL,
	`data` blob NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`capacity` integer,
	`floor` text
);
--> statement-breakpoint
CREATE TABLE `schedule_entries` (
	`class_id` text NOT NULL,
	`time_slot_id` text NOT NULL,
	`zone_id` text NOT NULL,
	`type` text NOT NULL,
	PRIMARY KEY(`class_id`, `time_slot_id`, `zone_id`),
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `schedule_entries_time_slot` ON `schedule_entries` (`time_slot_id`);--> statement-breakpoint
CREATE INDEX `schedule_entries_zone` ON `schedule_entries` (`zone_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `talks` (
	`id` text PRIMARY KEY NOT NULL,
	`exhibitor_id` text,
	`room_id` text,
	`start_time` text,
	`duration_minutes` integer,
	`format` text,
	`topic` text,
	`speaker_name` text,
	`speaker_role` text,
	`notes` text,
	FOREIGN KEY (`exhibitor_id`) REFERENCES `exhibitors`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `talks_exhibitor` ON `talks` (`exhibitor_id`);--> statement-breakpoint
CREATE INDEX `talks_room` ON `talks` (`room_id`);--> statement-breakpoint
CREATE TABLE `time_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`label` text
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`first_year` integer NOT NULL,
	`last_year` integer NOT NULL,
	`sections` integer NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `zones` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`color` text NOT NULL,
	`position` integer NOT NULL
);
