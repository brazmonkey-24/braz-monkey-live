CREATE TABLE `cms_navigation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`section` varchar(64) NOT NULL,
	`label` varchar(128) NOT NULL,
	`path` varchar(256) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cms_navigation_id` PRIMARY KEY(`id`)
);
