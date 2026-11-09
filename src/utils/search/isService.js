// Services: telehealth, at-home tests, apps and programs from women's health companies (src/data/startups.js).
// Its own small module so the landing's counts don't pull the search engine and catalog into first paint.
import { STARTUPS } from '../../data/startups.js';

const STARTUP_IDS = new Set(STARTUPS.map((s) => String(s.id)));

// Catalog entries that are a service, not a thing you buy (Visana, Midi, apps):
// type 'digital'. QA3 M8: Products lists products only, on web and app.
export function isService(item) {
  return Boolean(item && (STARTUP_IDS.has(String(item.id)) || item.type === 'digital'));
}
