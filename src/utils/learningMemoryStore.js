export async function loadLearningMemoryForUser(supabase, userId) {
  const { data, error } = await supabase
    .from('user_learning_memory')
    .select('memory')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.memory || null;
}

export async function saveLearningMemoryForUser(supabase, userId, memory) {
  const { error } = await supabase
    .from('user_learning_memory')
    .upsert({ user_id: userId, memory }, { onConflict: 'user_id' });
  if (error) throw error;
}
