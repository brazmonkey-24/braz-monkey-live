import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, blackbookEntries, InsertBlackbookEntry, cmsContent, InsertCmsContent, cmsNavigation, InsertCmsNavigation } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

export async function insertBlackbookEntry(entry: InsertBlackbookEntry) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert blackbook entry: database not available");
    return undefined;
  }
  const result = await db.insert(blackbookEntries).values(entry);
  return result;
}

export async function getBlackbookEntries() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get blackbook entries: database not available");
    return [];
  }
  return db.select().from(blackbookEntries).orderBy(desc(blackbookEntries.createdAt)).limit(24);
}

export async function insertCmsContent(entry: InsertCmsContent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(cmsContent).values(entry);
}

export async function getLatestCmsContent(type: "quote" | "prediction" | "vinyl") {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(cmsContent)
    .where(eq(cmsContent.type, type))
    .orderBy(desc(cmsContent.createdAt))
    .limit(1);
  return rows[0];
}

export async function listCmsContent() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cmsContent).orderBy(desc(cmsContent.createdAt)).limit(50);
}

export async function updateCmsContent(id: number, data: { body: string; title?: string; artist?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cmsContent).set(data).where(eq(cmsContent.id, id));
}

export async function deleteCmsContent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cmsContent).where(eq(cmsContent.id, id));
}

export async function listCmsNavigation() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cmsNavigation).orderBy(asc(cmsNavigation.section), asc(cmsNavigation.sortOrder), asc(cmsNavigation.id));
}

export async function insertCmsNavigation(entry: InsertCmsNavigation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(cmsNavigation).values(entry);
}

export async function updateCmsNavigation(id: number, data: { section: string; label: string; path: string; sortOrder: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cmsNavigation).set(data).where(eq(cmsNavigation.id, id));
}

export async function deleteCmsNavigation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cmsNavigation).where(eq(cmsNavigation.id, id));
}
