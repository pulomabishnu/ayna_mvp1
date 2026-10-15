import { compactLegacyAuthMetadata } from './authMetadataCleanup';
import { toCatalogProduct } from './catalogIntegrity';

/**
 * Supabase persistence for user_ecosystems.
 * One row per (user_id, product_id). Flags track which lists the product lives in.
 *
 * The table is the durable source of truth. A sessionStorage shadow exists only
 * as an active-tab resilience layer; ecosystem/product blobs must never be put
 * into Supabase Auth user_metadata because that metadata is embedded in the JWT.
 */

const SHADOW_VERSION = 3;
const SHADOW_LS_PREFIX = 'ayna_ecosystem_shadow_v2:';

function describeError(error, op) {
  if (!error) return null;
  if (error.code === '42P10') {
    return `${op}: no unique constraint on (user_id, product_id), apply supabase/user_ecosystems.sql`;
  }
  if (error.code === '42501' || /row-level security/i.test(error.message || '')) {
    return `${op}: blocked by RLS, check the policies in supabase/user_ecosystems.sql`;
  }
  return `${op}: ${error.message || 'unknown error'}`;
}

function emptyShadow() {
  return { version: SHADOW_VERSION, resetAt: 0, fullResetAt: 0, rows: {} };
}

function normalizeShadow(value) {
  if (!value || typeof value !== 'object') return emptyShadow();
  const rows = value.rows && typeof value.rows === 'object' ? value.rows : {};
  return {
    version: SHADOW_VERSION,
    resetAt: Number(value.resetAt || 0) || 0,
    fullResetAt: Number(value.fullResetAt || 0) || 0,
    rows,
  };
}

function localShadowKey(userId) {
  return `${SHADOW_LS_PREFIX}${userId}`;
}

function readLocalShadow(userId) {
  if (!userId || typeof window === 'undefined') return emptyShadow();
  const key = localShadowKey(userId);
  try {
    const current = window.sessionStorage.getItem(key);
    if (current) return normalizeShadow(JSON.parse(current));

    // One-time migration from older builds that persisted a personalized
    // ecosystem snapshot in localStorage.
    const legacy = window.localStorage.getItem(key);
    if (!legacy) return emptyShadow();
    const parsed = normalizeShadow(JSON.parse(legacy));
    try { window.sessionStorage.setItem(key, JSON.stringify(parsed)); } catch (_) {}
    try { window.localStorage.removeItem(key); } catch (_) {}
    return parsed;
  } catch {
    return emptyShadow();
  }
}

function writeLocalShadow(userId, shadow) {
  if (!userId || typeof window === 'undefined') return false;
  const key = localShadowKey(userId);
  try {
    window.sessionStorage.setItem(key, JSON.stringify(normalizeShadow(shadow)));
    try { window.localStorage.removeItem(key); } catch (_) {}
    return true;
  } catch {
    return false;
  }
}

function compactProduct(product) {
  if (!product?.id) return null;
  const keys = [
    'id', 'name', 'brand', 'category', 'type', 'price', 'priceDisplay', 'stage',
    'image', 'imageUrl', 'images', 'summary', 'description', 'tagline',
    'tags', 'healthFunctions', 'internal', 'safety', 'ageMin', 'ageMax',
    'whereToBuy', 'url', 'website', 'buyUrl', 'purchaseUrl', 'affiliateUrl',
    'intakeGenerated', '_llmConcern', '_userSwapped',
    'catalogId', 'catalogVerified', 'whyItWorks', 'considerations', 'matchExplanation',
    'aynaMatch', 'aynaMatchPercent', 'matchPercent', 'matchPercentage',
    'userAdded', 'addedAt',
  ];
  const out = {};
  for (const key of keys) {
    const value = product[key];
    if (value !== undefined && value !== null && value !== '') out[key] = value;
  }
  return out;
}

function rowFromProduct(product, flags) {
  const compact = compactProduct(product);
  if (!compact) return null;
  return {
    product: compact,
    inEcosystem: !!flags.inEcosystem,
    isTracked: !!flags.isTracked,
    isOmitted: !!flags.isOmitted,
    updatedAt: Date.now(),
  };
}

function updateLocalProductShadow(userId, product, flags) {
  const shadow = readLocalShadow(userId);
  const row = rowFromProduct(product, flags);
  if (!row) return shadow;
  shadow.rows[product.id] = row;
  writeLocalShadow(userId, shadow);
  return shadow;
}

function clearLocalEcosystemShadow(userId, includeTracking = false) {
  const shadow = readLocalShadow(userId);
  const now = Date.now();
  shadow.resetAt = now;
  if (includeTracking) shadow.fullResetAt = now;
  for (const row of Object.values(shadow.rows)) {
    row.inEcosystem = false;
    if (includeTracking) {
      row.isTracked = false;
      row.isOmitted = false;
    }
    row.updatedAt = now;
  }
  writeLocalShadow(userId, shadow);
  return shadow;
}

