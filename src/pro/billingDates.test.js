import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PRO_PAID_TERM_START_AT, isExpectedPaidTermStart, renewalDate } from '../../api/_pro.js';
import { PLANS, PAID_TERM_STARTS, EARLY_ACCESS_LINE } from './plans.js';

const api = readFileSync(new URL('../../api/pro.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../../public/pro.html', import.meta.url), 'utf8');
const plain = readFileSync(new URL('../../public/pro-pay.js', import.meta.url), 'utf8');

describe('early access: January full launch, February prepaid term', () => {
  it('requires exactly the advertised February 1 2027 midnight New York paid term', () => {
    expect(PRO_PAID_TERM_START_AT).toBe('2027-02-01T05:00:00.000Z');
    expect(isExpectedPaidTermStart('2027-02-01T00:00:00-05:00')).toBe(true);
    for (const value of ['2027-01-01T05:00:00+00:00', '2026-12-31', '2027-02-02', null, undefined, '']) {
      expect(isExpectedPaidTermStart(value)).toBe(false);
    }
    expect(PAID_TERM_STARTS).toBe('Feb 1, 2027');
  });
  it('initial monthly paid term ends March 1 2027; annual ends Feb 1 2028', () => {
    expect(new Date(renewalDate(PRO_PAID_TERM_START_AT, 'month')*1000).toISOString()).toBe('2027-03-01T05:00:00.000Z');
    expect(new Date(renewalDate(PRO_PAID_TERM_START_AT, 'year')*1000).toISOString()).toBe('2028-02-01T05:00:00.000Z');
  });
  it('the API blocks checkout when the database term is inconsistent', () => {
    expect(api).toContain("if (!isExpectedPaidTermStart(status.launchAt)) return res.status(503)");
    expect(api).toContain('trial_end: renewAt');
    expect(api).toContain('paidTermStartsAt: PRO_PAID_TERM_START_AT');
  });
  it('both UI layers say launch in January but paid term starts February', () => {
    expect(EARLY_ACCESS_LINE).toContain('fully launches in January 2027');
    expect(EARLY_ACCESS_LINE).toContain('February 1, 2027');
    expect(EARLY_ACCESS_LINE).toContain('January 31');
    expect(html).toContain('fully launches in January 2027');
    expect(html).toContain('February 1, 2027');
    expect(html).toContain('March 1, 2027');
    expect(html).toContain('February 1, 2028');
    expect(plain).toContain('Early Access through January is included');
    expect(PLANS.find(p=>p.id==='month').terms).toContain('March 1, 2027');
    expect(PLANS.find(p=>p.id==='year').terms).toContain('February 1, 2028');
    expect(html).not.toContain('December 31, 2026');
  });
});
