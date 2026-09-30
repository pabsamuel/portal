// media-store.js — keeps the user's own video files in this browser (IndexedDB), so they survive reloads.
// Files never leave the device.
const DB = 'fw-media', STORE = 'videos';

function openDb() {
  return new Promise((res, rej) => {
    if (!('indexedDB' in window)) { rej(new Error('no-idb')); return; }
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'id' }); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function tx(mode, fn) {
  return openDb().then((db) => new Promise((res, rej) => {
    const t = db.transaction(STORE, mode), st = t.objectStore(STORE);
    const out = fn(st);
    t.oncomplete = () => res(out && 'result' in out ? out.result : true);
    t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  }));
}

/** [{id, name, type, size, added, blob}] */
export async function listVideos() { try { return (await tx('readonly', (st) => st.getAll())) || []; } catch { return []; } }
export function saveVideo(rec) { return tx('readwrite', (st) => st.put(rec)); }
export function deleteVideo(id) { return tx('readwrite', (st) => st.delete(id)).catch(() => false); }
