import { compactLegacyAuthMetadata } from './authMetadataCleanup';

/**
 * Wishlist / Save for later persistence.
 *
 * localStorage keeps the UI instant. Supabase user_ecosystems is the durable
 * sync layer. Saved-product blobs must never be stored in Auth user_metadata,
 * because Supabase embeds user_metadata in the JWT sent on every API request.
 */

const LS_KEY = 'ayna_saved_for_later_v1';
let remoteColumnMissing = false;
const UNDEFINED_COLUMN = '42703';

function isMissingColumn(error) {
  if (!error) return false;
  return error.code === UNDEFINED_COLUMN || /column .*is_saved.* does not exist/i.test(error.message || '');
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

/** id -> product from the user_ecosystems table. */
export async function loadSavedForUser(supabase, userId) {
  if (!supabase || !userId) return null;

  try { await compactLegacyAuthMetadata(supabase); } catch (error) {
    console.warn('[Ayna] legacy wishlist auth metadata cleanup deferred:', error?.message || error);
  }

  if (remoteColumnMissing) return null;

  const { data, error } = await supabase
    .from('user_ecosystems')
    .select('product_id, product_data, product_name, brand, category, product_type, is_saved')
    .eq('user_id', userId)
    .eq('is_saved', true);

  if (error) {
    if (isMissingColumn(error)) remoteColumnMissing = true;
    else console.warn('[Ayna] wishlist table read unavailable; keeping local copy:', error.message || error);
    return null;
  }

  const out = {};
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

/** Set or clear a saved product in user_ecosystems only. */
export async function setSavedForUser(supabase, userId, product, isSaved) {
  if (!supabase || !userId || !product?.id) return false;
  if (remoteColumnMissing) return false;

  try { await compactLegacyAuthMetadata(supabase); } catch (_) {}

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
    else console.warn('[Ayna] wishlist table write unavailable; local copy retained:', error.message || error);
    return false;
  }
  return true;
}

export function _resetRemoteColumnLatch() {
  remoteColumnMissing = false;
}
