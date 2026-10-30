/* global process */
/**
 * Gift box products come from the team's Google Sheet ("ayna gift box
 * products"). Columns: id, category, brand, name, value, notes, image, link,
 * max, show. One product per row.
 *
 * The sheet is read as CSV (the sheet must be shared "Anyone with the link can
 * view"). Rows are upserted into giftbox_products by the sheet's id, so a
 * product keeps its database id (and its past orders) across edits. A row that
 * disappears from the sheet is hidden, never deleted. Products added by hand on
 * /admin/gift (no sheet id) are left alone.
 *
 * Checkout always prices from giftbox_products, so a half-typed edit in the
 * sheet can only change what the next sync shows, never an order in progress.
 */
import { safeUrl } from './_giftbox.js';

export const DEFAULT_SHEET_ID = '1O0SYPPDQpnq7_U5LjDI98ED5jJDLourfblzalwtgVeM';
export const SYNC_EVERY_MS = 5 * 60 * 1000;
const SHEET_ID_RE = /^[A-Za-z0-9_.-]{1,80}$/;

export function sheetCsvUrl() {
  if (process.env.GIFTBOX_SHEET_CSV_URL) return process.env.GIFTBOX_SHEET_CSV_URL;
  const id = process.env.GIFTBOX_SHEET_ID || DEFAULT_SHEET_ID;
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
}

export function sheetEditUrl() {
  return `https://docs.google.com/spreadsheets/d/${process.env.GIFTBOX_SHEET_ID || DEFAULT_SHEET_ID}/edit`;
}

/** RFC 4180-ish CSV: quoted fields, "" escapes, newlines inside quotes. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const s = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i += 1; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i += 1;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Drive share links → a direct image URL. Anything else passes through safeUrl. */
export function imageUrl(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([A-Za-z0-9_-]{10,})/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`;
  return safeUrl(s);
}

const money = (v) => {
  const n = Number(String(v ?? '').replace(/[$,\s]/g, ''));
  return String(v ?? '').trim() !== '' && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};

/**
 * Sheet rows → giftbox_products rows. Header row is found by its "id" and
 * "name" columns, so extra columns or reordering don't break anything.
 * A row with no price, or show = no, is hidden.
 */
export function rowsToProducts(rows) {
  const headerAt = rows.findIndex((r) => r.map((c) => c.trim().toLowerCase()).includes('id') && r.map((c) => c.trim().toLowerCase()).includes('name'));
  if (headerAt < 0) return { products: [], skipped: [], error: 'no_header' };
  const head = rows[headerAt].map((c) => c.trim().toLowerCase());
  const col = (name) => head.indexOf(name);
  const get = (r, name) => (col(name) >= 0 ? String(r[col(name)] ?? '').trim() : '');
  const seen = new Set();
  const products = [];
  const skipped = [];
  rows.slice(headerAt + 1).forEach((r, i) => {
    const sheetId = get(r, 'id');
    const name = get(r, 'name');
    if (!sheetId && !name) return;
    if (!SHEET_ID_RE.test(sheetId) || !name) { skipped.push({ row: headerAt + i + 2, reason: !name ? 'no name' : 'bad id' }); return; }
    if (seen.has(sheetId)) { skipped.push({ row: headerAt + i + 2, reason: `duplicate id ${sheetId}` }); return; }
    seen.add(sheetId);
    const price = money(get(r, 'value'));
    const max = Number.parseInt(get(r, 'max'), 10);
    const show = !/^(no|n|false|0|hide|hidden)$/i.test(get(r, 'show'));
    products.push({
      sheet_id: sheetId,
      category: get(r, 'category').slice(0, 60),
      brand: get(r, 'brand').slice(0, 120),
      name: name.slice(0, 200),
      notes: get(r, 'notes').slice(0, 2000),
      price_cents: price ?? 0,
      image_url: imageUrl(get(r, 'image')),
      product_url: safeUrl(get(r, 'link')),
      max_per_order: Number.isInteger(max) && max >= 1 && max <= 20 ? max : 1,
      is_active: show && price !== null,
      sort_order: products.length,
    });
  });
  return { products, skipped };
}

let lastSyncAt = 0;
let inFlight = null;

/** For tests. */
export function resetSheetSyncClock() { lastSyncAt = 0; inFlight = null; }

/**
 * Read the sheet and write it to giftbox_products. Throttled to once every
 * SYNC_EVERY_MS per server instance unless force. Never throws: a sheet
 * problem leaves the last good product list in place.
 */
export async function syncFromSheet(db, { force = false, fetchImpl = fetch, now = Date.now() } = {}) {
  if (!force && now - lastSyncAt < SYNC_EVERY_MS) return { ok: true, skippedSync: true };
  if (inFlight) return inFlight;
  lastSyncAt = now;
  inFlight = (async () => {
    try {
      const res = await fetchImpl(sheetCsvUrl(), { redirect: 'follow', signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined });
      const body = res.ok ? await res.text() : '';
      // A private sheet answers with Google's sign-in page, not CSV.
      if (!res.ok || /^\s*<(!doctype|html)/i.test(body)) return { ok: false, error: 'sheet_not_public' };
      const { products, skipped, error } = rowsToProducts(parseCsv(body));
      if (error) return { ok: false, error };
      if (!products.length) return { ok: false, error: 'sheet_empty' };

      const stamp = new Date(now).toISOString();
      const { error: upErr } = await db.from('giftbox_products')
        .upsert(products.map((p) => ({ ...p, updated_at: stamp })), { onConflict: 'sheet_id' });
      if (upErr) throw upErr;

      const { data: existing, error: selErr } = await db.from('giftbox_products').select('id, sheet_id, is_active').not('sheet_id', 'is', null);
      if (selErr) throw selErr;
      const inSheet = new Set(products.map((p) => p.sheet_id));
      const gone = (existing || []).filter((p) => p.is_active && !inSheet.has(p.sheet_id)).map((p) => p.id);
      if (gone.length) {
        const { error: hideErr } = await db.from('giftbox_products').update({ is_active: false, updated_at: stamp }).in('id', gone);
        if (hideErr) throw hideErr;
      }
      return { ok: true, synced: products.length, shown: products.filter((p) => p.is_active).length, hiddenRemoved: gone.length, skipped };
    } catch (e) {
      console.error('[giftbox sheet]', e?.message || e);
      lastSyncAt = 0; // try again on the next request
      return { ok: false, error: 'sync_failed' };
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
