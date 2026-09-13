const SENSITIVE_KEYS = new Set([
  'name', 'firstname', 'first_name', 'lastname', 'last_name', 'fullname', 'full_name',
  'email', 'useremail', 'user_email', 'phone', 'phonenumber', 'phone_number',
  'userid', 'user_id', 'authuserid', 'auth_user_id', 'accountid', 'account_id',
  'query', 'q', 'searchquery', 'search_query', 'searchterm', 'search_term', 'rawquery', 'raw_query',
  'message', 'messagebody', 'message_body', 'smsbody', 'sms_body', 'prompt', 'question',
  'notes', 'freetext', 'free_text', 'supportothertext', 'support_other_text',
  'healthprofile', 'health_profile', 'fullhealthintake', 'full_health_intake', 'intake',
  'symptom', 'symptoms', 'condition', 'conditions', 'diagnosis', 'diagnoses',
  'pregnancy', 'pregnancystatus', 'pregnancy_status', 'postpartum', 'reproductive',
  'sexualhealth', 'sexual_health', 'medication', 'medications', 'supplements',
  'allergy', 'allergies', 'painlevel', 'pain_level', 'cycle', 'cycleinfo', 'cycle_info',
  'insurance', 'insurancetype', 'insurance_type', 'fsa', 'hsa', 'zipcode', 'zip',
  'access_token', 'accesstoken', 'refresh_token', 'refreshtoken', 'authorization',
  'supabasetoken', 'supabase_token', 'oauth_token', 'oauthtoken',
  'chat_history', 'chathistory', 'conversation', 'conversationhistory', 'conversation_history',
  'fhirsummary', 'fhir_summary', 'wearablesummary', 'wearable_summary',
]);

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /(?<!\d)(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}(?!\d)/g;

function normalizeKey(key) {
  return String(key || '').toLowerCase().replace(/[^a-z0-9_$]/g, '');
}

function isSensitiveKey(key) {
  const raw = String(key || '').toLowerCase();
  const normalized = normalizeKey(key);
  if (SENSITIVE_KEYS.has(raw) || SENSITIVE_KEYS.has(normalized)) return true;

  // Catch common variants without blocking safe counters such as symptomCount.
  if (/^(raw)?(search)?query(text)?$/.test(normalized)) return true;
  if (/^(askayna|sms|chat).*(text|body|message|prompt)$/.test(normalized)) return true;
  if (/^(health|medical|reproductive|pregnancy).*(answer|answers|profile|data|text)$/.test(normalized)) return true;
  if (/^(access|refresh|oauth|auth).*token$/.test(normalized)) return true;
  return false;
}

function stripUrlDetail(value) {
  if (typeof value !== 'string') return value;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://www.aynahealth.co';
    const url = new URL(value, base);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
}

function sanitizeString(value) {
  return String(value).replace(EMAIL_RE, '[redacted-email]').replace(PHONE_RE, '[redacted-phone]');
}

export function sanitizeAnalyticsValue(value, key = '') {
  if (isSensitiveKey(key)) return undefined;

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeAnalyticsValue(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === 'object') {
    const clean = {};
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      const sanitized = sanitizeAnalyticsValue(nestedValue, nestedKey);
      if (sanitized !== undefined) clean[nestedKey] = sanitized;
    }
    return clean;
  }

  if (typeof value === 'string') {
    const lowerKey = String(key || '').toLowerCase();
    if (lowerKey.includes('url') || lowerKey.includes('referrer') || lowerKey === '$pathname') {
      return stripUrlDetail(value);
    }
    return sanitizeString(value);
  }

  return value;
}

export function sanitizePosthogEvent(event) {
  if (!event || typeof event !== 'object') return event;
  if (!event.properties || typeof event.properties !== 'object') return event;
  return {
    ...event,
    properties: sanitizeAnalyticsValue(event.properties),
  };
}

export function safePosthogIdentify(posthog, authId) {
  if (!posthog || !authId) return;
  // The App Store label declares a linked analytics Device ID. Use a separate,
  // opaque analytics identifier rather than the Supabase account UUID itself.
  const storageKey = `ayna_analytics_id:${String(authId)}`;
  let analyticsId = '';
  try {
    analyticsId = localStorage.getItem(storageKey) || '';
    if (!analyticsId) {
      analyticsId = globalThis.crypto?.randomUUID?.() || `ayna_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(storageKey, analyticsId);
    }
  } catch {
    analyticsId = globalThis.crypto?.randomUUID?.() || `ayna_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
  posthog.identify(analyticsId);
}
