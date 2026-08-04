import type { LoggedSet } from "./types";

const DB_NAME = "fitnotes-hub";
const DB_VERSION = 1;
const STORE = "logged_sets";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("date", "date");
        store.createIndex("routineId", "routineId");
        store.createIndex("exerciseName", "exerciseName");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export function makeSetId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function saveSet(entry: LoggedSet): Promise<void> {
  await withStore("readwrite", (store) => store.put(entry));
}

export async function deleteSet(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}

export async function getAllSets(): Promise<LoggedSet[]> {
  const result = await withStore("readonly", (store) => store.getAll());
  return (result as LoggedSet[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getSetsForRoutineToday(routineId: string, date: string): Promise<LoggedSet[]> {
  const all = await getAllSets();
  return all.filter((s) => s.routineId === routineId && s.date === date);
}
