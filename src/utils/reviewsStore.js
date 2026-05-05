/**
 * Supabase persistence for user_reviews.
 * Mirrors the localStorage shape: { [productId]: { ratings: number[], reviews: [] } }
 */

export async function loadReviewsForUser(supabase, userId) {
  const { data, error } = await supabase
    .from('user_reviews')
    .select('product_id, ratings, reviews')
    .eq('user_id', userId);
  if (error) throw error;

  const result = {};
  for (const row of data || []) {
    result[row.product_id] = {
      ratings: row.ratings || [],
      reviews: row.reviews || [],
    };
  }
  return result;
}

export async function upsertProductReviews(supabase, userId, productId, { ratings, reviews }) {
  const { error } = await supabase
    .from('user_reviews')
    .upsert(
      { user_id: userId, product_id: productId, ratings, reviews },
      { onConflict: 'user_id,product_id' }
    );
  if (error) throw error;
}
