/**
 * Supabase persistence for user_ecosystems.
 * One row per (user_id, product_id). Flags track which lists the product lives in.
 */

export async function loadEcosystemForUser(supabase, userId) {
  const { data, error } = await supabase
    .from('user_ecosystems')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;

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

export async function clearEcosystemForUser(supabase, userId) {
  // DELETE is more reliably allowed by RLS than UPDATE
  const { error } = await supabase
    .from('user_ecosystems')
    .delete()
    .eq('user_id', userId)
    .eq('in_ecosystem', true);
  if (error) throw error;
}

export async function upsertProductState(supabase, userId, product, { inEcosystem, isTracked, isOmitted }) {
  if (!inEcosystem && !isTracked && !isOmitted) {
    const { error } = await supabase
      .from('user_ecosystems')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', product.id);
    if (error) throw error;
    return;
  }

  const payload = {
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
  };

  const { error } = await supabase
    .from('user_ecosystems')
    .upsert(payload, { onConflict: 'user_id,product_id' });
  if (error) throw error;
}
