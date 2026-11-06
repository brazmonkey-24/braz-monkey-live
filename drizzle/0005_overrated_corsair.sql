CREATE TABLE `cms_telemetry_counts` (
	`minuteBucket` bigint unsigned NOT NULL,
	`kind` enum('pageview','store_click') NOT NULL,
	`page` enum('home','transmissions','origin','archive','follow','blackbook','post') NOT NULL,
	`source` enum('direct','internal','search','social','other') NOT NULL,
	`count` bigint unsigned NOT NULL DEFAULT 1,
	CONSTRAINT `cms_telemetry_counts_minuteBucket_kind_page_source_pk` PRIMARY KEY(`minuteBucket`,`kind`,`page`,`source`)
);
