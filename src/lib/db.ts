/**
 * IndexedDB setup and helpers via `idb`.
 *
 * Schema v1:
 *   - gameRecords: stores completed games
 *   - reviewCards: spaced repetition queue
 *   - inProgressGame: singleton for auto-save/resume
 *   - userSettings: singleton for settings
 */

import { openDB, type IDBPDatabase } from "idb";
import type {
  GameRecord,
  ReviewCard,
  InProgressGame,
  UserSettings,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";

const DB_NAME = "boggle-practice";
const DB_VERSION = 1;

export type BoggleDB = IDBPDatabase<{
  gameRecords: {
    key: string;
    value: GameRecord;
    indexes: {
      "by-timestamp": number;
      "by-gridSize": number;
      "by-dictionary": string;
    };
  };
  reviewCards: {
    key: string;
    value: ReviewCard;
    indexes: {
      "by-nextReviewDate": number;
      "by-dictionary": string;
    };
  };
  inProgressGame: {
    key: string;
    value: InProgressGame;
  };
  userSettings: {
    key: string;
    value: UserSettings;
  };
}>;

let dbInstance: BoggleDB | null = null;
let dbFailed = false;

export async function getDB(): Promise<BoggleDB | null> {
  if (dbFailed) return null;
  if (dbInstance) return dbInstance;

  try {
    dbInstance = (await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Game records
        if (!db.objectStoreNames.contains("gameRecords")) {
          const store = db.createObjectStore("gameRecords", { keyPath: "id" });
          store.createIndex("by-timestamp", "timestamp");
          store.createIndex("by-gridSize", "gridSize");
          store.createIndex("by-dictionary", "dictionary");
        }

        // Review cards
        if (!db.objectStoreNames.contains("reviewCards")) {
          const store = db.createObjectStore("reviewCards", { keyPath: "id" });
          store.createIndex("by-nextReviewDate", "nextReviewDate");
          store.createIndex("by-dictionary", "dictionary");
        }

        // In-progress game (singleton)
        if (!db.objectStoreNames.contains("inProgressGame")) {
          db.createObjectStore("inProgressGame", { keyPath: "id" });
        }

        // User settings (singleton)
        if (!db.objectStoreNames.contains("userSettings")) {
          db.createObjectStore("userSettings");
        }
      },
    })) as unknown as BoggleDB;

    return dbInstance;
  } catch (e) {
    console.error("Failed to open IndexedDB:", e);
    dbFailed = true;
    return null;
  }
}

// === Game Records ===

export async function saveGameRecord(record: GameRecord): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.put("gameRecords", record);
}

export async function getGameRecord(id: string): Promise<GameRecord | undefined> {
  const db = await getDB();
  if (!db) return undefined;
  return db.get("gameRecords", id);
}

export async function getAllGameRecords(): Promise<GameRecord[]> {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAllFromIndex("gameRecords", "by-timestamp");
  return all.reverse(); // newest first
}

export async function getRecentGameRecords(count: number): Promise<GameRecord[]> {
  const all = await getAllGameRecords();
  return all.slice(0, count);
}

// === Review Cards ===

export async function saveReviewCard(card: ReviewCard): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.put("reviewCards", card);
}

export async function deleteReviewCard(id: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete("reviewCards", id);
}

export async function getDueReviewCards(dictionary: string): Promise<ReviewCard[]> {
  const db = await getDB();
  if (!db) return [];
  const all = await db.getAllFromIndex("reviewCards", "by-dictionary", dictionary);
  const now = Date.now();
  return all.filter((c) => c.nextReviewDate <= now);
}

export async function getAllReviewCards(): Promise<ReviewCard[]> {
  const db = await getDB();
  if (!db) return [];
  return db.getAll("reviewCards");
}

// === In-Progress Game ===

export async function saveInProgressGame(game: InProgressGame): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.put("inProgressGame", game);
}

export async function getInProgressGame(): Promise<InProgressGame | undefined> {
  const db = await getDB();
  if (!db) return undefined;
  return db.get("inProgressGame", "current");
}

export async function clearInProgressGame(): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete("inProgressGame", "current");
}

// === User Settings ===

export async function getSettings(): Promise<UserSettings> {
  const db = await getDB();
  if (!db) return DEFAULT_SETTINGS;
  const settings = await db.get("userSettings", "settings");
  return settings ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.put("userSettings", settings, "settings");
}

// === Data Export / Import ===

export interface ExportPayload {
  version: 1;
  exportedAt: number;
  gameRecords: GameRecord[];
  reviewCards: ReviewCard[];
  userSettings: UserSettings;
}

export async function exportAllData(): Promise<ExportPayload> {
  const [gameRecords, reviewCards, userSettings] = await Promise.all([
    getAllGameRecords(),
    getAllReviewCards(),
    getSettings(),
  ]);
  return {
    version: 1,
    exportedAt: Date.now(),
    gameRecords,
    reviewCards,
    userSettings,
  };
}

export async function importAllData(payload: ExportPayload): Promise<void> {
  const db = await getDB();
  if (!db) throw new Error("IndexedDB not available");

  // Clear existing data
  await db.clear("gameRecords");
  await db.clear("reviewCards");
  await db.clear("inProgressGame");

  // Write imported data
  const tx = db.transaction(
    ["gameRecords", "reviewCards", "userSettings"],
    "readwrite",
  );

  for (const record of payload.gameRecords) {
    await tx.objectStore("gameRecords").put(record);
  }
  for (const card of payload.reviewCards) {
    await tx.objectStore("reviewCards").put(card);
  }
  await tx.objectStore("userSettings").put(payload.userSettings, "settings");

  await tx.done;
}
