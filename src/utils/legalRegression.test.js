// Source-level legal regression tests. They guard copy and default settings,
// but are NOT a substitute for counsel review or live network checkout tests.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { PRO_PAID_TERM_START_AT, isExpectedPaidTermStart } from '../../api/_pro.js';

const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const terms=source('../components/TermsOfUse.jsx');
const policy=source('../components/PrivacyPolicy.jsx');
const healthNotice=source('../../public/consumer-health-data.html');
const main=source('../main.jsx');
const consent=source('../components/ConsentBanner.jsx');
const insights=source('../../api/product-insights.js');
const productPage=source('../components/ProductModal.jsx');
const mobilePage=source('../mobile/screens/ProductDetailScreen.jsx');
const quickSheet=source('../mobile/components/ProductSheet.jsx');

describe('commercial + health data regulatory regressions',()=>{
  it('does not send optional analytics before opt-in or silently revive GPC events',()=>{
    expect(main).toContain("opt_out_capturing_by_default: GPC_ENABLED || STORED_ANALYTICS_PREF !== 'granted'");
    expect(main).not.toContain('if (!mandatory) ph.set_config?.({ opt_out_capturing_by_default: false })');
    // Banner wording approved by Puloma, 2026-11-10; option B chosen 2026-11-11.
    expect(consent).toContain('Help us improve ayna for women like you');
    expect(consent).toContain("Turn on analytics so we can see which products are popular. We don't know who you are unless");
    expect(consent).toContain("you make an account, and it's never sold or used for ads. Until you choose, we only count");
    expect(consent).toContain('visits and which steps of the site are used, anonymously; Keep off stops that too.');
    // Same sentence in the policy and the health notice.
    const steps = 'Until you choose, we only count visits and which steps of the site are used, anonymously; Keep off stops that too.';
    expect(policy).toContain(steps);
    expect(healthNotice).toContain(steps);
    expect(consent).toContain('Opt-out request honored.');
    // The policy and health notice say opted-in analytics include products viewed.
    expect(policy).toContain('the products you view and click (product name or ID)');
    expect(healthNotice).toContain('the products you view and click (product name or ID)');
    expect(healthNotice).toContain('only after you explicitly opt in');
    expect(policy).toContain('off until you explicitly opt in');
  });
  it('does not make obsolete claims that the paid Pro subscription does not exist',()=>{
    expect(terms).not.toContain('No current paid ayna subscription');
    expect(policy).not.toContain('does not offer an automatically renewing paid ayna subscription');
    expect(terms).toContain('February 1, 2027');
    expect(terms).toContain('March 1, 2027');
    expect(terms).toContain('February 1, 2028');
    expect(policy).toContain("['Stripe'");
    expect(isExpectedPaidTermStart(PRO_PAID_TERM_START_AT)).toBe(true);
  });
  it('does not assert that legal notices exempt software from FDA classification',()=>{
    expect(terms).toContain('regulatory status of a software function depends');
    expect(healthNotice).toContain('regulatory status of software functions depends');
    expect(terms).not.toContain('not a healthcare provider, pharmacy, emergency service, medical device');
  });
  it('does not instruct the model to invent clinician endorsements or treat ingredient research as branded evidence',()=>{
    expect(insights).toContain("the MANUFACTURER'S claims");
    expect(insights).toContain('ONLY if a concrete supporting passage is included');
    expect(insights).toContain('Evidence on an individual ingredient');
    expect(insights).toContain('do not mention ACOG, NIH, Cochrane');
    expect(insights).not.toContain('you may say things like "Independent testing');
  });
  it('shows nearby commission disclosures on the main buying surfaces',()=>{
    expect(productPage).toContain('ayna may earn a commission.');
    expect(mobilePage).toContain('ayna may earn a commission.');
    expect(quickSheet).toContain('ayna may earn a commission.');
  });
});
