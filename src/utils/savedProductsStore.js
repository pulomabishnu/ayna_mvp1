/**
 * Wishlist / Save for later persistence.
 *
 * localStorage keeps the UI instant. Supabase user_ecosystems is the primary
 * sync layer, but the live table may be missing is_saved or blocked by RLS.
 * user_metadata is therefore a small authenticated fallback so saved products
 * still come back after logout/login instead of disappearing with a false
 * "could not save" banner.
 */

const LS_KEY = 'ayna_saved_for_later_v1';
const META_KEY = 'ayna_saved_products_v1';
let remoteColumnMissing = false;
const UNDEFINED_COLUMN = '42703';

function isMissingColumn(error) {
  if (!error) return false;
  return error.code === UNDEFINED_COLUMN || /column .*is_saved.* does not exist/i.test(error.message || '');
}

function compactProduct(product) {
  if (!product?.id) return null;
  const keys = [
    'id', 'name', 'brand', 'category', 'type', 'price', 'priceDisplay', 'stage',
    'image', 'imageUrl', 'images', 'summary', 'description', 'url', 'website',
    'buyUrl', 'purchaseUrl', 'affiliateUrl', 'aynaMatch', 'aynaMatchPercent',
    'matchPercent', 'matchPercentage',
  ];
  const out = {};
  for (const key of keys) {
    const value = product[key];
    if (value !== undefined && value !== null && value !== '') out[key] = value;
  }
  return out;
}

export function loadSavedProducts() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function persistSavedProducts(map) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map || {}));
  } catch {
    // Private mode / quota — the in-memory copy still works for this session.
  }
}

export function clearSavedProducts() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}

async function loadMetadataSaved(supabase, userId) {
  if (!supabase || !userId) return {};
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || data?.user?.id !== userId) return {};
    const raw = data.user.user_metadata?.[META_KEY];
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

async function writeMetadataSaved(supabase, userId, map) {
  if (!supabase || !userId) return false;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || data?.user?.id !== userId) return false;
    const current = data.user.user_metadata || {};
    const { error: updateError } = await supabase.auth.updateUser({
      data: { ...current, [META_KEY]: map || {} },
    });
    return !updateError;
  } catch {
    return false;
  }
}

/** id -> product, merging the table with authenticated metadata fallback. */
export async function loadSavedForUser(supabase, userId) {
  if (!supabase || !userId) return null;
  const metadataSaved = await loadMetadataSaved(supabase, userId);

  if (remoteColumnMissing) return metadataSaved;

  const { data, error } = await supabase
    .from('user_ecosystems')
    .select('product_id, product_data, product_name, brand, category, product_type, is_saved')
    .eq('user_id', userId)
    .eq('is_saved', true);

  if (error) {
    if (isMissingColumn(error)) remoteColumnMissing = true;
    else console.warn('[Ayna] wishlist table read unavailable; using auth fallback:', error.message || error);
    return metadataSaved;
  }

  const out = { ...metadataSaved };
  for (const row of data || []) {
    out[row.product_id] = row.product_data || {
      id: row.product_id,
      name: row.product_name,
      brand: row.brand,
      category: row.category,
      type: row.product_type,
    };
  }
  return out;
}

/**
 * Set or clear a saved product. Auth metadata is written first so the user's
 * click is durable even when the table migration/RLS is not ready yet.
 */
export async function setSavedForUser(supabase, userId, product, isSaved) {
  if (!supabase || !userId || !product?.id) return false;

  const existing = await loadMetadataSaved(supabase, userId);
  const nextMetadata = { ...existing };
  if (isSaved) nextMetadata[product.id] = compactProduct(product);
  else delete nextMetadata[product.id];
  const metadataSaved = await writeMetadataSaved(supabase, userId, nextMetadata);

  if (remoteColumnMissing) return metadataSaved;

  const { error } = await supabase
    .from('user_ecosystems')
    .upsert(
      {
        user_id: userId,
        product_id: product.id,
        product_name: product.name,
        brand: product.brand,
        category: product.category,
        product_type: product.type,
        product_data: product,
        is_saved: !!isSaved,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,product_id' },
    );

  if (error) {
    if (isMissingColumn(error)) remoteColumnMissing = true;
    else console.warn('[Ayna] wishlist table write unavailable; auth fallback retained:', error.message || error);
    return metadataSaved;
  }
  return true;
}

export function _resetRemoteColumnLatch() {
  remoteColumnMissing = false;
}
