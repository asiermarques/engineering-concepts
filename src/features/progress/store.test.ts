import { describe, expect, it, vi } from 'vitest';
import { conceptStatus, serializeProgress, emptyProgress, recordResult } from './progress';
import { createProgressStore, STORAGE_KEY } from './store';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  data = new Map<string, string>();
  failWrites = false;
  getItem = (k: string) => this.data.get(k) ?? null;
  setItem = (k: string, v: string) => {
    if (this.failWrites) throw new DOMException('full', 'QuotaExceededError');
    this.data.set(k, v);
  };
  removeItem = (k: string) => void this.data.delete(k);
}

const mastered = recordResult(emptyProgress(), 'x', { correct: 2, total: 2 });

describe('progress store', () => {
  it('starts empty when nothing is stored', () => {
    const store = createProgressStore(new MemoryStorage());
    expect(store.get().concepts).toEqual({});
    expect(store.canSave()).toBe(true);
  });

  it('persists updates and reads them back in a new store', () => {
    const storage = new MemoryStorage();
    createProgressStore(storage).update((p) => recordResult(p, 'x', { correct: 2, total: 2 }));
    expect(conceptStatus(createProgressStore(storage).get(), 'x')).toBe('mastered');
  });

  it('discards corrupt stored data without throwing', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{corrupt');
    const store = createProgressStore(storage);
    expect(store.get().concepts).toEqual({});
    expect(store.canSave()).toBe(true);
  });

  it('works in memory when there is no storage', () => {
    const store = createProgressStore(null);
    expect(store.canSave()).toBe(false);
    store.update((p) => recordResult(p, 'x', { correct: 1, total: 1 }));
    expect(conceptStatus(store.get(), 'x')).toBe('mastered');
  });

  it('works in memory when reading storage throws', () => {
    const storage = new MemoryStorage();
    storage.getItem = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    const store = createProgressStore(storage);
    expect(store.canSave()).toBe(false);
    expect(store.get().concepts).toEqual({});
  });

  it('switches to memory mode when a write fails and keeps the data', () => {
    const storage = new MemoryStorage();
    const store = createProgressStore(storage);
    storage.failWrites = true;
    store.update((p) => recordResult(p, 'x', { correct: 2, total: 2 }));
    expect(store.canSave()).toBe(false);
    expect(conceptStatus(store.get(), 'x')).toBe('mastered');
  });

  it('notifies subscribers on changes until they unsubscribe', () => {
    const store = createProgressStore(new MemoryStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.update((p) => p);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.update((p) => p);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reset clears everything, including stored data', () => {
    const storage = new MemoryStorage();
    const store = createProgressStore(storage);
    store.update(() => mastered);
    store.reset();
    expect(store.get().concepts).toEqual({});
    expect(createProgressStore(storage).get().concepts).toEqual({});
  });

  it('exports the current progress, in memory too', () => {
    const store = createProgressStore(null);
    store.update(() => mastered);
    expect(store.export()).toBe(serializeProgress(mastered));
  });

  it('exports empty progress that can be imported', () => {
    const store = createProgressStore(new MemoryStorage());
    const other = createProgressStore(new MemoryStorage());
    expect(other.import(store.export())).toBe(true);
  });

  it('import replaces the current progress with a valid file', () => {
    const store = createProgressStore(new MemoryStorage());
    store.update((p) => recordResult(p, 'other', { correct: 1, total: 2 }));
    expect(store.import(serializeProgress(mastered))).toBe(true);
    expect(store.get()).toEqual(mastered);
  });

  it('import rejects an invalid file and leaves the progress untouched', () => {
    const store = createProgressStore(new MemoryStorage());
    store.update(() => mastered);
    expect(store.import('{"version":99}')).toBe(false);
    expect(store.get()).toEqual(mastered);
  });
});
