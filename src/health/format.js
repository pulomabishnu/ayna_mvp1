/** Display and edit helpers for health values (review screen, insights). */
import { METRICS } from './metrics.js';
import { parseDuration, parseTempC } from './manualImport.js';
import { fmtMinutes } from './insights.js';

const FLOW_WORDS = ['None', 'Unspecified', 'Light', 'Medium', 'Heavy'];

export function formatValue(metric, value) {
  const unit = METRICS[metric]?.unit;
  if (unit === 'min') return fmtMinutes(value);
  if (unit === 'flow_level') return FLOW_WORDS[value] || String(value);
  if (unit === 'degC') return `${value} °C`;
  if (unit === 'bpm') return `${value} bpm`;
  if (unit === 'ms') return `${value} ms`;
  if (unit === 'kcal') return `${Math.round(value).toLocaleString('en-US')} kcal`;
  if (unit === 'count') return Math.round(value).toLocaleString('en-US');
  return String(value);
}

/** Parse what she typed back into the metric's unit. null = not a valid value. */
export function parseEdited(metric, text) {
  const def = METRICS[metric];
  if (!def) return null;
  let v;
  if (def.unit === 'min') v = parseDuration(text);
  else if (def.unit === 'degC') v = def.min < 0 ? Number(String(text).replace(/[^\d.-]/g, '')) : parseTempC(text);
  else if (def.unit === 'flow_level') { const i = FLOW_WORDS.findIndex((w) => w.toLowerCase() === String(text).trim().toLowerCase()); v = i >= 0 ? i : Number(text); }
  else v = Number(String(text).replace(/[^\d.-]/g, ''));
  if (v == null || !Number.isFinite(v) || v < def.min || v > def.max) return null;
  return v;
}

