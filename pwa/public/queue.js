import { demoMode } from './mode.js';
export const MAX_FILE = 12 * 1024 * 1024;
export const MAX_BYTES = 50 * 1024 * 1024;
export const MAX_COUNT = 10;
let database;
function request(req) { return new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
async function db() {
  if (!database) database = await new Promise((resolve, reject) => {
    const req = indexedDB.open(demoMode ? 'fieldbook-demo-pending' : 'fieldbook-pending', 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('pending', { keyPath: 'id' }); req.result.createObjectStore('keys'); };
    req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
  });
  return database;
}
async function transact(store, mode, action) {
  const d = await db(); const tx = d.transaction(store, mode); const done = new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('Storage transaction aborted')); });
  const result = await action(tx.objectStore(store)); await done; return result;
}
async function key(create = false) {
  let k = await transact('keys', 'readonly', s => request(s.get('device')));
  if (!k && create) {
    const generated = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    k = await transact('keys', 'readwrite', async s => { const existing = await request(s.get('device')); if (existing) return existing; s.put(generated, 'device'); return generated; });
  }
  if (!k) throw new Error('Device key unavailable. Reconcile received sheets and recapture from paper.');
  return k;
}
export async function list() { return transact('pending', 'readonly', s => request(s.getAll())); }
export async function remove(id) { return transact('pending', 'readwrite', s => request(s.delete(id))); }
export async function markAttempt(id) { return transact('pending', 'readwrite', async s => { const row = await request(s.get(id)); if (row) { row.attempted = true; s.put(row); } }); }
export async function enqueue(blob, context) {
  if (!blob.size || blob.size > MAX_FILE) throw new Error('Choose a photo no larger than 12 MB.');
  const id = crypto.randomUUID(), iv = crypto.getRandomValues(new Uint8Array(12));
  const metadata = new TextEncoder().encode(JSON.stringify(context)); const image = new Uint8Array(await blob.arrayBuffer());
  const bytes = new Uint8Array(4 + metadata.length + image.length); new DataView(bytes.buffer).setUint32(0, metadata.length); bytes.set(metadata, 4); bytes.set(image, 4 + metadata.length);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(true), bytes);
  await transact('pending', 'readwrite', async s => {
    const rows = await request(s.getAll());
    if (rows.length >= MAX_COUNT || rows.reduce((n,r) => n+r.size,0)+blob.size > MAX_BYTES) throw new Error('Pending storage is full. Send or delete unsent photos before adding another.');
    s.add({ id, iv, encrypted, size: blob.size, created: Date.now(), attempted: false });
  }); return id;
}
export async function unpack(row) {
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: row.iv }, await key(), row.encrypted);
  const length = new DataView(bytes).getUint32(0); const context = JSON.parse(new TextDecoder().decode(bytes.slice(4,4+length)));
  return { context, blob: new Blob([bytes.slice(4+length)], {type:context.type}) };
}
