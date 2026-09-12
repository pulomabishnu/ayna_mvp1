import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isSensitiveHealthQuery,
  minimizeExternalHealthQuery,
  routeHealthQuery,
} from './_healthKnowledge.js';

describe('health knowledge privacy routing', () => {
  const oldUrl = process.env.SUPABASE_URL;
  const oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    if (oldUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey;
  });

  it('recognizes common symptom and condition searches as sensitive', () => {
    expect(isSensitiveHealthQuery('best products for PCOS')).toBe(true);
    expect(isSensitiveHealthQuery('why is my period so heavy')).toBe(true);
    expect(isSensitiveHealthQuery('wireless headphones')).toBe(false);
  });

  it('removes obvious identifiers from an external fallback query', () => {
    const out = minimizeExternalHealthQuery(
      'I am 22, my email is jane@example.com, zip 10026, diagnosed with PCOS and looking for supplements'
    );
    expect(out).not.toMatch(/jane@example\.com/i);
    expect(out).not.toContain('10026');
    expect(out).not.toMatch(/\b22\b/);
    expect(out.toLowerCase()).toContain('pcos');
  });

  it('fails closed when the database is unavailable and local reviewed knowledge covers the topic', async () => {
    const routed = await routeHealthQuery('PCOS symptoms and product options');
    expect(routed.sensitive).toBe(true);
    expect(routed.allowExternal).toBe(false);
    expect(routed.internalHits.length).toBeGreaterThan(0);
    expect(routed.internalHits[0].sourceType).toBe('ayna_knowledge');
  });

  it('does not treat a database outage as permission to external-search an uncovered sensitive topic', async () => {
    const routed = await routeHealthQuery('medication allergy symptoms I want help with');
    expect(routed.sensitive).toBe(true);
    expect(routed.allowExternal).toBe(false);
  });

  it('allows ordinary non-health product discovery to keep its existing external-search path', async () => {
    const routed = await routeHealthQuery('wireless headphones');
    expect(routed.sensitive).toBe(false);
    expect(routed.allowExternal).toBe(true);
  });
});
