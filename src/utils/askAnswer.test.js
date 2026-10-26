// Ask audit (Oct 25): grouped prompts with Safety first when flagged, product
// and read questions answered on this device, every answer with sources and
// "Based on", and products shown with her match + reason.
import { beforeAll, describe, expect, it } from 'vitest';
import { askPromptGroups, startersFromFindings, SAFETY_Q } from './askGroups.js';
import { askSafetyFlags, localSafetyAnswer } from './askSafety.js';
import { localAnswer, aiAnswerExtras } from './askAnswer.js';
import { dosAndDonts, readsOn } from './askCatalog.js';

// The catalog and engine load lazily; warm them once so each test has its normal budget.
beforeAll(async () => { await Promise.all([import('../data/products.js'), import('../components/pdp/pdpParts.js'), import('../components/pdp/evidenceLevels.js'), import('../components/Articles.jsx')]); }, 120000);

const IUD = { fullHealthIntake: { age: '24', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Period product support', 'Heavy periods'], periodFlow: 'Heavy', conditions: ['None'], allergies: ['None'], medications: ['None'], safety: ['None'], allergyStatus: 'No', diagnosisSelections: ['None that I know of'], takesCurrent: 'Yes', currentMedicationItems: ['Hormonal IUD'] }, personalizationCompleted: true };

describe('prompt groups', () => {
  it('About you, Safety, Products; 3 to 5 prompts; Safety first when flagged', () => {
    const plain = askPromptGroups({ signedIn: true, hasProfile: true, signals: { hasRundown: true } });
    expect(plain.map((g) => g.id)).toEqual(['about', 'safety', 'products']);
    const n = plain.reduce((k, g) => k + g.prompts.length, 0);
    expect(n).toBeGreaterThanOrEqual(3); expect(n).toBeLessThanOrEqual(5);
    const flagged = askPromptGroups({ signedIn: true, hasProfile: true, safety: { flags: ['iud'] } });
    expect(flagged[0].id).toBe('safety');
    expect(flagged[0].prompts[0].question).toMatch(/IUD/);
  }, 60000);
  it('signed out: only what is answered on this device', () => {
    const g = askPromptGroups({ signedIn: false, hasProfile: false });
    expect(g.flatMap((x) => x.prompts).every((p) => p.local)).toBe(true);
    expect(g.some((x) => x.id === 'products')).toBe(true);
  }, 60000);
  it('the top match prompt names the engine % only at 50+', () => {
    expect(askPromptGroups({ signedIn: true, hasProfile: true, topPercent: 92 }).flatMap((g) => g.prompts).some((p) => p.question === 'Why is my top match 92%?')).toBe(true);
    expect(askPromptGroups({ signedIn: true, hasProfile: true, topPercent: 31 }).flatMap((g) => g.prompts).some((p) => /\d%/.test(p.question))).toBe(false);
  }, 60000);
  it('startersFromFindings: up to three, the fact as the reason', () => {
    const s = startersFromFindings([{ title: 'Resting heart rate: 4 bpm above your usual' }, { title: 'Sleep 40m under your usual', question: 'Why was my sleep short?' }, { title: '' }, { text: 'Temp up' }, { title: 'One more' }]);
    expect(s).toHaveLength(3);
    expect(s[0]).toMatchObject({ reason: 'Resting heart rate: 4 bpm above your usual', health: 'Resting heart rate: 4 bpm above your usual' });
    expect(s[1].question).toBe('Why was my sleep short?');
  }, 60000);
});

describe('safety', () => {
  it('an IUD in her answers is a flag', async () => {
    const f = await askSafetyFlags(IUD);
    expect(f.flags).toContain('iud');
  }, 60000);
  it('local Safety answers use only engine text', () => {
    expect(localSafetyAnswer(SAFETY_Q.hold, { holds: [{ name: 'X', reason: 'We don’t know Y yet.', fix: '' }] }).answer).toMatch(/X/);
    expect(localSafetyAnswer('something else', { holds: [] })).toBeNull();
  }, 60000);
});

describe('answers on this device', () => {
  it('a product question: facts, sources with levels, Based on, the product with a match state', async () => {
    const r = await localAnswer('Check Saalt Menstrual Disc for me', { profile: IUD });
    expect(r?.local).toBe(true);
    expect(r.basedOn).toContain('ayna’s product record');
    expect(r.products[0].match.kind).not.toBe('signin');
    expect(Array.isArray(r.sources)).toBe(true);
    r.sources.forEach((s) => expect(s.url).toMatch(/^https:/));
  }, 60000);
  it('signed out: "what helps with" answers from the reads library; signed in it goes to the AI', async () => {
    const out = await localAnswer('What helps with heavy bleeding?', { signedIn: false });
    expect(out?.answer).toMatch(/ayna’s library/);
    expect(out.products.every((p) => p.match.kind === 'signin')).toBe(true);
    const inn = await localAnswer('What helps with heavy bleeding?', { signedIn: true });
    expect(inn).toBeNull();
  }, 60000);
  it('a match answer carries the product card and Based on', async () => {
    const r = await localAnswer('Explain my top match', { profile: IUD });
    expect(r.basedOn.join(' ')).toMatch(/match engine/);
  }, 60000);
  it('do / don’t only from a read that has an Avoid line', async () => {
    const { ARTICLES } = await import('../components/Articles.jsx');
    const wash = ARTICLES.find((a) => a.id === 'intimate-wash');
    const dd = dosAndDonts(wash);
    expect(dd.donts[0]).toMatch(/^Avoid/);
    expect(dd.dos.length).toBeGreaterThan(0);
    expect(readsOn('intimate wash', ARTICLES)[0].id).toBe('intimate-wash');
  }, 60000);
  it('AI extras: Based on lists only what was sent; no sources are made up', async () => {
    const x = await aiAnswerExtras({ followUps: [] }, { msg: 'hi', profileSent: true });
    expect(x.basedOn).toEqual(['ayna’s AI', 'your profile summary']);
    expect(x.sources).toEqual([]);
  }, 60000);
});
