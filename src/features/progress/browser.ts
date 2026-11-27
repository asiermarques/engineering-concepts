import { createProgressStore, type ProgressStore, type StorageLike } from './store';

let shared: ProgressStore | undefined;

/** `localStorage`, or null when the browser blocks it (private mode, blocked site data). */
function browserStorage(): StorageLike | null {
  try {
    const storage = window.localStorage;
    const probe = 'engineering-concepts:probe';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

/** The Progress store of this page; every island and script on the page shares it. */
export function getProgressStore(): ProgressStore {
  shared ??= createProgressStore(browserStorage());
  return shared;
}
