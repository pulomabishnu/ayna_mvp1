/* global process */
/**
 * Read health numbers from ONE screenshot so the person can review them.
 *
 * OFF unless HEALTH_IMAGE_EXTRACTION=anthropic. It sends a health image to a
 * third-party processor (Anthropic), which is a new purpose for that
 * processor; the founders/counsel should confirm the processor terms cover it
 * and the privacy policy says so before switching it on. Until then the app
 * falls back to "type it in".
 *
 *   GET  -> { enabled }
 *   POST { mediaType, data (base64), declaredApp } -> { candidates: [...] }
 *
 * Saves nothing. The image is held in memory for this one request only, never
 * written to storage or logs. The PRISM trace for the call is redacted: no
 * image, no extracted values (api/_llm.js trace.redact).
 */
import { verifyUser } from './_usageLimit.js';
import { rateLimit } from './_rateLimit.js';
import { callAnthropic, extractBalancedJsonObject } from './_llm.js';
import { logHealthError } from './_healthStore.js';
import { cleanRow, METRICS } from '../src/health/metrics.js';

const MEDIA = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_BASE64 = 7 * 1024 * 1024;
export const extractionEnabled = () => String(process.env.HEALTH_IMAGE_EXTRACTION || '').toLowerCase() === 'anthropic';

const SYSTEM = `You read numbers off a screenshot of a health or fitness app. Return ONLY JSON:
{"values":[{"metric":"<id>","day":"YYYY-MM-DD","value":<number>}]}
Allowed metric ids and units: ${Object.entries(METRICS).map(([id, m]) => `${id} (${m.unit})`).join(', ')}.
menstrual_flow: 1 unspecified, 2 light, 3 medium, 4 heavy. Durations in minutes. Temperatures in Celsius.
Only include values printed on the screen with a date you can read or that the screen clearly labels as today (use "today").
Never estimate, infer or diagnose. Skip scores you cannot map to an allowed id. If nothing qualifies return {"values":[]}.`;

export function candidatesFromModel(text, today = new Date().toISOString().slice(0, 10)) {
  let parsed;
  try { parsed = JSON.parse(extractBalancedJsonObject(text) || text); } catch { return []; }
  const out = [];
  const seen = new Set();
  for (const v of Array.isArray(parsed?.values) ? parsed.values.slice(0, 60) : []) {
    const day = v?.day === 'today' ? today : v?.day;
    if (typeof day !== 'string' || day > today) continue;
    const { row } = cleanRow({ metric: v?.metric, day, value: v?.value, source: 'manual_import' });
    if (!row) continue;
    const key = `${row.metric}|${row.day}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ metric: row.metric, day: row.day, value: row.value, label: METRICS[row.metric].label, unit: row.unit, note: 'read from image' });
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  if (req.method === 'GET') return res.status(200).json({ enabled: extractionEnabled() });
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'method_not_allowed' }); }
  if (!extractionEnabled()) return res.status(403).json({ error: 'extraction_disabled' });

  const { user, error } = await verifyUser(req);
  if (error || !user) return res.status(401).json({ error: error || 'auth_required' });
  const limited = await rateLimit(`health-extract:${user.id}`, { max: 20, windowSec: 86400 });
  if (!limited.ok) return res.status(429).json({ error: 'rate_limited' });

  const { mediaType, data } = req.body || {};
  if (!MEDIA.has(mediaType) || typeof data !== 'string' || !data.length || data.length > MAX_BASE64 || !/^[A-Za-z0-9+/=]+$/.test(data.slice(0, 200))) {
    return res.status(400).json({ error: 'bad_image' });
  }
  try {
    const out = await callAnthropic({
      system: SYSTEM,
      prompt: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
        { type: 'text', text: `Today is ${new Date().toISOString().slice(0, 10)}. Read the health values.` },
      ],
      maxTokens: 1200,
      temperature: 0,
      trace: {
        name: 'health-extract',
        redact: true,
        messages: [{ role: 'user', content: '[health screenshot, not traced]' }],
        formatOutput: (text) => `${candidatesFromModel(text).length} values found`,
      },
    });
    return res.status(200).json({ candidates: candidatesFromModel(out.text) });
  } catch (e) {
    logHealthError('health-extract', e?.provider ? `${e.provider}_failed` : 'failed');
    return res.status(502).json({ error: 'extract_failed' });
  }
}
