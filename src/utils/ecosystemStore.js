/**
 * Supabase persistence for user_ecosystems.
 * One row per (user_id, product_id). Flags track which lists the product lives in.
 *
 * The live table is the durable source of truth, with Supabase auth user_metadata
 * as a cross-session fallback for temporary schema/RLS outages. A browser shadow
 * is kept only for the active tab: ecosystem snapshots can contain personalized
 * match metadata, so they should not remain indefinitely in localStorage on a
 * shared computer. Older localStorage shadows are migrated once and removed.
 */

const SHADOW_VERSION = 3;
const SHADOW_META_KEY = 'ayna_ecosystem_shadow_v2';
const SHADOW_LS_PREFIX = 'ayna_ecosystem_shadow_v2:';

/** Postgres failures that mean "the write did not happen" but are easy to miss. */
function describeError(error, op) {
  if (!error) return null;
  if (error.code === '42P10') {
    return `${op}: no unique constraint on (user_id, product_id) — apply supabase/user_ecosystems.sql`;
  }
  if (error.code === '42501' || /row-level security/i.test(error.message || '')) {
    return `${op}: blocked by RLS — check the policies in supabase/user_ecosystems.sql`;
  }
  return `${op}: ${error.message || 'unknown error'}`;
}

function emptyShadow() {
  return { version: SHADOW_VERSION, resetAt: 0, rows: {} };
}

function normalizeShadow(value) {
  if (!value || typeof value !== 'object') return emptyShadow();
  const rows = value.rows && typeof value.rows === 'object' ? value.rows : {};
  return {
    version: SHADOW_VERSION,
    resetAt: Number(value.resetAt || 0) || 0,
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
    'whereToBuy', 'url', 'website', 'buyUrl', 'purchaseUrl', 'affiliateUrl',
    'llmGenerated', 'intakeGenerated', '_llmConcern', '_userSwapped',
    'aynaMatch', 'aynaMatchPercent', 'matchPercent', 'matchPercentage',
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

function mergeShadows(a, b) {
  const left = normalizeShadow(a);
  const right = normalizeShadow(b);
  const merged = {
    version: SHADOW_VERSION,
    resetAt: Math.max(left.resetAt || 0, right.resetAt || 0),
    rows: { ...left.rows },
  };
  for (const [id, row] of Object.entries(right.rows || {})) {
    const current = merged.rows[id];
    if (!current || Number(row?.updatedAt || 0) >= Number(current?.updatedAt || 0)) {
      merged.rows[id] = row;
    }
  }
  return merged;
}

async function readMetadataShadow(supabase, userId) {
  if (!supabase || !userId) return emptyShadow();
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || data?.user?.id !== userId) return emptyShadow();
    return normalizeShadow(data.user.user_metadata?.[SHADOW_META_KEY]);
  } catch {
    return emptyShadow();
  }
}

async function writeMetadataShadow(supabase, userId, shadow) {
  if (!supabase || !userId) return false;
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || userData?.user?.id !== userId) return false;
    const current = userData.user.user_metadata || {};
    const { error } = await supabase.auth.updateUser({
      data: { ...current, [SHADOW_META_KEY]: normalizeShadow(shadow) },
    });
    return !error;
  } catch {
    return false;
  }
}

function updateLocalProductShadow(userId, product, flags) {
  const shadow = readLocalShadow(userId);
  const row = rowFromProduct(product, flags);
  if (!row) return shadow;
  shadow.rows[product.id] = row;
  writeLocalShadow(userId, shadow);
  return shadow;
}

