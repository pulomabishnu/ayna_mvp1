/**
 * Benchmark run history (build plan stage 1).
 *
 * Each benchmark run is summarized to slot counts per brand per category,
 * stored in Supabase (partner_studio_runs) by the build, and the most recent
 * runs ride along in the next snapshot. Only runs made with the same scenario
 * set, category set and engine adapter are comparable; anything else is shown
 * as a break in the series, never joined to it.
 *
 * Inputs are the snapshot's synthetic results over public catalog facts. No
 * user data goes in or comes out.
 */

/** Slot counts per brand per category for one run, from the snapshot's compact rows. */
export function summarizeRun(snapshot) {
  const categories = {};
  for (const c of snapshot?.categories || []) {
    const brands = {};
    let slots = 0;
    for (const row of c.rows || []) {
      for (const i of row.p || []) {
        const brand = c.products?.[i]?.brand;
        if (!brand) continue;
        brands[brand] = (brands[brand] || 0) + 1;
        slots += 1;
      }
    }
    categories[c.id] = { slots, scenarios: (c.rows || []).length, brands };
  }
  return { categories };
}

/** The versions that must match for two runs to be compared. */
export const versionsOf = (run) => ({
  scenarioSetVersion: run?.scenarioSetVersion ?? null,
  categorySetVersion: run?.categorySetVersion ?? null,
  adapterVersion: run?.adapterVersion ?? null,
});

export function comparable(a, b) {
  const x = versionsOf(a);
  const y = versionsOf(b);
  return Boolean(x.scenarioSetVersion) && x.scenarioSetVersion === y.scenarioSetVersion && x.categorySetVersion === y.categorySetVersion && x.adapterVersion === y.adapterVersion;
}

const pct1 = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null);

/**
 * A brand's slot share in one category across runs, oldest first.
 * history: [{ runId, createdAt, scenarioSetVersion, categorySetVersion, adapterVersion, summary }]
 * Only runs comparable with the latest one are returned; `skipped` counts the rest.
 */
export function shareSeries(history, categoryId, brand) {
  const runs = [...(history || [])].filter((h) => h?.summary?.categories?.[categoryId]).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  if (!runs.length) return { points: [], skipped: 0 };
  const latest = runs[runs.length - 1];
  const same = runs.filter((r) => comparable(r, latest));
  const points = same.map((r) => {
    const cat = r.summary.categories[categoryId];
    return { runId: r.runId, createdAt: r.createdAt, slots: cat.brands?.[brand] || 0, total: cat.slots, value: pct1(cat.brands?.[brand] || 0, cat.slots) };
  });
  return { points, skipped: runs.length - same.length };
}

/** Change in percentage points between the last two comparable runs, or null. */
export function changeSinceLast(series) {
  const p = series?.points || [];
  if (p.length < 2 || p[p.length - 1].value == null || p[p.length - 2].value == null) return null;
  return { pp: Math.round((p[p.length - 1].value - p[p.length - 2].value) * 10) / 10, since: p[p.length - 2].createdAt };
}
