import { describe, expect, it } from 'vitest';
import { quotaAwareResponse } from './_proQuotaResponse.js';

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    getHeader(k) { return this.headers[k]; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

describe('Pro chat quota compatibility response', () => {
  it('turns the new Free monthly cap into correct user-facing copy for legacy clients', () => {
    const res = mockRes();
    quotaAwareResponse(res, { askAyna: true }).status(429).json({ error: 'daily_limit_reached', used: 5, limit: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.body.answer).toContain('5 free Ask ayna chats');
    expect(res.body.answer).toContain('reset on the 1st');
    expect(res.body.answer).toContain('up to 50');
    expect(res.body.profileUpdate).toEqual({ frustrations: [], sensitivities: [], productsToAvoid: [], preference: null });
  });

  it('shows the separate Pro monthly cap', () => {
    const res = mockRes();
    quotaAwareResponse(res).status(429).json({ error: 'daily_limit_reached', used: 50, limit: 50 });
    expect(res.statusCode).toBe(200);
    expect(res.body.answer).toContain('50 ayna Pro chats');
  });

  it('does not change the legacy weekly rollout-off response', () => {
    const res = mockRes();
    quotaAwareResponse(res).status(429).json({ error: 'weekly_limit_reached', used: 5, limit: 5 });
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('weekly_limit_reached');
  });
});
