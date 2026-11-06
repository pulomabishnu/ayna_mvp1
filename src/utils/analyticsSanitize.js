// What PostHog is allowed to see. Used by before_send in main.jsx (website
// and app: the app runs posthog-js inside its WebView, so both go through it).

// Health-related interests, product identity and direct identifiers must not
// become analytics payload. Keep aggregate counters, never individual SKUs.
export const SENSITIVE_ANALYTICS_KEYS = new Set([
  'query', 'searchquery', 'search_query', 'email', 'useremail', 'prompt', 'message', 'notes',
  'healthprofile', 'health_profile', 'fullhealthintake', 'full_health_intake',
  'conditions', 'medications', 'allergies', 'symptoms', 'diagnosis', 'diagnoses',
  'concerns', 'intake', 'fhirsummary', 'fhir_summary', 'wearablesummary',
  'wearable_summary', 'freetext', 'free_text', 'supportothertext',
  'support_other_text', 'customconcerns', 'custom_concerns',
  'userid', 'user_id', 'authuserid', 'auth_user_id', 'phone', 'phonenumber',
  'phone_number', 'zipcode', 'zip', 'full_name', 'first_name', 'last_name',
  'product_id', 'productid', 'product_name', 'productname', 'productids',
  'product_ids', 'category', 'categories', 'brand', 'brands', 'need', 'needid',
  'need_id', 'needids', 'need_ids', 'symptom', 'condition', 'conditionid',
  'life_stage', 'lifestage', 'cycle', 'stage', 'pregnancy', 'breastfeeding',
  'medication', 'allergy', 'health_functions', 'healthfunctions',
  'primary_concern', 'primaryconcern', 'source_product_id', 'retailer_product_id',
]);

// Query-string params that carry what someone typed (Shop and Community
// search mirror their box into ?q=) or who they are. Removed from every URL
// PostHog records ($current_url, $referrer, $initial_current_url, ...).
export const FREE_TEXT_URL_PARAMS = new Set([
  'q', 'query', 'search', 's', 'term', 'keyword', 'keywords', 'text',
  'email', 'phone', 'name', 'category', 'condition', 'symptom', 'need',
  'product', 'product_id', 'brand', 'tag', 'stage', 'life_stage',
]);

// Any property whose key looks like it holds a URL.
const URL_KEY = /(url|referrer|href|pathname)$/i;
// A gift box winner link is a key (/gift/<token>): never send the token.
const GIFT_LINK = /(\/gift\/)[A-Za-z0-9_-]{20,64}/;
// Dynamic health-topic, product and content slugs can reveal sensitive interests.
const HEALTH_ITEM_PATH = /^(\/(?:product|products|read|reads|article|articles|library|playlists|community\/(?:post|thread|topic)))(?:\/[^/?#]+)+\/?$/i;

/**
 * Drop free-text params from a URL string and any `key=value` hash (auth
 * callbacks put tokens there). Leaves non-URL strings untouched.
 */
export function scrubUrl(value) {
  if (typeof value !== 'string' || !value) return value;
  if (!/^https?:\/\//i.test(value) && !value.startsWith('/')) return value;
  let url;
  try {
    url = new URL(value, 'https://placeholder.invalid');
  } catch {
    return value;
  }
  let changed = false;
  if (GIFT_LINK.test(url.pathname)) {
    url.pathname = url.pathname.replace(GIFT_LINK, '$1link');
    changed = true;
  }
  const sensitivePath = url.pathname.match(HEALTH_ITEM_PATH);
  if (sensitivePath) {
    url.pathname = sensitivePath[1];
    changed = true;
  }
  for (const key of [...url.searchParams.keys()]) {
    if (FREE_TEXT_URL_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (url.hash && url.hash.includes('=')) {
    url.hash = '';
    changed = true;
  }
  if (!changed) return value;
  const out = url.toString();
  return url.origin === 'https://placeholder.invalid' ? out.slice(url.origin.length) : out;
}

export function sanitizeAnalyticsObject(value) {
  if (Array.isArray(value)) return value.map(sanitizeAnalyticsObject);
  if (!value || typeof value !== 'object') return value;

  const clean = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    const normalized = String(key).toLowerCase();
    if (SENSITIVE_ANALYTICS_KEYS.has(normalized)) continue;
    clean[key] = URL_KEY.test(key) && typeof nestedValue === 'string'
      ? scrubUrl(nestedValue)
      : sanitizeAnalyticsObject(nestedValue);
  }
  return clean;
}

/**
 * Clean every part of a PostHog capture result that can reach the server:
 * event properties plus the person properties in $set / $set_once (where
 * posthog-js puts $initial_current_url and $initial_referrer).
 */
export function sanitizeEventPayload(event, extraProperties = {}) {
  if (/pregnan|fertil|ovulat|period|menopaus|pcos|endometri|vagin|(?:^|_)sti(?:_|$)|(?:^|_)std(?:_|$)|contracepti|miscarriage|abortion|breastfeed/i.test(String(event?.event || ''))) return null;
  if (!event || typeof event !== 'object') return event;
  const out = { ...event };
  if (event.properties) out.properties = { ...extraProperties, ...sanitizeAnalyticsObject(event.properties) };
  if (event.$set) out.$set = sanitizeAnalyticsObject(event.$set);
  if (event.$set_once) out.$set_once = sanitizeAnalyticsObject(event.$set_once);
  return out;
}
