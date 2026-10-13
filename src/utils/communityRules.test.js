import { describe, it, expect } from 'vitest';
import { checkCommunityText, breaksCommunityRules, segmentCommunityText, ruleMessage, COMMUNITY_RULES, MEDICAL_ALLOWED } from './communityRules.js';

const ruleOf = (t) => checkCommunityText(t).rule;

describe('communityRules: true positives', () => {
  it.each([
    ['harassment', 'just kill yourself'],
    ['harassment', 'kys honestly'],
    ['harassment', "you're a stupid bitch"],
    ['harassment', 'u r so pathetic'],
    ['harassment', "I'll find you"],
    ['sexual', 'send nudes'],
    ['sexual', 'check my onlyfans'],
    ['sexual', 'p0rn'],
    ['sexual', 'p o r n'],
    ['spam', 'DM me for details'],
    ['spam', 'link in bio!'],
    ['spam', 'use my code SAVE20 for 20% off'],
    ['spam', 'buy it here amzn.to/3xYz'],
    ['spam', 'https://www.amazon.com/dp/B000'],
    ['spam', 'join my team and be your own boss'],
    ['contact', 'email me at jane.doe@gmail.com'],
    ['contact', 'jane (at) gmail (dot) com'],
    ['contact', 'call 212-555-0199'],
    ['contact', 'text me at (917) 555 0123'],
    ['contact', 'I live at 312 West 119th St Apt 3M'],
    ['contact', 'my ig: maya.cycles'],
    ['contact', 'snap @mayacycles'],
    ['contact', 'add me on snap'],
    ['meds', 'selling my extra adderall'],
    ['meds', 'anyone selling ozempic?'],
    ['meds', 'hmu for pills'],
    ['meds', 'I have spare clomid if anyone needs'],
    ['advice', 'you should stop taking your meds'],
    ['advice', 'just quit your antidepressants'],
    ['advice', "you don't need your insulin"],
    ['advice', 'you should take 400 mg'],
    ['advice', 'double your dose'],
  ])('%s: %s', (rule, text) => {
    expect(ruleOf(text)).toBe(rule);
  });

  it('catches the hate stems with l33t and spacing (fixtures built so the test file holds no slurs)', () => {
    const stem = ['t', 'o', 'g', 'g', 'a', 'f'].reverse().join('');
    expect(ruleOf(`what a ${stem}`)).toBe('hate');
    expect(ruleOf(`what a ${stem.replace('a', '4')}s`)).toBe('hate');
    expect(ruleOf(`what a ${stem.split('').join(' ')}`)).toBe('hate');
  });

  it('reports exact spans', () => {
    const text = 'hi, email me at a@b.co ok';
    const { issues } = checkCommunityText(text);
    expect(issues).toHaveLength(1);
    expect(text.slice(issues[0].start, issues[0].end)).toBe('a@b.co');
  });

  it('segments text for the overlay without losing characters', () => {
    const text = 'DM me or call 212-555-0199 please';
    const segs = segmentCommunityText(text);
    expect(segs.map((s) => s.text).join('')).toBe(text);
    expect(segs.filter((s) => s.flagged).map((s) => s.text)).toEqual(['DM me', '212-555-0199']);
  });
});

describe('communityRules: medical and everyday false-positive guards', () => {
  it.each(MEDICAL_ALLOWED)('allows "%s"', (word) => {
    expect(checkCommunityText(`Question about my ${word} this week`).blocked).toBe(false);
  });

  it.each([
    'Is it normal to have more discharge before my period?',
    'Sex hurts after my IUD, anyone else?',
    'Breast tenderness and vulva itching, should I see a doctor?',
    'Painful orgasm and low libido on the pill',
    'Vaginal dryness after birth, what helped you?',
    'I take 400 mg magnesium every night',
    'I buy my metformin at CVS',
    'Opill is sold without a prescription now',
    'Should I stop taking my birth control?',
    'My doctor said I could stop my iron after 3 months',
    'Swapping birth control brands next month',
    'I saw 3 different dr’s before my diagnosis',
    'Took 2 pills a day for a week',
    'Horny goat weed supplement, any thoughts?',
    'Flame retardant chemicals in pads?',
    'Cocoon wrap for cramps',
    'Snapped at my partner during PMS',
    'Saw this on TikTok trends, is it real?',
    'Reading https://www.acog.org/womens-health/faqs/endometriosis',
    'Thank you so much, this helped',
    'The 1500 kcal plan made me tired',
    'Cycle day 14, LH 45.2 on my strip',
    'Assessment at the clinic tomorrow',
    'Scunthorpe and Essex trips planned',
    'Ask @maya, she knows',
  ])('allows: %s', (text) => {
    expect(checkCommunityText(text).issues).toEqual([]);
  });
});

describe('communityRules: crisis language', () => {
  it('is not censored and sets crisis', () => {
    const r = checkCommunityText('Some days I want to die');
    expect(r.blocked).toBe(false);
    expect(r.crisis).toBe(true);
  });
  it('does not fire on ordinary text', () => {
    expect(checkCommunityText('I want to end my subscription').crisis).toBe(false);
  });
});

describe('communityRules: helpers', () => {
  it('builds one short message per rule', () => {
    for (const r of COMMUNITY_RULES) expect(ruleMessage(r.id)).toMatch(/^This breaks our community rules: .+\.$/);
  });
  it('breaksCommunityRules checks every field', () => {
    expect(breaksCommunityRules('fine', 'also fine')).toBe(false);
    expect(breaksCommunityRules('fine', 'dm me')).toBe(true);
  });
});
