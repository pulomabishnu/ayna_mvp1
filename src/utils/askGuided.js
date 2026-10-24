// Ask's first screen tiles: starters for where she is (askStarters.js), with
// the surface's own list as the fallback when ayna knows nothing specific.
import { askSurfaceFrom, startersFor } from './askStarters.js';
import { getTodayAskContext } from './askToday.js';

export function guidedTiles({ focusProduct = null, hasHealthData = false, fallback = [] } = {}) {
  const surface = askSurfaceFrom({ focusProduct });
  if (surface === 'other') return fallback;
  return startersFor({ surface, signals: getTodayAskContext()?.signals || {}, productName: focusProduct?.name || '', hasHealthData });
}
