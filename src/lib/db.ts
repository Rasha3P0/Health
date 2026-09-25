import { DEFAULT_SETTINGS, EMPTY_PREP, type DayEntry, type Period, type Prep, type Settings, type Snapshot, type WeekEntry } from './types';

// On-device storage only. There is no server, no account and no sync: nothing
// in this file makes a network request.

const DB_NAME = 'record';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('days')) db.createObjectStore('days', { keyPath: 'date' });
      if (!db.objectStoreNames.contains('weeks')) db.createObjectStore('weeks', { keyPath: 'week' });
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function all<T>(store: IDBObjectStore): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const r = store.getAll();
    r.onsuccess = () => resolve(r.result as T[]);
    r.onerror = () => reject(r.error);
  });
}

function get<T>(store: IDBObjectStore, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const r = store.get(key);
    r.onsuccess = () => resolve(r.result as T | undefined);
    r.onerror = () => reject(r.error);
  });
}

export async function loadAll(): Promise<Snapshot> {
  const db = await open();
  const tx = db.transaction(['days', 'weeks', 'kv'], 'readonly');
  const [days, weeks, periods, prep, settings] = await Promise.all([
    all<DayEntry>(tx.objectStore('days')),
    all<WeekEntry>(tx.objectStore('weeks')),
    get<Period[]>(tx.objectStore('kv'), 'periods'),
    get<Prep>(tx.objectStore('kv'), 'prep'),
    get<Settings>(tx.objectStore('kv'), 'settings'),
  ]);
  return {
    days,
    weeks,
    periods: periods ?? [],
    prep: { ...EMPTY_PREP, ...prep },
    settings: { ...DEFAULT_SETTINGS, ...settings },
  };
}

export async function putDay(entry: DayEntry) {
  const db = await open();
  const tx = db.transaction('days', 'readwrite');
  tx.objectStore('days').put(entry);
  await done(tx);
}

export async function putWeek(entry: WeekEntry) {
  const db = await open();
  const tx = db.transaction('weeks', 'readwrite');
  tx.objectStore('weeks').put(entry);
  await done(tx);
}

export async function putKv(key: 'periods' | 'prep' | 'settings', value: unknown) {
  const db = await open();
  const tx = db.transaction('kv', 'readwrite');
  tx.objectStore('kv').put(value, key);
  await done(tx);
}

export async function replaceAll(s: Snapshot) {
  const db = await open();
  const tx = db.transaction(['days', 'weeks', 'kv'], 'readwrite');
  const days = tx.objectStore('days');
  const weeks = tx.objectStore('weeks');
  const kv = tx.objectStore('kv');
  days.clear();
  weeks.clear();
  kv.clear();
  s.days.forEach((d) => days.put(d));
  s.weeks.forEach((w) => weeks.put(w));
  kv.put(s.periods, 'periods');
  kv.put(s.prep, 'prep');
  kv.put(s.settings, 'settings');
  await done(tx);
}

export async function wipe() {
  await replaceAll({ days: [], weeks: [], periods: [], prep: EMPTY_PREP, settings: DEFAULT_SETTINGS });
}

/** Ask the browser not to evict her data under storage pressure. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
