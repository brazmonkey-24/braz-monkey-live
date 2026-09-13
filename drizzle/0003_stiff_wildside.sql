CREATE TABLE `cms_transmission_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slot` enum('monday','wednesday','friday') NOT NULL,
	`mediaType` enum('image','video') NOT NULL,
	`title` varchar(256),
	`caption` text,
	`fileUrl` varchar(512) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileName` varchar(256) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cms_transmission_media_id` PRIMARY KEY(`id`)
);
