import { emptyProgress, parseProgress, serializeProgress, type Progress } from './progress';

export const STORAGE_KEY = 'engineering-concepts:progress';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface ProgressStore {
  get(): Progress;
  update(change: (current: Progress) => Progress): void;
  reset(): void;
  /** JSON text of the current Progress, as stored. */
  export(): string;
  /** Replaces the current Progress with the file's. Returns false, changing nothing, if it is invalid. */
  import(raw: string): boolean;
  /** False when browser storage is unavailable or a write failed: Progress then lives in memory only. */
  canSave(): boolean;
  subscribe(listener: () => void): () => void;
}

/**
 * The only place that reads and writes browser storage (ARCHITECTURE.md, Browser state).
 * Any storage failure degrades to in-memory state for the rest of the session.
 */
export function createProgressStore(storage: StorageLike | null): ProgressStore {
  let saving = storage !== null;
  let progress = emptyProgress();
  const listeners = new Set<() => void>();

  if (storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw !== null) progress = parseProgress(raw) ?? emptyProgress();
    } catch {
      saving = false;
    }
  }

  const persist = () => {
    if (!storage || !saving) return;
    try {
      storage.setItem(STORAGE_KEY, serializeProgress(progress));
    } catch {
      saving = false;
    }
  };

  const set = (next: Progress) => {
    progress = next;
    persist();
    listeners.forEach((listener) => listener());
  };

  return {
    get: () => progress,
    update: (change) => set(change(progress)),
    reset: () => set(emptyProgress()),
    export: () => serializeProgress(progress),
    import(raw) {
      const imported = parseProgress(raw);
      if (!imported) return false;
      set(imported);
      return true;
    },
    canSave: () => saving,
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
