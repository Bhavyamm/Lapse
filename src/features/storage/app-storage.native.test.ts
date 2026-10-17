import type AsyncStorageType from '@react-native-async-storage/async-storage';

import type { appStorage as AppStorage } from './app-storage';

jest.unmock('@/features/storage/app-storage');

type FakeFile = { key: string | null; rows: Map<string, string> };
/** Database files that outlive a launch, and whether this build has SQLCipher. */
const mockFiles = new Map<string, FakeFile>();
const mockKeychain = new Map<string, string>();
const mockSqlite = { cipher: true, failKeychain: false, seed: 0 };

jest.mock('expo-sqlite', () => {
  function connection(name: string) {
    let givenKey: string | null = null;
    const file = () => {
      let f = mockFiles.get(name);
      if (!f) mockFiles.set(name, (f = { key: givenKey, rows: new Map() }));
      if (f.key !== givenKey) throw new Error('file is not a database');
      return f;
    };
    return {
      execAsync: jest.fn(async (sql: string) => {
        const key = /PRAGMA key = "x'([0-9a-f]+)'"/.exec(sql);
        if (key) givenKey = key[1];
        else file();
      }),
      getFirstAsync: jest.fn(async (sql: string, ...params: string[]) => {
        if (sql === 'PRAGMA cipher_version') return mockSqlite.cipher ? { cipher_version: '4.6.1' } : null;
        if (sql.startsWith('SELECT count')) return file() && { n: 0 };
        const value = file().rows.get(params[0]);
        return value === undefined ? null : { value };
      }),
      runAsync: jest.fn(async (sql: string, ...params: string[]) => {
        const { rows } = file();
        if (sql.startsWith('DELETE')) rows.delete(params[0]);
        else if (sql.startsWith('INSERT OR REPLACE') || !rows.has(params[0])) rows.set(params[0], params[1]);
      }),
      withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
      closeAsync: jest.fn(async () => {}),
    };
  }
  return {
    openDatabaseAsync: jest.fn(async (name: string) => connection(name)),
    deleteDatabaseAsync: jest.fn(async (name: string) => void mockFiles.delete(name)),
  };
});
jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK: 0,
  getItemAsync: jest.fn(async (name: string) => {
    if (mockSqlite.failKeychain) throw new Error('User interaction is not allowed');
    return mockKeychain.get(name) ?? null;
  }),
  setItemAsync: jest.fn(async (name: string, value: string) => void mockKeychain.set(name, value)),
}));
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async (n: number) => {
    mockSqlite.seed += 1;
    return Uint8Array.from({ length: n }, (_, i) => (i * 37 + mockSqlite.seed) % 256);
  }),
}));

/** A fresh launch of the app: modules load again, files and keychain stay. */
function launch(): { appStorage: typeof AppStorage; AsyncStorage: typeof AsyncStorageType } {
  jest.resetModules();
  return {
    appStorage: jest.requireActual<typeof import('./app-storage')>('./app-storage').appStorage,
    AsyncStorage: jest.requireMock('@react-native-async-storage/async-storage'),
  };
}

beforeEach(() => {
  mockFiles.clear();
  mockKeychain.clear();
  mockSqlite.cipher = true;
  mockSqlite.failKeychain = false;
});

describe('appStorage on a development build', () => {
  it('saves into the encrypted database and reads it back next launch', async () => {
    const first = launch();
    await first.appStorage.setItem('lapse.settings', '{"a":1}');
    expect(mockFiles.get('lapse.db')?.rows.get('lapse.settings')).toBe('{"a":1}');
    expect(await first.AsyncStorage.getItem('lapse.settings')).toBeNull();

    const second = launch();
    expect(await second.appStorage.getItem('lapse.settings')).toBe('{"a":1}');
  });

  it('keys the database with 32 random bytes kept in the keychain', async () => {
    const { appStorage } = launch();
    await appStorage.setItem('lapse.settings', '{}');
    const key = mockKeychain.get('lapse.db-key');
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(mockFiles.get('lapse.db')?.key).toBe(key);
    expect(jest.requireMock('expo-secure-store').setItemAsync).toHaveBeenCalledWith('lapse.db-key', key, {
      keychainAccessible: 0,
    });
  });

  it('moves data saved in AsyncStorage by earlier versions into the database', async () => {
    const { appStorage, AsyncStorage } = launch();
    await AsyncStorage.setItem('lapse.subscriptions', '{"subs":[]}');
    await AsyncStorage.setItem('other', 'x');

    expect(await appStorage.getItem('lapse.subscriptions')).toBe('{"subs":[]}');
    expect(await AsyncStorage.getItem('lapse.subscriptions')).toBeNull();
    expect(await AsyncStorage.getItem('other')).toBe('x');
  });

  it('keeps the database copy when AsyncStorage still has an older one', async () => {
    await launch().appStorage.setItem('lapse.settings', 'new');
    const { appStorage, AsyncStorage } = launch();
    await AsyncStorage.setItem('lapse.settings', 'old');
    expect(await appStorage.getItem('lapse.settings')).toBe('new');
  });

  it('starts a new database when the keychain lost the key', async () => {
    await launch().appStorage.setItem('lapse.settings', 'unreadable');
    mockKeychain.clear();
    const { appStorage } = launch();
    expect(await appStorage.getItem('lapse.settings')).toBeNull();
    await appStorage.setItem('lapse.settings', 'fresh');
    expect(mockFiles.get('lapse.db')?.rows.get('lapse.settings')).toBe('fresh');
  });

  it('never replaces the key or the data when the keychain can’t be read', async () => {
    await launch().appStorage.setItem('lapse.settings', 'saved');
    const key = mockKeychain.get('lapse.db-key');
    mockSqlite.failKeychain = true;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { appStorage } = launch();

    await expect(appStorage.getItem('lapse.settings')).rejects.toThrow('User interaction');
    await appStorage.setItem('lapse.settings', 'empty');
    expect(warn).toHaveBeenCalled();
    expect(mockKeychain.get('lapse.db-key')).toBe(key);
    expect(mockFiles.get('lapse.db')?.rows.get('lapse.settings')).toBe('saved');
    warn.mockRestore();
  });

  it('applies saves in order and reads after them', async () => {
    const { appStorage } = launch();
    void appStorage.setItem('lapse.settings', '1');
    void appStorage.setItem('lapse.settings', '2');
    void appStorage.removeItem('lapse.other');
    expect(await appStorage.getItem('lapse.settings')).toBe('2');
  });

  it('removes items', async () => {
    const { appStorage } = launch();
    await appStorage.setItem('lapse.settings', '1');
    await appStorage.removeItem('lapse.settings');
    expect(await appStorage.getItem('lapse.settings')).toBeNull();
  });
});

describe('appStorage in Expo Go', () => {
  it('keeps using AsyncStorage when SQLite has no SQLCipher', async () => {
    mockSqlite.cipher = false;
    const { appStorage, AsyncStorage } = launch();
    await appStorage.setItem('lapse.settings', '{"a":1}');
    expect(await AsyncStorage.getItem('lapse.settings')).toBe('{"a":1}');
    expect(await appStorage.getItem('lapse.settings')).toBe('{"a":1}');
    expect(mockFiles.has('lapse.db')).toBe(false);
    expect(mockKeychain.size).toBe(0);
  });
});
