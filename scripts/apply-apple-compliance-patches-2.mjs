import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, text) { fs.writeFileSync(path, text); }
function replaceExact(path, before, after) {
  let text = read(path);
  if (text.includes(after)) return false;
  if (!text.includes(before)) throw new Error(`Missing patch anchor in ${path}: ${before.slice(0, 120)}`);
  text = text.replace(before, after);
  write(path, text);
  return true;
}

// Personalized ecosystem generation sends health context to an LLM, so it
// requires the same current AI/privacy consent as Ask ayna and product chat.
replaceExact(
  'api/llm-recommendations.js',
  "import { isPremiumUser, hasLegacyClientPremiumFlag } from './_entitlement.js';",
  "import { isPremiumUser, hasLegacyClientPremiumFlag } from './_entitlement.js';\nimport { requireAiConsent } from './_privacyConsent.js';"
);
replaceExact(
  'api/llm-recommendations.js',
  `function zipOnly(location) {
  if (!location) return 'not provided';
  const match = String(location).match(/\\b(\\d{5})(?:-\\d{4})?\\b/);
  return match ? match[1] : 'not provided';
}

// Strip PII fields that must never reach Claude; replace age/location with
// privacy-safe equivalents. Applied once at the API boundary in handleRequest.
function sanitizeIntake(raw) {
  if (!raw || typeof raw !== 'object') return raw || {};
  // Destructure to explicitly drop identifying fields
  // eslint-disable-next-line no-unused-vars
  const { email, name, user_id, userId, fullAddress, address, ...rest } = raw;
  return {
    ...rest,
    age: ageRange(raw.age),
    location: zipOnly(raw.location),
  };
}`,
  `// Build a narrow recommendation context instead of forwarding the whole intake.
// Direct identifiers, ZIP/location, insurance/FSA/HSA, support notes, and other
// unrelated free text never leave ayna for this generation path.
function sanitizeIntake(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const out = { age: ageRange(raw.age) };
  const copy = (key, max = 16) => {
    const value = raw[key];
    if (Array.isArray(value)) out[key] = value.filter(Boolean).slice(0, max).map((v) => String(v).slice(0, 120));
    else if (typeof value === 'string' && value.trim()) out[key] = value.trim().slice(0, 500);
    else if (typeof value === 'boolean' || typeof value === 'number') out[key] = value;
  };
  [
    'lifeStage', 'menstrualCycle', 'primaryConcerns', 'customConcerns', 'conditions', 'symptoms',
    'goals', 'sensitivities', 'allergies', 'productPreferences', 'productsToAvoid',
    'ingredientPreferences', 'materialPreferences', 'productFormats', 'budget', 'painLevel',
    'tryingToConceive', 'pregnancyStatus', 'postpartumStatus', 'breastfeeding',
    'currentMedications', 'currentSupplements', 'dislikedProductsText', 'internalComfort',
  ].forEach((key) => copy(key));
  return out;
}`
);
replaceExact(
  'api/llm-recommendations.js',
  "  const { user, error: authError, admin } = await verifyUser(req);\n  if (!user) return res.status(401).json({ error: authError });",
  "  const { user, error: authError, admin } = await verifyUser(req);\n  if (!user) return res.status(401).json({ error: authError });\n  if (!requireAiConsent(user, res)) return;"
);
// Do not return internal exception messages/stacks to the client or log stacks
// that can accidentally contain serialized request context.
replaceExact(
  'api/llm-recommendations.js',
  "    console.error('[LLM API] Unhandled error:', e?.message, e?.stack?.slice(0, 400));\n    return res.status(500).json({ error: e?.message || String(e), type: 'unhandled_exception' });",
  "    console.error('[LLM API] Unhandled error:', e?.name || 'Error');\n    return res.status(500).json({ error: 'generation_failed', type: 'unhandled_exception' });"
);

// Product insight generation is also personalized AI.
replaceExact(
  'api/product-insights.js',
  "import { callAnthropic, callOpenAI, callGemini, providerConfigured, parseProviderOrder } from './_llm.js';",
  "import { callAnthropic, callOpenAI, callGemini, providerConfigured, parseProviderOrder } from './_llm.js';\nimport { requireAiConsent } from './_privacyConsent.js';"
);
replaceExact(
  'api/product-insights.js',
  "    console.error(`[product-insights] ${provider} failed:`, e?.status || '', e?.message, e?.body ? `| ${e.body}` : '');",
  "    console.error(`[product-insights] ${provider} failed:`, e?.status || '', e?.message);"
);
replaceExact(
  'api/product-insights.js',
  "  const { user, error, admin } = await verifyUser(req);\n  if (!user) return res.status(401).json({ error });",
  "  const { user, error, admin } = await verifyUser(req);\n  if (!user) return res.status(401).json({ error });\n  if (!requireAiConsent(user, res)) return;"
);

