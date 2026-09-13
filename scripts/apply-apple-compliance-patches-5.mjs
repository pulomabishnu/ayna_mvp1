import fs from 'node:fs';

const path = 'api/llm-recommendations.integration.test.js';
let text = fs.readFileSync(path, 'utf8');
const before = "data: { user: { id: 'u-x', email: 'x@x.com', app_metadata: {}, user_metadata: { is_premium: true } } },";
const after = "data: { user: { id: 'u-x', email: 'x@x.com', app_metadata: {}, user_metadata: { consent_version: 'v2-18plus', consent_given_at: '2026-09-13T00:00:00.000Z', age_18_confirmed: true, is_premium: true } } },";
if (!text.includes(after)) {
  if (!text.includes(before)) throw new Error('Missing direct premium-user fixture anchor');
  text = text.replace(before, after);
  fs.writeFileSync(path, text);
}
console.log('Final consent fixture patch applied.');
