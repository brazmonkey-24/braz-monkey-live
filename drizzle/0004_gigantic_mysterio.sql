CREATE TABLE `cms_admin_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(320) NOT NULL,
	`passwordHash` varchar(128) NOT NULL,
	`passwordSalt` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cms_admin_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `cms_admin_credentials_username_unique` UNIQUE(`username`)
);