// SMS health replies are user-initiated AI processing. Verify the linked
// account's current consent before loading/sending health context to a model.
replaceExact(
  'api/sms-webhook.js',
  "import { callWithFallback, parseProviderOrder } from './_llm.js';",
  "import { callWithFallback, parseProviderOrder } from './_llm.js';\nimport { hasRequiredAiConsent } from './_privacyConsent.js';"
);
replaceExact(
  'api/sms-webhook.js',
  `function buildSmsPrompt(message, profile, knowledgeContext, recentMessages) {
  const profileSummary = JSON.stringify({
    age: profile?.age,
    location: profile?.location,
    conditions: profile?.conditions,
    symptoms: profile?.symptoms,
    primaryConcerns: profile?.primaryConcerns,
    productPreferences: profile?.productPreferences,
    painLevel: profile?.painLevel,
    insuranceType: profile?.insuranceType,
  });

  const historyLines = (recentMessages || [])
    .slice()
    .reverse()
    .map((m) => \`${'${'}m.direction === 'inbound' ? 'Her' : 'Ayna'}: ${'${'}m.message_body}\`)
    .join('\\n');

  return \`HER HEALTH PROFILE:
${'${'}profileSummary}

${'${'}knowledgeContext ? \`${'${'}knowledgeContext}\\n\\n\` : ''}${'${'}historyLines ? \`RECENT CONVERSATION (most recent last):\\n${'${'}historyLines}\\n\\n\` : ''}HER NEW TEXT: ${'${'}message}

Reply to her text now, following all the rules above.\`;
}`,
  `function smsAgeRange(age) {
  const n = Number.parseInt(age, 10);
  if (!Number.isFinite(n)) return undefined;
  if (n < 25) return '18-24';
  if (n < 35) return '25-34';
  if (n < 45) return '35-44';
  if (n < 55) return '45-54';
  if (n < 65) return '55-64';
  return '65+';
}

function buildSmsPrompt(message, profile, knowledgeContext, recentMessages) {
  const q = String(message || '').toLowerCase();
  const summary = {
    ageRange: smsAgeRange(profile?.age),
    conditions: Array.isArray(profile?.conditions) ? profile.conditions.slice(0, 12) : undefined,
    symptoms: Array.isArray(profile?.symptoms) ? profile.symptoms.slice(0, 12) : undefined,
    primaryConcerns: Array.isArray(profile?.primaryConcerns) ? profile.primaryConcerns.slice(0, 12) : undefined,
    productPreferences: Array.isArray(profile?.productPreferences) ? profile.productPreferences.slice(0, 10) : undefined,
    painLevel: profile?.painLevel,
  };
  if (/near|where|clinic|pharmacy|location|city|zip/.test(q)) summary.coarseLocation = String(profile?.location || '').slice(0, 40) || undefined;
  if (/insurance|covered|coverage|cost|pay|price/.test(q)) summary.insuranceType = String(profile?.insuranceType || '').slice(0, 80) || undefined;
  if (/interact|medication|medicine|drug|supplement|safe with/.test(q)) {
    summary.currentMedications = profile?.currentMedications || profile?.medications;
    summary.currentSupplements = profile?.currentSupplements || profile?.supplements;
  }
  if (/pregnan|postpartum|breastfeed|fertil|trying to conceive|ttc/.test(q)) {
    summary.pregnancyStatus = profile?.pregnancyStatus || profile?.pregnancy;
    summary.postpartumStatus = profile?.postpartumStatus || profile?.postpartum;
    summary.breastfeeding = profile?.breastfeeding;
  }
  const profileSummary = JSON.stringify(Object.fromEntries(Object.entries(summary).filter(([, v]) => v !== undefined && v !== '')));

  const historyLines = (recentMessages || [])
    .slice(0, 6)
    .slice()
    .reverse()
    .map((m) => \`${'${'}m.direction === 'inbound' ? 'Her' : 'Ayna'}: ${'${'}String(m.message_body || '').slice(0, 400)}\`)
    .join('\\n');

  return \`HER RELEVANT HEALTH CONTEXT:
${'${'}profileSummary}

${'${'}knowledgeContext ? \`${'${'}knowledgeContext}\\n\\n\` : ''}${'${'}historyLines ? \`RECENT CONVERSATION (most recent last):\\n${'${'}historyLines}\\n\\n\` : ''}HER NEW TEXT: ${'${'}String(message || '').slice(0, 800)}

Reply to her text now, following all the rules above.\`;
}`
);
replaceExact(
  'api/sms-webhook.js',
  "  await logMessage(admin, userId, 'inbound', text, messageSid);\n\n  if (optedOut) {",
  `  await logMessage(admin, userId, 'inbound', text, messageSid);

  if (optedOut) {`
);
replaceExact(
  'api/sms-webhook.js',
  `  if (optedOut) {
    // Respect our own opt-out state even if Twilio's carrier-level STOP somehow didn't catch it.
    return res.status(200).send('');
  }

  // These three share only userId and are independent of each other.`,
  `  if (optedOut) {
    // Respect our own opt-out state even if Twilio's carrier-level STOP somehow didn't catch it.
    return res.status(200).send('');
  }

  const { data: authUserResult, error: authUserError } = await admin.auth.admin.getUserById(userId);
  if (authUserError || !hasRequiredAiConsent(authUserResult?.user)) {
    const msg = 'Open ayna and review the current AI privacy choice before using personalized AI health replies by text.';
    await logMessage(admin, userId, 'outbound', msg);
    return sendTwiml(res, msg);
  }

  // These three share only userId and are independent of each other.`
);
replaceExact(
  'api/sms-webhook.js',
  ".limit(10),",
  ".limit(6),"
);

// Provider response bodies are not needed in production error objects and can
// contain details we do not want copied into downstream logs.
{
  const path = 'api/_llm.js';
  let text = read(path);
  text = text.replace("  constructor(message, { provider, status = 0, retryable = false, body = '' } = {}) {", "  constructor(message, { provider, status = 0, retryable = false } = {}) {");
  text = text.replace("    this.body = body;\n", '');
  text = text.replace(/, body: body\.slice\(0, 400\)/g, '');
  text = text.replace(/\n\s*body: e\?\.body \|\| '',?/g, '');
  write(path, text);
}

console.log('Additional Apple compliance patches applied.');