function dbRowToShadowRow(row) {
  return {
    product: row.product_data || {
      id: row.product_id,
      name: row.product_name,
      brand: row.brand,
      category: row.category,
      type: row.product_type,
    },
    inEcosystem: !!row.in_ecosystem,
    isTracked: !!row.is_tracked,
    isOmitted: !!row.is_omitted,
    updatedAt: Date.parse(row.updated_at || '') || 0,
  };
}

function hydrateFromRows(rowsById) {
  const myProducts = {};
  const trackedProducts = {};
  const omittedProducts = {};
  const ecosystemUpdatedAt = {};

  for (const [, row] of Object.entries(rowsById || {})) {
    // PRODUCT INTEGRITY: saved snapshots from older builds can hold free-form
    // model output (invented names/URLs). Only catalog-backed products are
    // shown, always with current catalog facts. Rows are NOT deleted.
    const product = toCatalogProduct(row?.product);
    if (!product?.id) continue;
    const productId = product.id;
    if (row.inEcosystem) {
      myProducts[productId] = product;
      ecosystemUpdatedAt[productId] = row.updatedAt ? new Date(row.updatedAt).toISOString() : null;
    }
    if (row.isTracked) trackedProducts[productId] = product;
    if (row.isOmitted) omittedProducts[productId] = product;
  }

  return { myProducts, trackedProducts, omittedProducts, ecosystemUpdatedAt };
}

function toRow(userId, product, { inEcosystem, isTracked, isOmitted }) {
  return {
    user_id: userId,
    product_id: product.id,
    product_name: product.name,
    brand: product.brand,
    category: product.category,
    product_type: product.type,
    product_data: product,
    in_ecosystem: !!inEcosystem,
    is_tracked: !!isTracked,
    is_omitted: !!isOmitted,
    updated_at: new Date().toISOString(),
  };
}

async function syncActiveShadowRows(supabase, userId, shadow, onlyIds = null) {
  const rows = Object.entries(shadow?.rows || {})
    .filter(([id]) => !onlyIds || onlyIds.has(id))
    .map(([, row]) => row)
    .filter((row) => row?.product?.id && (row.inEcosystem || row.isTracked || row.isOmitted))
    .map((row) => toRow(userId, row.product, row));
  if (!rows.length) return;

  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from('user_ecosystems')
      .upsert(rows.slice(i, i + CHUNK), { onConflict: 'user_id,product_id' });
    if (error) throw error;
  }
}

export async function loadEcosystemForUser(supabase, userId) {
  // This also migrates any legacy Auth-metadata shadow into sessionStorage and
  // refreshes the JWT so subsequent Vercel API calls do not carry a huge header.
  try { await compactLegacyAuthMetadata(supabase); } catch (error) {
    console.warn('[Ayna] legacy auth metadata cleanup deferred:', error?.message || error);
  }

  let dbData = [];
  let dbError = null;
  try {
    const { data, error } = await supabase
      .from('user_ecosystems')
      .select('*')
      .eq('user_id', userId);
    dbData = data || [];
    dbError = error || null;
  } catch (error) {
    dbError = error;
  }

  const localShadow = readLocalShadow(userId);
  writeLocalShadow(userId, localShadow);

  const mergedRows = {};
  for (const row of dbData) {
    const converted = dbRowToShadowRow(row);
    // A local reset is a tombstone for older DB flags so a stale row cannot
    // pop back in this session. Rows are never deleted by this.
    if (localShadow.resetAt && converted.updatedAt <= localShadow.resetAt) {
      converted.inEcosystem = false;
    }
    if (localShadow.fullResetAt && converted.updatedAt <= localShadow.fullResetAt) {
      converted.isTracked = false;
      converted.isOmitted = false;
    }
    mergedRows[row.product_id] = converted;
  }

  const shadowWins = new Set();
  for (const [productId, row] of Object.entries(localShadow.rows || {})) {
    const existing = mergedRows[productId];
    if (!existing || Number(row?.updatedAt || 0) >= Number(existing?.updatedAt || 0)) {
      mergedRows[productId] = row;
      shadowWins.add(productId);
    }
  }

  // Best-effort migration of any legacy/session fallback rows into the real
  // table. Only rows where the fallback copy is at least as new as the table
  // are pushed, so an older session copy never overwrites a newer table row.
  try { await syncActiveShadowRows(supabase, userId, localShadow, shadowWins); } catch (error) {
    if (!dbError) dbError = error;
  }

  if (dbError) {
    console.warn('[Ayna] user_ecosystems read/write unavailable; restored ecosystem from session fallback:', describeError(dbError, 'loadEcosystem'));
  }

  return hydrateFromRows(mergedRows);
}

