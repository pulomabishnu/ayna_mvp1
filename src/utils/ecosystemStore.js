/**
 * Supabase persistence for user_ecosystems.
 * One row per (user_id, product_id). Flags track which lists the product lives in.
 */

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

export async function loadEcosystemForUser(supabase, userId) {
  const { data, error } = await supabase
    .from('user_ecosystems')
    .select('*')
    .eq('user_id', userId);
  if (error) throw new Error(describeError(error, 'loadEcosystem'));

  const myProducts = {};
  const trackedProducts = {};
  const omittedProducts = {};

  for (const row of data || []) {
    const product = row.product_data || {
      id: row.product_id,
      name: row.product_name,
      brand: row.brand,
      category: row.category,
      type: row.product_type,
    };
    if (row.in_ecosystem) myProducts[row.product_id] = product;
    if (row.is_tracked) trackedProducts[row.product_id] = product;
    if (row.is_omitted) omittedProducts[row.product_id] = product;
  }

  return { myProducts, trackedProducts, omittedProducts };
}

/**
 * Remove products from the ecosystem WITHOUT destroying their tracked/omitted state.
 *
 * This used to be a plain `delete ... where in_ecosystem = true`, with a comment
 * claiming "DELETE is more reliably allowed by RLS than UPDATE". That reasoning
 * is unsound — DELETE and UPDATE are independent RLS commands — and what it
 * actually documented was a missing UPDATE policy. Because the row model is
 * "one row per product, flags say which lists it's in", deleting the row also
 * erased is_tracked and is_omitted. A user who edited her health profile lost
 * the products she had explicitly *hidden*, and the LLM promptly re-recommended
 * them.
 *
 * Now: clear the ecosystem flag, then delete only rows left carrying no state.
 */
export async function clearEcosystemForUser(supabase, userId) {
  const { error: updateError, count } = await supabase
    .from('user_ecosystems')
    .update({ in_ecosystem: false, updated_at: new Date().toISOString() }, { count: 'exact' })
    .eq('user_id', userId)
    .eq('in_ecosystem', true);
  if (updateError) throw new Error(describeError(updateError, 'clearEcosystem'));

  const { error: deleteError } = await supabase
    .from('user_ecosystems')
    .delete()
    .eq('user_id', userId)
    .eq('in_ecosystem', false)
    .eq('is_tracked', false)
    .eq('is_omitted', false);
  if (deleteError) throw new Error(describeError(deleteError, 'clearEcosystem cleanup'));

  return { cleared: count ?? null };
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
  const { inEcosystem, isTracked, isOmitted } = flags;
  if (!inEcosystem && !isTracked && !isOmitted) {
    const { error } = await supabase
      .from('user_ecosystems')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', product.id);
    if (error) throw new Error(describeError(error, 'removeProduct'));
    return;
  }

  const { error } = await supabase
    .from('user_ecosystems')
    .upsert(toRow(userId, product, flags), { onConflict: 'user_id,product_id' });
  if (error) throw new Error(describeError(error, 'upsertProduct'));
}

/**
 * Persist many products in ONE request per chunk.
 *
 * Building an ecosystem previously fired one POST per product — up to ~50 round
 * trips on a phone right after a multi-minute LLM wait, each able to fail
 * independently. `Promise.all(...).catch(console.error)` surfaced only the first
 * rejection, so a partially-persisted ecosystem was invisible and the user saw
 * an arbitrary subset of her products on the next load.
 */
export async function upsertProductsBatch(supabase, userId, products, flags) {
  const valid = (Array.isArray(products) ? products : []).filter((p) => p?.id);
  if (valid.length === 0) return { saved: 0 };

  const CHUNK = 100;
  let saved = 0;
  for (let i = 0; i < valid.length; i += CHUNK) {
    const rows = valid.slice(i, i + CHUNK).map((p) => toRow(userId, p, flags));
    const { error } = await supabase
      .from('user_ecosystems')
      .upsert(rows, { onConflict: 'user_id,product_id' });
    if (error) throw new Error(describeError(error, 'upsertProductsBatch'));
    saved += rows.length;
  }
  return { saved };
}
