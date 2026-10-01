/**
 * Minimal async key-value interface over chrome.storage, so services can be
 * tested with an in-memory store and never touch Chrome APIs directly.
 */
export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
}

export type StorageAreaName = 'local' | 'sync';

export function chromeStore(area: StorageAreaName): KeyValueStore {
  const storage = (): chrome.storage.StorageArea => chrome.storage[area];
  return {
    async get<T>(key: string): Promise<T | undefined> {
      const result = await storage().get(key);
      return result[key] as T | undefined;
    },
    async set(key, value) {
      await storage().set({ [key]: value });
    },
    async remove(key) {
      await storage().remove(key);
    },
  };
}

export function memoryStore(initial: Record<string, unknown> = {}): KeyValueStore {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    get: (key) => Promise.resolve(structuredClone(data.get(key)) as never),
    set: (key, value) => {
      data.set(key, structuredClone(value));
      return Promise.resolve();
    },
    remove: (key) => {
      data.delete(key);
      return Promise.resolve();
    },
  };
}

/** Subscribe to changes of one key in one storage area. Returns an unsubscribe function. */
export function onStorageKeyChanged(
  area: StorageAreaName,
  key: string,
  listener: (value: unknown) => void,
): () => void {
  const handler = (changes: Record<string, chrome.storage.StorageChange>, areaName: string): void => {
    const change = changes[key];
    if (areaName === area && change) listener(change.newValue);
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
