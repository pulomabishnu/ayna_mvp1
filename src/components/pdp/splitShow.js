/** Long lists show this many, then "Show all N" in place (PDP rule 8). */
export const SHOW_FIRST = 3;

/** Split a list into what shows and what waits behind "Show all N". */
export function splitShow(list, n = SHOW_FIRST) {
  const all = (list || []).filter((x) => x != null && x !== '');
  return { shown: all.slice(0, n), rest: all.slice(n), total: all.length };
}
