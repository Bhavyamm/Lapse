import { create } from 'zustand';

/** Whether the Face ID lock covers the app right now. Not saved. */
export const useLock = create<{ locked: boolean }>()(() => ({ locked: false }));
