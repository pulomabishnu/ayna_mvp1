/**
 * Her own Home (founder, Oct 24 23:21): which widgets sit under the fixed
 * part of Home (app) and Today (website), in what order and size.
 *
 * Fixed and never in here: the Ask ayna bar, safety and care items, the
 * Daily Rundown card and the 1 to 3 things for today.
 *
 * Space, not count (founder, 23:22): small = 1 space, large = 2. The app's
 * Home must stay on one 390x844 screen, so it holds 4 spaces; Today on the
 * website holds 8.
 *
 * Stored per owner with ownedStore.js under HOME_LAYOUT_KEY:
 *   items: { app?: Layout, web?: Layout }   Layout = { widgets: [{ id, size, config? }], at: ISO }
 * No saved layout for a surface = the default (today's behaviour). Device
 * only for now: supabase/user_home_layout_2026-10-25.sql adds the table to
 * sync it (not run).
 */
import { bucketOf, loadState, putBucket, saveState, switchOwner } from '../health/ownedStore.js';

export const HOME_LAYOUT_KEY = 'ayna_home_layout_v1';
export const SURFACES = ['app', 'web'];
export const SPACE = { small: 1, large: 2 };
export const CAPS = { app: 4, web: 8 };
export const FULL_LINE = 'Home is full. Turn one off to add another.';

/** Never customizable: always on Home, never counted against the cap. */
export const FIXED_ITEMS = [
  { id: 'ask', title: 'Ask ayna' },
  { id: 'safety', title: 'Safety and care' },
  { id: 'rundown', title: 'Your Daily Rundown' },
  { id: 'today', title: '1 to 3 things for today' },
];

/** With no customization: exactly what Home and Today showed before. */
export const DEFAULT_LAYOUT = {
  app: [{ id: 'health', size: 'large' }],
  web: [],
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const surfaceOf = (s) => (s === 'web' ? 'web' : 'app');

export const spaceOf = (w) => SPACE[w?.size] || 1;
export const usedSpace = (widgets = []) => widgets.reduce((n, w) => n + spaceOf(w), 0);
export const capFor = (surface) => CAPS[surfaceOf(surface)];

/** "Home fits 4 spaces. 3 used." in plain words. */
export function capLine(widgets, surface) {
  const cap = capFor(surface);
  const used = usedSpace(widgets);
  const where = surfaceOf(surface) === 'web' ? 'Today' : 'Home';
  if (used >= cap) return surfaceOf(surface) === 'web' ? FULL_LINE.replace('Home', 'Today') : FULL_LINE;
  return `${where} fits ${cap} spaces: a small widget takes 1, a large one takes 2. ${used} of ${cap} used.`;
}

/** Can `widget` join `widgets` (or replace the one with the same id) and still fit? */
export function fits(widgets, widget, surface) {
  const rest = widgets.filter((w) => w.id !== widget.id);
  return usedSpace(rest) + spaceOf(widget) <= capFor(surface);
}

/**
 * Keep only known widgets, once each, in a size they come in, within the cap.
 * `registry` is { [id]: { sizes: ['small','large'], surfaces } }.
 */
export function sanitizeLayout(widgets, surface, registry) {
  if (!Array.isArray(widgets)) return null;
  const out = [];
  const seen = new Set();
  for (const raw of widgets) {
    const def = registry?.[raw?.id];
    if (!def || seen.has(raw.id) || (def.surfaces && !def.surfaces.includes(surfaceOf(surface)))) continue;
    const size = def.sizes.includes(raw.size) ? raw.size : def.sizes[0];
    const w = { id: raw.id, size };
    if (isObj(raw.config)) w.config = raw.config;
    if (usedSpace(out) + spaceOf(w) > capFor(surface)) continue;
    seen.add(raw.id);
    out.push(w);
  }
  return out;
}

/** Her saved widgets for this surface, or null when she never customized it. */
export function readHomeLayout(surface, storage = globalThis.localStorage) {
  const items = bucketOf(loadState(HOME_LAYOUT_KEY, storage)).items;
  const saved = items[surfaceOf(surface)];
  return isObj(saved) && Array.isArray(saved.widgets) ? saved.widgets : null;
}

export function writeHomeLayout(surface, widgets, storage = globalThis.localStorage, now = new Date()) {
  const state = loadState(HOME_LAYOUT_KEY, storage);
  const b = bucketOf(state);
  const items = { ...b.items, [surfaceOf(surface)]: { widgets: widgets.map((w) => ({ ...w })), at: new Date(now).toISOString() } };
  saveState(HOME_LAYOUT_KEY, putBucket(state, { items, dirty: [] }), storage);
}

/** "Reset to default": forget her layout for this surface. */
export function resetHomeLayout(surface, storage = globalThis.localStorage) {
  const state = loadState(HOME_LAYOUT_KEY, storage);
  const b = bucketOf(state);
  const items = { ...b.items };
  delete items[surfaceOf(surface)];
  saveState(HOME_LAYOUT_KEY, putBucket(state, { items, dirty: [] }), storage);
}

/** Whoever is signed in (null = signed out). Her own layout wins over the device one. */
export function setHomeLayoutOwner(userId, storage = globalThis.localStorage) {
  const state = loadState(HOME_LAYOUT_KEY, storage);
  const next = switchOwner(state, userId, (mine, device) => ({ ...device, ...mine }));
  if (next !== state) saveState(HOME_LAYOUT_KEY, { ...next, buckets: Object.fromEntries(Object.entries(next.buckets).map(([k, v]) => [k, { ...v, dirty: [] }])) }, storage);
  return next.owner;
}

/** The widgets Home shows: hers (cleaned) or the default. */
export function effectiveLayout(surface, registry, storage = globalThis.localStorage) {
  const saved = readHomeLayout(surface, storage);
  return { widgets: sanitizeLayout(saved || DEFAULT_LAYOUT[surfaceOf(surface)], surface, registry) || [], custom: Boolean(saved) };
}

/** Move one widget up (-1) or down (+1). */
export function moveWidget(widgets, id, by) {
  const i = widgets.findIndex((w) => w.id === id);
  const j = i + by;
  if (i < 0 || j < 0 || j >= widgets.length) return widgets;
  const out = [...widgets];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

/** Move one widget to index `to` (drag). */
export function moveWidgetTo(widgets, id, to) {
  const i = widgets.findIndex((w) => w.id === id);
  if (i < 0) return widgets;
  const out = [...widgets];
  const [w] = out.splice(i, 1);
  out.splice(Math.max(0, Math.min(out.length, to)), 0, w);
  return out;
}