/**
 * Remove products from the ecosystem WITHOUT destroying tracked/omitted state.
 * `includeTracking: true` is the explicit full reset (ecosystem + tracking +
 * hidden); saved-for-later rows (is_saved) are never touched either way.
 */
export async function clearEcosystemForUser(supabase, userId, { includeTracking = false } = {}) {
  clearLocalEcosystemShadow(userId, includeTracking);

  try {
    let updateQuery = supabase
      .from('user_ecosystems')
      .update({ in_ecosystem: false, ...(includeTracking ? { is_tracked: false, is_omitted: false } : {}), updated_at: new Date().toISOString() }, { count: 'exact' })
      .eq('user_id', userId);
    if (!includeTracking) updateQuery = updateQuery.eq('in_ecosystem', true);
    const { error: updateError, count } = await updateQuery;
    if (updateError) throw updateError;

    const { error: deleteError } = await supabase
      .from('user_ecosystems')
      .delete()
      .eq('user_id', userId)
      .eq('in_ecosystem', false)
      .eq('is_tracked', false)
      .eq('is_omitted', false)
      .eq('is_saved', false);
    if (deleteError && deleteError.code !== '42703') throw deleteError;
    return { cleared: count ?? null, synced: true };
  } catch (error) {
    console.warn('[Ayna] user_ecosystems reset deferred; session fallback retained:', describeError(error, 'clearEcosystem'));
    return { cleared: null, synced: false, fallback: true };
  }
}

export async function upsertProductState(supabase, userId, product, flags) {
  updateLocalProductShadow(userId, product, flags);
  const { inEcosystem, isTracked, isOmitted } = flags;

  try {
    if (!inEcosystem && !isTracked && !isOmitted) {
      const { error: updateError } = await supabase
        .from('user_ecosystems')
        .update({ in_ecosystem: false, is_tracked: false, is_omitted: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('product_id', product.id);
      if (updateError) throw updateError;

      const { error } = await supabase
        .from('user_ecosystems')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', product.id)
        .eq('in_ecosystem', false)
        .eq('is_tracked', false)
        .eq('is_omitted', false)
        .eq('is_saved', false);
      if (error && error.code !== '42703') throw error;
    } else {
      const { error } = await supabase
        .from('user_ecosystems')
        .upsert(toRow(userId, product, flags), { onConflict: 'user_id,product_id' });
      if (error) throw error;
    }
    return { synced: true };
  } catch (error) {
    console.warn('[Ayna] user_ecosystems write unavailable; change remains in session fallback:', describeError(error, 'upsertProduct'));
    return { synced: false, fallback: true };
  }
}

/** Replace superseded quiz/AI picks without changing tracking, omission or saved flags. */
export async function removeGeneratedProductsFromEcosystem(supabase, userId, productIds) {
  const ids = [...new Set((productIds || []).filter(Boolean))];
  if (!ids.length) return { updated: 0 };
  const shadow = readLocalShadow(userId);
  const now = Date.now();
  for (const id of ids) {
    if (shadow.rows[id]) {
      shadow.rows[id].inEcosystem = false;
      shadow.rows[id].updatedAt = now;
    }
  }
  writeLocalShadow(userId, shadow);
  const { error } = await supabase
    .from('user_ecosystems')
    .update({ in_ecosystem: false, updated_at: new Date(now).toISOString() })
    .eq('user_id', userId)
    .in('product_id', ids);
  if (error) throw error;
  return { updated: ids.length };
}

/** Persist many products in chunks. Never write product blobs to Auth metadata. */
export async function upsertProductsBatch(supabase, userId, products, flags) {
  const valid = (Array.isArray(products) ? products : []).filter((p) => p?.id);
  if (valid.length === 0) return { saved: 0 };

  const shadow = readLocalShadow(userId);
  for (const product of valid) {
    const row = rowFromProduct(product, flags);
    if (row) shadow.rows[product.id] = row;
  }
  writeLocalShadow(userId, shadow);

  const CHUNK = 100;
  let saved = 0;
  try {
    for (let i = 0; i < valid.length; i += CHUNK) {
      const rows = valid.slice(i, i + CHUNK).map((p) => toRow(userId, p, flags));
      const { error } = await supabase
        .from('user_ecosystems')
        .upsert(rows, { onConflict: 'user_id,product_id' });
      if (error) throw error;
      saved += rows.length;
    }
    return { saved, synced: true };
  } catch (error) {
    console.warn('[Ayna] ecosystem batch table write unavailable; session fallback retained:', describeError(error, 'upsertProductsBatch'));
    return { saved: valid.length, synced: false, fallback: true };
  }
}
