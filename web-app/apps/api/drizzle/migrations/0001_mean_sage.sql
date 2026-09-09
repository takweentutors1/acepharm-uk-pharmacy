CREATE TABLE `auth_email_verification_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `auth_password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`request_ip` text,
	`is_migration` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `auth_refresh_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`family_id` text NOT NULL,
	`user_agent` text,
	`ip` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`replaced_by_token_hash` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`firebase_uid` text,
	`password_hash` text,
	`email` text NOT NULL,
	`email_verified_at` integer,
	`first_name` text,
	`role` text DEFAULT 'student' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`deletion_requested_at` integer,
	`timezone` text DEFAULT 'Europe/London' NOT NULL,
	`marketing_opt_in` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_login_at` integer
);--> statement-breakpoint
INSERT INTO `__new_users`(`id`, `firebase_uid`, `password_hash`, `email`, `email_verified_at`, `first_name`, `role`, `status`, `deletion_requested_at`, `timezone`, `marketing_opt_in`, `created_at`, `updated_at`, `last_login_at`)
SELECT `id`, `firebase_uid`, NULL, `email`, `email_verified_at`, `first_name`, `role`, `status`, `deletion_requested_at`, `timezone`, `marketing_opt_in`, `created_at`, `updated_at`, `last_login_at` FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_firebase_uid_unique` ON `users` (`firebase_uid`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `auth_email_verification_tokens_token_hash_unique` ON `auth_email_verification_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `auth_evt_user_idx` ON `auth_email_verification_tokens` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_password_reset_tokens_token_hash_unique` ON `auth_password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `auth_prt_user_idx` ON `auth_password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_refresh_tokens_token_hash_unique` ON `auth_refresh_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `auth_refresh_tokens_user_idx` ON `auth_refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `auth_refresh_tokens_family_idx` ON `auth_refresh_tokens` (`family_id`);--> statement-breakpoint
CREATE INDEX `attempts_user_correct_idx` ON `question_attempts` (`user_id`,`is_correct`);--> statement-breakpoint
CREATE INDEX `questions_status_subtopic_idx` ON `questions` (`status`,`primary_subtopic_id`);--> statement-breakpoint
CREATE INDEX `questions_status_pathway_idx` ON `questions` (`status`,`pathway_id`);