/* Brand responses to an action: a written reply, links, and files (screenshots,
   PDFs, documents). Kept in this browser's IndexedDB until brand accounts and a
   server-side inbox exist; nothing here is sent anywhere. */

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 8;
export const ACCEPT = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt';
const OK_TYPE = /^(image\/|application\/pdf$|text\/(plain|csv)$|application\/(msword|vnd\.openxmlformats-officedocument\.|vnd\.ms-excel))/;

/** Pull http(s) links out of free text, one per line or separated by spaces. */
export function parseLinks(text) {
  const out = [];
  for (const raw of String(text || '').split(/[\s,]+/)) {
    const t = raw.trim();
    if (!t) continue;
    try {
      const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
      if ((u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.')) out.push(u.href);
    } catch { /* not a link */ }
  }
  return [...new Set(out)];
}

/** Which of these files can be attached, and why the rest can't. */
export function checkFiles(files, already = 0) {
  const ok = [];
  const rejected = [];
  for (const f of files) {
    if (already + ok.length >= MAX_FILES) rejected.push({ name: f.name, why: `Up to ${MAX_FILES} files` });
    else if (f.size > MAX_FILE_BYTES) rejected.push({ name: f.name, why: 'Larger than 10 MB' });
    else if (!OK_TYPE.test(f.type || '')) rejected.push({ name: f.name, why: 'Use an image, PDF, Word, Excel, CSV or text file' });
    else ok.push(f);
  }
  return { ok, rejected };
}

export const fileSize = (n) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${Math.round((n / 1024 / 1024) * 10) / 10} MB`);

const DB = 'ps-submissions';
function db() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('no_indexeddb')); return; }
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('items', { keyPath: 'key' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
const keyOf = (brand, actionId) => `${brand}::${actionId}`;

export async function loadSubmissions(brand) {
  try {
    const d = await db();
    return await new Promise((resolve) => {
      const out = {};
      const req = d.transaction('items').objectStore('items').openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (!c) { resolve(out); return; }
        if (c.value.brand === brand) out[c.value.actionId] = c.value;
        c.continue();
      };
      req.onerror = () => resolve(out);
    });
  } catch { return {}; }
}

export async function saveSubmission(brand, actionId, value) {
  const record = { ...value, brand, actionId, key: keyOf(brand, actionId), updatedAt: new Date().toISOString() };
  const d = await db();
  await new Promise((resolve, reject) => {
    const tx = d.transaction('items', 'readwrite');
    tx.objectStore('items').put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  return record;
}
