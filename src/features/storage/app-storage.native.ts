import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomBytesAsync } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import type { StateStorage } from 'zustand/middleware';

const DB_NAME = 'lapse.db';
const KEY_NAME = 'lapse.db-key';
/** What the stores saved in AsyncStorage before the encrypted database existed. */
const LEGACY_KEYS = ['lapse.settings', 'lapse.subscriptions'];

type Backend = {
  getItem: (name: string) => Promise<string | null>;
  setItem: (name: string, value: string) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
};

const plainBackend: Backend = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

/** True when expo-sqlite was built with SQLCipher. Expo Go's copy is plain SQLite. */
async function hasSQLCipher(): Promise<boolean> {
  const probe = await SQLite.openDatabaseAsync(':memory:');
  try {
    const row = await probe.getFirstAsync<{ cipher_version?: string }>('PRAGMA cipher_version');
    return Boolean(row?.cipher_version);
  } finally {
    await probe.closeAsync();
  }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * The database key: 32 random bytes kept in the iOS Keychain or Android Keystore. A read that
 * fails throws rather than making a new key, so a locked phone never loses the saved data.
 */
async function databaseKey(): Promise<{ key: string; created: boolean }> {
  const saved = await SecureStore.getItemAsync(KEY_NAME);
  if (saved) return { key: saved, created: false };
  const key = toHex(await getRandomBytesAsync(32));
  await SecureStore.setItemAsync(KEY_NAME, key, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
  return { key, created: true };
}

/** SQLCipher's answer when a key doesn't open the file. */
function isWrongKey(error: unknown): boolean {
  return /not a database/i.test(String(error));
}

async function openWithKey(key: string): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  try {
    await db.execAsync(`PRAGMA key = "x'${key}'"`);
    // Reading the schema fails when the key doesn't match the file.
    await db.getFirstAsync('SELECT count(*) AS n FROM sqlite_master');
    return db;
  } catch (error) {
    await db.closeAsync().catch(() => {});
    throw error;
  }
}

async function openEncrypted(): Promise<SQLite.SQLiteDatabase> {
  const { key, created } = await databaseKey();
  let db: SQLite.SQLiteDatabase;
  try {
    db = await openWithKey(key);
  } catch (error) {
    // Only a file left from a key this phone no longer has (a restored backup or a cleared
    // keychain) is replaced: nothing can read it. Any other failure keeps the file for next launch.
    if (!created || !isWrongKey(error)) throw error;
    await SQLite.deleteDatabaseAsync(DB_NAME);
    db = await openWithKey(key);
  }
  await db.execAsync('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)');
  return db;
}

/** Moves anything saved in AsyncStorage by earlier versions into the database, once. */
async function moveLegacyData(db: SQLite.SQLiteDatabase): Promise<void> {
  const pairs = (await AsyncStorage.multiGet(LEGACY_KEYS)).filter((pair): pair is [string, string] => pair[1] !== null);
  if (pairs.length === 0) return;
  // A row already in the database is newer than the AsyncStorage copy, so it stays.
  await db.withTransactionAsync(async () => {
    for (const [key, value] of pairs) {
      await db.runAsync('INSERT OR IGNORE INTO kv (key, value) VALUES (?, ?)', key, value);
    }
  });
  // The copy is safe in the database now; if clearing fails, the next launch tries again.
  await AsyncStorage.multiRemove(pairs.map(([key]) => key)).catch(() => {});
}

function databaseBackend(db: SQLite.SQLiteDatabase): Backend {
  // Saves run one at a time, in the order the stores made them.
  let queue: Promise<unknown> = Promise.resolve();
  const enqueue = (task: () => Promise<unknown>) => {
    const run = queue.then(task);
    queue = run.catch(() => {});
    return run.then(() => {});
  };
  return {
    getItem: async (name) => {
      await queue;
      const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', name);
      return row?.value ?? null;
    },
    setItem: (name, value) =>
      enqueue(() => db.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', name, value)),
    removeItem: (name) => enqueue(() => db.runAsync('DELETE FROM kv WHERE key = ?', name)),
  };
}

async function openBackend(): Promise<Backend> {
  // Expo Go can't encrypt, so it keeps using AsyncStorage until the app runs in a development build.
  if (!(await hasSQLCipher())) return plainBackend;
  const db = await openEncrypted();
  await moveLegacyData(db);
  return databaseBackend(db);
}

let backend: Promise<Backend> | null = null;
/**
 * Opened once per launch. If opening fails, every read and save fails for the rest of the launch
 * instead of saving empty state over data that couldn't be read; the stores then start empty
 * and the data is back on the next launch. Opening only fails when the keychain or the file
 * can't be read, which a phone the person just unlocked doesn't do.
 */
function getBackend(): Promise<Backend> {
  backend ??= openBackend();
  return backend;
}

function warn(error: unknown) {
  console.warn('lapse. could not save', error);
}

/**
 * Where the stores save on a phone: an SQLCipher database encrypted with a key from the
 * keychain. Needs a development build; Expo Go falls back to AsyncStorage.
 */
export const appStorage: StateStorage<Promise<void>> = {
  getItem: async (name) => (await getBackend()).getItem(name),
  setItem: (name, value) =>
    getBackend()
      .then((b) => b.setItem(name, value))
      .catch(warn),
  removeItem: (name) =>
    getBackend()
      .then((b) => b.removeItem(name))
      .catch(warn),
};
