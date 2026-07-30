/**
 * MasterIDBCache
 *
 * IndexedDB-backed persistence for master dropdown data.
 *
 * Why IndexedDB over localStorage:
 * - Async: never blocks the main thread (localStorage.getItem blocks on large JSON)
 * - Storage: 500MB+ vs ~5-10MB limit
 * - Safe for large master tables (mouza, village) with thousands of records per cascade set
 *
 * Uses raw IndexedDB API — no extra package dependency.
 * All public methods return Promises and are SSR-safe (guard on typeof window).
 */

const DB_NAME = 'coalrr_master_cache'
const DB_VERSION = 1
const STORE_DATA = 'master_data'    // { key, version, cachedAt, options }
const STORE_META = 'master_meta'    // { key: '__version', value: string }
const TTL_MS = 1000 * 60 * 60 * 24 // 24-hour hard TTL

export interface MasterCacheEntry {
  version: string
  cachedAt: number
  options: Array<{ value: string; label: string }>
}

// ─── Internal DB helpers ─────────────────────────────────────────────────────

let _db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_DATA)) {
        db.createObjectStore(STORE_DATA, { keyPath: 'cacheKey' })
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' })
      }
    }

    req.onsuccess = () => {
      _db = req.result
      resolve(_db)
    }

    req.onerror = () => reject(req.error)
  })
}

function idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  return openDB().then(
    db =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly')
        const req = tx.objectStore(storeName).get(key)
        req.onsuccess = () => resolve(req.result as T | undefined)
        req.onerror = () => reject(req.error)
      })
  )
}

function idbPut(storeName: string, value: object): Promise<void> {
  return openDB().then(
    db =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        const req = tx.objectStore(storeName).put(value)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
  )
}

function idbDelete(storeName: string, key: string): Promise<void> {
  return openDB().then(
    db =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        const req = tx.objectStore(storeName).delete(key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
  )
}

function idbGetAllKeys(storeName: string): Promise<string[]> {
  return openDB().then(
    db =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly')
        const req = tx.objectStore(storeName).getAllKeys()
        req.onsuccess = () => resolve(req.result as string[])
        req.onerror = () => reject(req.error)
      })
  )
}

// ─── Cache key ───────────────────────────────────────────────────────────────

function cacheKey(master: string, deps?: Record<string, string>): string {
  const depPart =
    deps && Object.keys(deps).length > 0
      ? '_' +
        Object.entries(deps)
          .sort()
          .map(([k, v]) => `${k}=${v}`)
          .join('&')
      : ''
  return `${master}${depPart}`
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const MasterIDBCache = {
  async get(
    master: string,
    deps?: Record<string, string>
  ): Promise<MasterCacheEntry | null> {
    if (typeof window === 'undefined') return null
    try {
      const key = cacheKey(master, deps)
      const row = await idbGet<MasterCacheEntry & { cacheKey: string }>(
        STORE_DATA,
        key
      )
      if (!row) return null

      // Hard TTL
      if (Date.now() - row.cachedAt > TTL_MS) {
        await idbDelete(STORE_DATA, key)
        return null
      }

      return { version: row.version, cachedAt: row.cachedAt, options: row.options }
    } catch {
      return null
    }
  },

  async set(
    master: string,
    deps: Record<string, string> | undefined,
    options: Array<{ value: string; label: string }>,
    version: string
  ): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      const key = cacheKey(master, deps)
      await idbPut(STORE_DATA, {
        cacheKey: key,
        version,
        cachedAt: Date.now(),
        options,
      })
    } catch {
      // IDB write failure — non-critical, data will be fetched fresh next time
    }
  },

  /** Invalidate a specific master table (all dependency variants) */
  async invalidate(master: string): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      const keys = await idbGetAllKeys(STORE_DATA)
      await Promise.all(
        keys
          .filter(k => k === master || k.startsWith(`${master}_`))
          .map(k => idbDelete(STORE_DATA, k))
      )
    } catch {}
  },

  /** Invalidate ALL master cache entries (called on server version mismatch) */
  async invalidateAll(): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      const db = await openDB()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_DATA, 'readwrite')
        const req = tx.objectStore(STORE_DATA).clear()
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    } catch {}
  },

  async getVersion(): Promise<string | null> {
    if (typeof window === 'undefined') return null
    try {
      const row = await idbGet<{ key: string; value: string }>(
        STORE_META,
        '__version'
      )
      return row?.value ?? null
    } catch {
      return null
    }
  },

  async setVersion(version: string): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      await idbPut(STORE_META, { key: '__version', value: version })
    } catch {}
  },
}
