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
