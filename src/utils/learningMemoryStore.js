const TABLE = 'user_learning_memory';
const SESSION_KEY = 'ayna_llm_learning_memory_v1';
const EPHEMERAL_MARKER = '__aynaSessionMemoryOnly';

function parseObject(raw) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

/**
 * Full recommendation-learning memory is health-adjacent (for example,
 * selected concerns and product histories). Keep it only for the active tab;
 * Supabase is the cross-session source of truth. Older localStorage copies are
 * migrated once and then removed.
 */
export function loadLearningMemorySession() {
  if (typeof window === 'undefined') return {};
  try {
    const current = parseObject(window.sessionStorage.getItem(SESSION_KEY));
    if (current) return current;

    const legacy = parseObject(window.localStorage.getItem(SESSION_KEY));
    if (legacy) {
      try { window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(legacy)); } catch (_) {}
      try { window.localStorage.removeItem(SESSION_KEY); } catch (_) {}
      return legacy;
    }
  } catch (_) {}
  return {};
}

export function saveLearningMemorySession(memory) {
  if (typeof window === 'undefined') return;
  try { window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(memory || {})); } catch (_) {}
  try { window.localStorage.removeItem(SESSION_KEY); } catch (_) {}
}

function safeLegacyStub(memory) {
  if (!memory || typeof memory !== 'object') return null;
  // App.jsx from older builds mirrors the value returned by this loader to
  // localStorage. Return only non-health operational metadata plus a marker;
  // saveLearningMemoryForUser ignores this stub so it can never overwrite the
  // full server record.
  return {
    [EPHEMERAL_MARKER]: true,
    interactionCount: Number(memory.interactionCount || 0) || 0,
    lastSeenAt: memory.lastSeenAt || null,
  };
}

export async function loadLearningMemoryForUser(supabase, userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('memory')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  const memory = data?.memory || null;
  if (memory) saveLearningMemorySession(memory);
  return safeLegacyStub(memory);
}

export async function saveLearningMemoryForUser(supabase, userId, memory) {
  if (!supabase || !userId || !memory || typeof memory !== 'object') return;
  // Compatibility guard for App.jsx's old localStorage mirror path. That
  // mirror now contains only this harmless stub and must never replace the
  // real server-side learning memory.
  if (memory[EPHEMERAL_MARKER]) return;

  saveLearningMemorySession(memory);
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, memory }, { onConflict: 'user_id' });
  if (error) throw error;
}
