import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertStudyFile, InsertUser, StudyFile, studyFiles, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

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
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values: InsertUser = { openId: user.openId };
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
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listStudyFiles(userId: number): Promise<StudyFile[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studyFiles).where(eq(studyFiles.userId, userId)).orderBy(desc(studyFiles.createdAt));
}

export async function insertStudyFile(file: InsertStudyFile): Promise<StudyFile> {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(studyFiles).values(file);
  const result = await db.select().from(studyFiles).where(eq(studyFiles.fileKey, file.fileKey)).limit(1);
  if (!result[0]) throw new Error("File metadata could not be saved");
  return result[0];
}

/** Removes only the database reference. Storage keys are intentionally not deleted by this template. */
export async function deleteStudyFileForUser(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.delete(studyFiles).where(and(eq(studyFiles.id, id), eq(studyFiles.userId, userId)));
  return Number(result[0]?.affectedRows ?? 0) > 0;
}
