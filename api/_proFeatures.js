import { PREMIUM_READ_IDS } from '../src/pro/premiumReads.js';

export const DEFAULT_PRO_RULES = {
  enabled: false,
  freeAskPerDay: 5,
  proAskPerDay: 50,
  freePlaylists: 1,
  premiumReadIds: [],
};

export async function proFeatureRules(admin) {
  const { data, error } = await admin.rpc('pro_feature_config');
  if (error || typeof data?.enabled !== 'boolean') throw new Error('Pro feature rules unavailable');
  return {
    ...DEFAULT_PRO_RULES,
    ...data,
    premiumReadIds: data.enabled ? PREMIUM_READ_IDS : [],
  };
}

export async function consumeProChat(admin, userId, premium, rules) {
  // Founder Oct 27: Ask is per calendar month (UTC): Free 5, Pro 50.
  const period = `month:${new Date().toISOString().slice(0, 7)}`;
  const limit = premium ? rules.proAskPerDay : rules.freeAskPerDay;
  const { data, error } = await admin.rpc('consume_ai_usage', {
    p_user_id: userId,
    p_period: period,
    p_action: 'chat',
    p_limit: limit,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || typeof row?.allowed !== 'boolean') throw new Error('Monthly usage unavailable');
  return { ...row, limit, period, degraded: false };
}
