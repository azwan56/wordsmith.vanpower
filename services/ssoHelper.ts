/**
 * SSO Helper - Extracts Firebase auth data from IndexedDB.
 * The data is then encoded into a URL hash so the target app can
 * restore the session without requiring a new login.
 */

/**
 * Reads all Firebase auth entries from the local IndexedDB.
 * Returns null if the database or object store doesn't exist.
 */
export function getAuthDataFromIDB(): Promise<Array<{ fbase_key: string; value: any }> | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('firebaseLocalStorageDb');
      req.onerror = () => resolve(null);
      req.onsuccess = (ev: any) => {
        const db = ev.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
          resolve(null);
          return;
        }
        const tx = db.transaction('firebaseLocalStorage', 'readonly');
        const store = tx.objectStore('firebaseLocalStorage');
        const getAllValues = store.getAll();
        const getAllKeys = store.getAllKeys();
        getAllValues.onsuccess = () => {
          getAllKeys.onsuccess = () => {
            const values = getAllValues.result;
            const keys = getAllKeys.result;
            if (!keys.length) { resolve(null); return; }
            const data = keys.map((k, i) => ({ fbase_key: k as string, value: values[i] }));
            resolve(data);
          };
          getAllKeys.onerror = () => resolve(null);
        };
        getAllValues.onerror = () => resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Polls IDB for Firebase auth data, retrying until data is found or attempts
 * are exhausted. Handles the race condition where Firebase hasn't yet written
 * its token to IDB at the moment of the first call (e.g. right after login).
 */
export async function getAuthDataFromIDBWithRetry(
  maxAttempts = 6,
  delayMs = 400,
): Promise<Array<{ fbase_key: string; value: any }> | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const data = await getAuthDataFromIDB();
    if (data && data.length > 0) return data;
    if (i < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}

/**
 * Builds a cross-app URL with the SSO auth payload appended as a URL hash.
 * Safe to use directly in <a href> — no async needed at click time.
 */
export function buildSSOUrl(base: string, ssoPayload: string | null): string {
  if (!ssoPayload) return base;
  return `${base}#auth_sync=${ssoPayload}`;
}
