CREATE TABLE `cms_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('quote','prediction','vinyl') NOT NULL,
	`body` text NOT NULL,
	`title` varchar(256),
	`artist` varchar(256),
	`imageUrl` varchar(512),
	`imageKey` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cms_content_id` PRIMARY KEY(`id`)
);
