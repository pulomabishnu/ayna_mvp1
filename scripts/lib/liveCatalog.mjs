// The exact product universe the server may offer a model: bundled catalog
// plus published product_catalog rows, DB winning on id (api/_catalogGrounding.js).
export async function mergeLiveCatalog(bundled, dbRows) {
  const { isPublishable, toClientProduct } = await import('../../api/products.js');
  const byId = new Map();
  for (const p of bundled) if (p?.id && p?.name) byId.set(String(p.id), p);
  const rows = Array.isArray(dbRows) ? dbRows : [];
  for (const row of rows.filter((r) => r && r.is_active !== false).filter(isPublishable).map(toClientProduct)) {
    if (row?.id && row?.name) byId.set(String(row.id), row);
  }
  return [...byId.values()];
}
