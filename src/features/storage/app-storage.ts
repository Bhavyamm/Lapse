import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

/**
 * Where the stores save on the web: the browser's storage. Phones use the encrypted
 * database in `app-storage.native.ts`.
 */
export const appStorage: StateStorage<Promise<void>> = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};
