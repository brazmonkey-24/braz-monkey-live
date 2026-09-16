import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Blackbook entries: visitor-uploaded graffiti images and tags.
 * File bytes live in S3; only the storage key/URL and metadata are stored here.
 */
export const blackbookEntries = mysqlTable("blackbook_entries", {
  id: int("id").autoincrement().primaryKey(),
  /** Visitor's tag / artist name (free text). */
  tagName: varchar("tagName", { length: 128 }).notNull(),
  /** Optional caption or message. */
  caption: text("caption"),
  /** S3 storage key for the uploaded graffiti image (null for text-only tags). */
  fileKey: varchar("fileKey", { length: 512 }),
  /** Public storage URL (e.g. /manus-storage/...). */
  fileUrl: varchar("fileUrl", { length: 512 }),
  /** Original filename for reference. */
  fileName: varchar("fileName", { length: 256 }),
  /** MIME type of the uploaded file. */
  mimeType: varchar("mimeType", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlackbookEntry = typeof blackbookEntries.$inferSelect;
export type InsertBlackbookEntry = typeof blackbookEntries.$inferInsert;

/**
 * CMS content: the weekly Quote, Prediction, and Vinyl entries managed from /admin.
 * The live site reads the latest rows directly so updates appear instantly.
 */
export const cmsContent = mysqlTable("cms_content", {
  id: int("id").autoincrement().primaryKey(),
  /** Content type: quote, prediction, or vinyl. */
  type: mysqlEnum("type", ["quote", "prediction", "vinyl"]).notNull(),
  /** Main text: the quote line, the prediction, or the vinyl story. */
  body: text("body").notNull(),
  /** Vinyl title (vinyl only). */
  title: varchar("title", { length: 256 }),
  /** Vinyl artist (vinyl only). */
  artist: varchar("artist", { length: 256 }),
  /** Optional image (S3 storage URL). */
  imageUrl: varchar("imageUrl", { length: 512 }),
  /** S3 storage key for the image. */
  imageKey: varchar("imageKey", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CmsContent = typeof cmsContent.$inferSelect;
export type InsertCmsContent = typeof cmsContent.$inferInsert;

/**
 * CMS-managed page navigation maps: each primary section can expose ordered sub-links.
 */
export const cmsNavigation = mysqlTable("cms_navigation", {
  id: int("id").autoincrement().primaryKey(),
  section: varchar("section", { length: 64 }).notNull(),
  label: varchar("label", { length: 128 }).notNull(),
  path: varchar("path", { length: 256 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CmsNavigation = typeof cmsNavigation.$inferSelect;
export type InsertCmsNavigation = typeof cmsNavigation.$inferInsert;

/**
 * Weekly transmission media maps. The latest item in each slot syncs to its live card.
 */
export const cmsTransmissionMedia = mysqlTable("cms_transmission_media", {
  id: int("id").autoincrement().primaryKey(),
  slot: mysqlEnum("slot", ["monday", "wednesday", "friday"]).notNull(),
  mediaType: mysqlEnum("mediaType", ["image", "video"]).notNull(),
  title: varchar("title", { length: 256 }),
  caption: text("caption"),
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileName: varchar("fileName", { length: 256 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CmsTransmissionMedia = typeof cmsTransmissionMedia.$inferSelect;
export type InsertCmsTransmissionMedia = typeof cmsTransmissionMedia.$inferInsert;

/** Server-side CMS credentials. Passwords are stored as salted scrypt hashes. */
export const cmsAdminCredentials = mysqlTable("cms_admin_credentials", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 128 }).notNull(),
  passwordSalt: varchar("passwordSalt", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CmsAdminCredential = typeof cmsAdminCredentials.$inferSelect;
export type InsertCmsAdminCredential = typeof cmsAdminCredentials.$inferInsert;
