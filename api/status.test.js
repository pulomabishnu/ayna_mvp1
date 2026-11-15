import { describe, it, expect } from 'vitest';
import { runChecks } from './status.js';

const db = (count, error = null) => ({ from: () => ({ select: () => ({ eq: async () => ({ count, error }) }) }) });

describe('/api/status', () => {
  it('passes the catalog check with active products', async () => {
    const out = await runChecks({ db: db(829) });
    expect(out.checks.find((c) => c.name === 'catalog')).toMatchObject({ ok: true, detail: '829 active products' });
  });
  it('fails loudly on an empty catalog or a database error', async () => {
    expect((await runChecks({ db: db(0) })).checks[0].ok).toBe(false);
    expect((await runChecks({ db: db(null, { message: 'down' }) })).checks[0]).toMatchObject({ ok: false, detail: 'down' });
  });
});