function clearLocalEcosystemShadow(userId) {
  const shadow = readLocalShadow(userId);
  const now = Date.now();
  shadow.resetAt = now;
  for (const row of Object.values(shadow.rows)) {
    row.inEcosystem = false;
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

  for (const [productId, row] of Object.entries(rowsById || {})) {
    const product = row?.product;
    if (!product?.id) continue;
    if (row.inEcosystem) {
      myProducts[productId] = product;
      ecosystemUpdatedAt[productId] = row.updatedAt ? new Date(row.updatedAt).toISOString() : null;
    }
    if (row.isTracked) trackedProducts[productId] = product;
    if (row.isOmitted) omittedProducts[productId] = product;
  }

  return { myProducts, trackedProducts, omittedProducts, ecosystemUpdatedAt };
}

export async function loadEcosystemForUser(supabase, userId) {
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
  const metadataShadow = await readMetadataShadow(supabase, userId);
  const shadow = mergeShadows(localShadow, metadataShadow);
  // Keep a current tab copy for resilience without persistent local storage.
  writeLocalShadow(userId, shadow);

  const mergedRows = {};
  for (const row of dbData) {
    const converted = dbRowToShadowRow(row);
    if (shadow.resetAt && converted.updatedAt <= shadow.resetAt) {
      converted.inEcosystem = false;
    }
    mergedRows[row.product_id] = converted;
  }

  for (const [productId, row] of Object.entries(shadow.rows || {})) {
    const existing = mergedRows[productId];
    if (!existing || Number(row?.updatedAt || 0) >= Number(existing?.updatedAt || 0)) {
      mergedRows[productId] = row;
    }
  }

  if (dbError) {
    console.warn('[Ayna] user_ecosystems read unavailable; restored ecosystem from fallback storage:', describeError(dbError, 'loadEcosystem'));
  }

  return hydrateFromRows(mergedRows);
}

/**
 * Remove products from the ecosystem WITHOUT destroying tracked/omitted state.
 * The session/auth shadow is written first so reset remains durable even when
 * the live table temporarily rejects UPDATE/DELETE.
 */
export async function clearEcosystemForUser(supabase, userId) {
  const shadow = clearLocalEcosystemShadow(userId);
  const metadataSaved = await writeMetadataShadow(supabase, userId, shadow);

  let tableSynced = false;
  try {
    const { error: updateError, count } = await supabase
      .from('user_ecosystems')
      .update({ in_ecosystem: false, updated_at: new Date().toISOString() }, { count: 'exact' })
      .eq('user_id', userId)
      .eq('in_ecosystem', true);
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
    tableSynced = true;
    return { cleared: count ?? null, synced: true };
  } catch (error) {
    console.warn('[Ayna] user_ecosystems reset deferred; fallback copy is authoritative:', describeError(error, 'clearEcosystem'));
  }

  return { cleared: null, synced: tableSynced || metadataSaved, fallback: true };
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

export async function upsertProductState(supabase, userId, product, flags) {
  // Active-tab fallback FIRST; auth user_metadata keeps it cross-session if the
  // table is temporarily unavailable.
  const shadow = updateLocalProductShadow(userId, product, flags);
  const metadataPromise = writeMetadataShadow(supabase, userId, shadow);

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
    await metadataPromise;
    return { synced: true };
  } catch (error) {
    const metadataSaved = await metadataPromise;
    console.warn('[Ayna] user_ecosystems write unavailable; ecosystem change saved to fallback:', describeError(error, 'upsertProduct'));
    return { synced: metadataSaved, fallback: true };
  }
}

/** Persist many products in ONE request per chunk, with the same fallback. */
export async function upsertProductsBatch(supabase, userId, products, flags) {
  const valid = (Array.isArray(products) ? products : []).filter((p) => p?.id);
  if (valid.length === 0) return { saved: 0 };

  let shadow = readLocalShadow(userId);
  for (const product of valid) {
    const row = rowFromProduct(product, flags);
    if (row) shadow.rows[product.id] = row;
  }
  writeLocalShadow(userId, shadow);
  const metadataPromise = writeMetadataShadow(supabase, userId, shadow);

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
    await metadataPromise;
    return { saved, synced: true };
  } catch (error) {
    const metadataSaved = await metadataPromise;
    console.warn('[Ayna] ecosystem batch table write unavailable; fallback copy saved:', describeError(error, 'upsertProductsBatch'));
    return { saved: valid.length, synced: metadataSaved, fallback: true };
  }
}
