/**
 * Tiny in-memory stand-in for the Supabase query builder, enough for the
 * health routes' tests: select/insert/upsert/update/delete with eq/in/gte,
 * order/limit, single/maybeSingle, and delete({count}).select().
 * Not a test file itself (no `describe`), but named *.test-helper.js so the
 * plain-Node import check skips it.
 */
export function createFakeDb(initial = {}) {
  const tables = {};
  for (const [k, v] of Object.entries(initial)) tables[k] = v.map((r) => ({ ...r }));
  const keys = {
    health_connections: ['user_id', 'source'],
    health_daily_metrics: ['user_id', 'source', 'origin', 'metric', 'day'],
    health_oauth_tokens: ['user_id', 'provider'],
  };
  let seq = 1;
  const t = (name) => (tables[name] ||= []);

  function query(name) {
    const filters = [];
    let op = 'select';
    let payload = null;
    let returning = false;
    let countMode = null;
    let single = null;
    let limitN = null;
    let rangeFrom = null;
    let rangeTo = null;
    const api = {
      select() { if (op !== 'select') returning = true; return api; },
      insert(rows) { op = 'insert'; payload = Array.isArray(rows) ? rows : [rows]; return api; },
      upsert(rows, opts) { op = 'upsert'; payload = Array.isArray(rows) ? rows : [rows]; api.conflict = opts?.onConflict?.split(','); return api; },
      update(patch) { op = 'update'; payload = patch; return api; },
      delete(opts) { op = 'delete'; countMode = opts?.count || null; return api; },
      eq(col, val) { filters.push((r) => r[col] === val); return api; },
      in(col, vals) { filters.push((r) => vals.includes(r[col])); return api; },
      gte(col, val) { filters.push((r) => r[col] >= val); return api; },
      order() { return api; },
      limit(n) { limitN = n; return api; },
      range(from, to) { rangeFrom = from; rangeTo = to; return api; },
      maybeSingle() { single = 'maybe'; return new Promise((res, rej) => api.then(res, rej)); },
      single() { single = 'one'; return new Promise((res, rej) => api.then(res, rej)); },
      then(resolve, reject) {
        try { resolve(run()); } catch (e) { reject(e); }
      },
    };
    const match = (r) => filters.every((f) => f(r));
    function run() {
      const rows = t(name);
      if (op === 'insert') {
        const added = payload.map((r) => ({ id: r.id ?? `id-${seq++}`, ...r }));
        rows.push(...added);
        return { data: single ? added[0] : added, error: null };
      }
      if (op === 'upsert') {
        const k = api.conflict || keys[name] || ['id'];
        for (const r of payload) {
          const i = rows.findIndex((x) => k.every((c) => x[c] === r[c]));
          if (i >= 0) rows[i] = { ...rows[i], ...r }; else rows.push({ ...r });
        }
        return { data: null, error: null };
      }
      if (op === 'update') {
        rows.forEach((r, i) => { if (match(r)) rows[i] = { ...r, ...payload }; });
        return { data: null, error: null };
      }
      if (op === 'delete') {
        const gone = rows.filter(match);
        tables[name] = rows.filter((r) => !match(r));
        return { data: returning ? gone : null, error: null, count: countMode ? gone.length : null };
      }
      let out = rows.filter(match);
      if (rangeFrom != null) out = out.slice(rangeFrom, rangeTo + 1);
      if (limitN != null) out = out.slice(0, limitN);
      if (single === 'maybe') return { data: out[0] || null, error: null };
      if (single === 'one') return out[0] ? { data: out[0], error: null } : { data: null, error: { message: 'no rows' } };
      return { data: out, error: null };
    }
    return api;
  }
  return { from: (name) => query(name), tables };
}
