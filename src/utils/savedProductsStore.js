/**
 * "Save for later" — the wishlist behind the product page's Save for later
 * button and the Saved for later shelf at the bottom of My Ecosystem.
 *
 * localStorage is the working copy so the button responds instantly and keeps
 * working for signed-out visitors. Supabase is the sync layer, stored as an
 * `is_saved` flag on the same user_ecosystems row as the other lists.
 *
 * That column is new (supabase/user_ecosystems.sql). Until the ALTER is applied
 * to the live database every read and write of it fails with Postgres 42703,
 * "column does not exist". Rather than let that surface as a save-failure
 * banner on every click, the first 42703 disables Supabase sync for the rest of
 * the session and the list simply stays local. Applying the migration turns
 * syncing on again with no code change.
 */

const LS_KEY = 'ayna_saved_for_later_v1';

/** Flipped by the first "column does not exist" so we stop retrying all session. */
let remoteColumnMissing = false;

/** Postgres undefined_column. */
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

/**
 * @returns {Promise<object|null>} id -> product, or null when the column isn't
 * there yet (caller keeps whatever it loaded from localStorage).
 */
export async function loadSavedForUser(supabase, userId) {
  if (!supabase || !userId || remoteColumnMissing) return null;
  const { data, error } = await supabase
    .from('user_ecosystems')
    .select('product_id, product_data, product_name, brand, category, product_type, is_saved')
    .eq('user_id', userId)
    .eq('is_saved', true);

  if (error) {
    if (isMissingColumn(error)) {
      remoteColumnMissing = true;
      return null;
    }
    throw new Error(`loadSaved: ${error.message || 'unknown error'}`);
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

/**
 * Set or clear the saved flag for one product. Resolves to false when the sync
 * was skipped (no session, or the column isn't there) so callers can tell
 * "stored locally only" from "stored".
 */
export async function setSavedForUser(supabase, userId, product, isSaved) {
  if (!supabase || !userId || remoteColumnMissing || !product?.id) return false;

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
    if (isMissingColumn(error)) {
      remoteColumnMissing = true;
      return false;
    }
    throw new Error(`setSaved: ${error.message || 'unknown error'}`);
  }
  return true;
}

/** Test seam — resets the "column is missing" latch. */
export function _resetRemoteColumnLatch() {
  remoteColumnMissing = false;
}
