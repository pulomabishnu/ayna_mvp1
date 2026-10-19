import { describe, it, expect } from 'vitest';
import {
    ALL_PRODUCTS, getRecommendations, getPersonalizedProductIds, getProductMatchDetailsForProduct, getProductRelevanceScore, hydrateCatalogProduct,
    getNeedMatchesForProduct, getEcosystemSeedFromQuiz, getRecommendationMatchesAndRest, getProfileMatchPercentForProduct, getProfileMatchLabelsForProduct,
    getMatchCareFlags, getEcosystemAlternatives, getRecommendationExplanation, isOffShelfProduct,
} from './products.js';
import { mapIntakeToLegacyQuizProfile } from '../utils/healthIntake';

describe('getPersonalizedProductIds', () => {
    it('restricts to real tag matches, unlike getRecommendations()\'s full fallback list', () => {
        const quiz = { frustrations: ['Painful cramps'], preference: ['Non-hormonal / hormone-free'] };

        const full = getRecommendations(quiz, null);
        const personalized = getPersonalizedProductIds(quiz, null);

        // getRecommendations() intentionally pads with every zero-score product as a
        // fallback tail (ecosystem-building always wants candidates) — so it stays
        // the full catalog. A membership filter built from it would be a near no-op.
        expect(full.length).toBeLessThanOrEqual(ALL_PRODUCTS.length);
        // Off-shelf products (sold out, discontinued, recalled per passport review)
        // are rightly missing from the fallback, so measure against the shelf-able set.
        const shelfable = ALL_PRODUCTS.filter((p) => !isOffShelfProduct(p)).length;
        expect(full.length).toBeGreaterThan(shelfable - 5);

        // getPersonalizedProductIds() must NOT carry that fallback tail — it's the
        // hard, meaningfully-restricted set a "Personalized" toggle should filter to.
        expect(personalized.length).toBeGreaterThan(0);
        expect(personalized.length).toBeLessThan(ALL_PRODUCTS.length);

        const cramp_relief_or_non_hormonal = new Set(
            ALL_PRODUCTS.filter((p) => (p.tags || []).some((t) => t === 'cramps' || t === 'non-hormonal') || (p.healthFunctions || []).includes('cramp-relief')).map((p) => p.id)
        );
        personalized.forEach((id) => {
            expect(cramp_relief_or_non_hormonal.has(id)).toBe(true);
        });
    });

    it('returns an empty set (not the whole catalog) when nothing scores', () => {
        // A profile with no frustrations mapped and no health tags has nothing to
        // score against — must not silently fall back to "everything matches".
        const ids = getPersonalizedProductIds({ frustrations: [] }, null);
        expect(ids.length).toBe(0);
    });
});

describe('personalized relevance scoring', () => {
    // The duplicate s-elitone startup listing was removed on main; the catalog
    // entry p-elitone is the same device.
    const elitone = ALL_PRODUCTS.find((p) => p.id === 'p-elitone');
    const oura = ALL_PRODUCTS.find((p) => p.id === 'd-oura');

    it('does not turn fibroid concerns into a period-product or hormone-supplement match', () => {
        const pad = ALL_PRODUCTS.find((p) => p.id === 'p-always-infinity');
        const hormoneProduct = { id: 'hormone-test', name: 'General hormone supplement', category: 'supplement', tags: ['hormone-balance'] };
        const care = ALL_PRODUCTS.find((p) => p.id === 'd-visana');
        const intake = {
            supportSelections: ['Fibroid-related concerns'],
            diagnosisSelections: ['Fibroids'],
            primaryConcerns: ['Fibroid-related concerns'],
            age: 29,
        };
        const quiz = { ...mapIntakeToLegacyQuizProfile(intake), fullHealthIntake: intake };

        expect(pad && care).toBeTruthy();
        expect(quiz.frustrations).not.toContain('Hormonal bloating');
        expect(getProductRelevanceScore(pad, quiz)).toBe(0);
        expect(getProductRelevanceScore(hormoneProduct, quiz)).toBe(0);
        expect(getProductRelevanceScore(care, quiz)).toBeGreaterThan(0);
    });

    it('labels a pad as heavy-flow support only when heavy flow was separately reported', () => {
        const pad = ALL_PRODUCTS.find((p) => p.id === 'p-always-infinity');
        const quiz = { fullHealthIntake: {
            supportSelections: ['Fibroid-related concerns', 'Heavy periods'],
            diagnosisSelections: ['Fibroids'],
            periodFlow: 'Heavy',
        } };
        const details = getProductMatchDetailsForProduct(pad, quiz);
        expect(details.percent).toBeGreaterThan(0);
        expect(details.reasons.some((reason) => /heavy|flow/i.test(reason))).toBe(true);
        expect(details.reasons.some((reason) => /fibroid/i.test(reason))).toBe(false);
    });

    it('does not infer cramps from endometriosis or hormone needs from PCOS', () => {
        const crampProduct = { id: 'cramp-only', name: 'Cramp warmer', category: 'cramp-relief', tags: ['cramps', 'cramp-relief'] };
        const hormoneProduct = { id: 'hormone-only', name: 'General hormone supplement', category: 'supplement', tags: ['hormone-balance'] };
        // Matching engine (step 2): a heat device is ADJACENT (0.30) to
        // endometriosis support per the reviewed relevance table, so it gets a
        // browse-only score (< 50, never recommended). Was 0 before. A cramp
        // need is still never inferred from the condition.
        const endo = { fullHealthIntake: { supportSelections: ['Endometriosis support'] } };
        expect(getProductRelevanceScore(crampProduct, endo)).toBeLessThan(50);
        expect(getNeedMatchesForProduct(crampProduct, endo).map((m) => m.needId)).toEqual(['condition_support.endometriosis']);
        expect(getPersonalizedProductIds(endo)).not.toContain('cramp-only');
        expect(getProductRelevanceScore(hormoneProduct, { fullHealthIntake: { supportSelections: ['PCOS support'] } })).toBe(0);
    });

    it('does not recommend chasteberry for cramps or PCOS from unsupported catalog tags', () => {
        const vitex = ALL_PRODUCTS.find((product) => product.id === 'p-vitex');
        expect(vitex).toBeTruthy();
        expect(getProductRelevanceScore(vitex, { fullHealthIntake: { supportSelections: ['Cramps or period pain'] } })).toBe(0);
        expect(getProductRelevanceScore(vitex, { fullHealthIntake: { supportSelections: ['PCOS support'] } })).toBe(0);
        const pmsMatch = getProductRelevanceScore(vitex, { fullHealthIntake: { supportSelections: ['PMS symptoms'] } });
        expect(pmsMatch).toBeGreaterThan(0);
        expect(pmsMatch).toBeLessThan(60);
    });

    it('does not match evening primrose oil to PCOS, cramps, or bloating', () => {
        const primrose = ALL_PRODUCTS.find((product) => product.id === 'p-evening-primrose');
        expect(primrose).toBeTruthy();
        for (const concern of ['PCOS support', 'Cramps or period pain', 'Hormonal bloating']) {
            expect(getProductRelevanceScore(primrose, { fullHealthIntake: { supportSelections: [concern] } })).toBe(0);
        }
    });

    it('does not treat PCOS alone as a reason to recommend bloat herbs or high-dose vitamin D', () => {
        const pcosOnly = { fullHealthIntake: { supportSelections: ['PCOS support'], diagnosisSelections: ['PCOS'] } };
        // p-pink-stork-bloat left the catalog on 2026-10-13 (discontinued).
        for (const id of ['p-love-wellness-bloat', 'p-natures-bounty-d3-125mcg', 'p-zinc', 'd-ovia', 'd-glow', 'd-natural-cycles', 'd-initio', 'p-proov-complete']) {
            const product = ALL_PRODUCTS.find((entry) => entry.id === id);
            expect(product, id).toBeTruthy();
            expect(getProductRelevanceScore(product, pcosOnly), id).toBe(0);
        }
    });

    it('keeps preliminary PCOS supplements below a strong-match claim', () => {
        const pcosOnly = { fullHealthIntake: { supportSelections: ['PCOS support'], diagnosisSelections: ['PCOS'] } };
        for (const id of ['p-inositol-wholesome', 'p-spearmint-pcos']) {
            const product = ALL_PRODUCTS.find((entry) => entry.id === id);
            const match = getProductMatchDetailsForProduct(product, pcosOnly);
            expect(match.percent, id).toBeGreaterThan(0);
            expect(match.percent, id).toBeLessThan(60);
            expect(match.unknowns.some((note) => /evidence.*limited/i.test(note)), id).toBe(true);
        }
    });

    it('does not treat menstrual leaks and staining as urinary leakage', () => {
        expect(elitone).toBeTruthy();

        const score = getProductRelevanceScore(
            elitone,
            { frustrations: ['Leaks & staining'] },
            null
        );

        expect(score).toBe(0);
    });

    it('scores a urinary-incontinence need only for a relevant eligible product', () => {
        const product = { id: 'bladder-device', name: 'Bladder trainer', category: 'pelvic-floor', tags: ['bladder-leaks'], healthFunctions: ['bladder-leak-protection'] };
        expect(getProductRelevanceScore(product, { frustrations: ['Urinary incontinence'] })).toBeGreaterThan(0);
        expect(getProductRelevanceScore(product, { frustrations: ['Recurrent UTIs'] })).toBe(0);
    });

    it('does not treat a UTI as urinary incontinence', () => {
        expect(elitone).toBeTruthy();

        const score = getProductRelevanceScore(
            elitone,
            { frustrations: ['Recurrent UTIs'] },
            null
        );

        expect(score).toBe(0);
    });

    it('does not invent an age fit when a product has no stated age range', () => {
        expect(oura).toBeTruthy();
        expect(getProductRelevanceScore(oura, { age: 38, frustrations: [] })).toBe(0);
    });

    it('returns a 0–100 number for every catalog product after meaningful intake', () => {
        const quiz = { fullHealthIntake: { supportSelections: ['Cramps or period pain', 'PCOS symptoms'], lifeStageSelections: ['I get periods regularly'], age: 27, priceRange: ['Under $25'] } };
        ALL_PRODUCTS.forEach((product) => {
            const { percent } = getProductMatchDetailsForProduct(product, quiz);
            expect(Number.isInteger(percent)).toBe(true);
            expect(percent).toBeGreaterThanOrEqual(0);
            expect(percent).toBeLessThanOrEqual(100);
        });
    });

    it('scores each selected need separately; the shown percent is the best need', () => {
        // Founder spec (score per need): Product x Cramps 94, x Acne 12 ...,
        // not one blended number. Before step 2 the percent was averaged over
        // every selected need (oneNeed > twoNeeds); now an unrelated second
        // need neither lowers nor raises the cramp score, and the per-need
        // breakdown shows the 0 for UTIs.
        const product = { id: 'cramp-test', name: 'Cramp warmer', category: 'cramp-relief', tags: ['cramps'], healthFunctions: ['cramp-relief'] };
        const oneNeed = getProductRelevanceScore(product, { fullHealthIntake: { supportSelections: ['Cramps or period pain'] } });
        const twoNeeds = getProductRelevanceScore(product, { fullHealthIntake: { supportSelections: ['Cramps or period pain', 'Recurrent UTIs'] } });
        expect(oneNeed).toBe(twoNeeds);
        expect(twoNeeds).toBeGreaterThan(0);
        const perNeed = getNeedMatchesForProduct(product, { fullHealthIntake: { supportSelections: ['Cramps or period pain', 'Recurrent UTIs'] } });
        expect(perNeed[0]).toMatchObject({ needId: 'pain.menstrual_cramp', score: oneNeed });
        expect(perNeed.find((m) => m.needId === 'urinary.recurrent_uti')).toMatchObject({ score: 0, relevant: false });
        expect(getProductMatchDetailsForProduct(product, { fullHealthIntake: { supportSelections: ['Cramps or period pain', 'Recurrent UTIs'] } }).unmetNeeds).toContain('Recurrent UTIs');
    });

    it('a broad profile neither lowers nor inflates a real match, and confidence stays separate', () => {
        // ASK2 (spec C): the old test asserted < 85 because sparse profiles
        // used to drag every match down. Missing data must never equal a bad
        // match: the cramp warmer matches cramps as well as it did for a
        // one-need profile, and what we do not know shows up as confidence.
        const product = { id: 'cramp-support', name: 'Cramp warmer', category: 'cramp-relief', tags: ['cramps'], healthFunctions: ['cramp-relief'] };
        const quiz = { fullHealthIntake: { supportSelections: [
            'Cramps or period pain', 'Sleep support', 'Skin or acne concerns',
            'Fertility support', 'Bladder leakage', 'Hair thinning',
        ] } };
        const match = getProductMatchDetailsForProduct(product, quiz);
        const single = getProductMatchDetailsForProduct(product, { fullHealthIntake: { supportSelections: ['Cramps or period pain'] } });
        expect(match.percent).toBeGreaterThan(0);
        expect(match.percent).toBe(single.percent);
        expect(match.confidence).not.toBe('high');
        expect(match.reasons.some((reason) => /cramp/i.test(reason))).toBe(true);
    });

    it('keeps older concern answers when a newer symptom list is also present', () => {
        const pcosProduct = { id: 'pcos-support', name: 'PCOS support', category: 'supplement', tags: ['pcos'], healthFunctions: ['pcos-management'] };
        const quiz = { frustrations: ['PCOS symptoms'], fullHealthIntake: { symptoms: ['cramps'] } };
        expect(getProductRelevanceScore(pcosProduct, quiz)).toBeGreaterThan(0);
    });

    it('restores health tags for older saved Ecosystem products before scoring them', () => {
        const savedProduct = { id: 'p-spearmint-pcos', name: 'Traditional Medicinals Organic Spearmint Tea', category: 'supplement' };
        const quiz = { fullHealthIntake: { supportSelections: ['PCOS support'], age: 27 } };
        expect(savedProduct.tags).toBeUndefined();
        expect(hydrateCatalogProduct(savedProduct).tags).toContain('pcos');
        expect(getProductRelevanceScore(savedProduct, quiz)).toBeGreaterThan(0);
    });

    it('does not let evidence alone change a personal match', () => {
        // ASK2: evidence is a separate output; it only counts in the match
        // when she ranked what she trusts, and never creates relevance.
        const product = { id: 'single-need', name: 'Cramp warmer', category: 'cramp-relief', tags: ['cramps'], healthFunctions: ['cramp-relief'], scientificCitations: Array(8).fill('source') };
        const plain = { id: 'single-need-2', name: 'Cramp warmer', category: 'cramp-relief', tags: ['cramps'], healthFunctions: ['cramp-relief'] };
        const details = getProductMatchDetailsForProduct(product, { frustrations: ['Painful cramps'] });
        expect(details.percent).toBe(getProductMatchDetailsForProduct(plain, { frustrations: ['Painful cramps'] }).percent);
        const unrelated = { ...product, id: 'evidence-only', name: 'Plain notebook', category: 'other', tags: [], healthFunctions: [] };
        expect(getProductMatchDetailsForProduct(unrelated, { frustrations: ['Painful cramps'] }).percent).toBe(0);
    });

    it('honors a negative product history from the current intake wording', () => {
        const product = { id: 'history-test', name: 'Cramp warmer', category: 'cramp-relief', tags: ['cramps'] };
        const details = getProductMatchDetailsForProduct(product, { fullHealthIntake: { supportSelections: ['Cramps or period pain'], productHistory: [{ name: 'Cramp warmer', worked: 'Made things worse' }] } });
        expect(details.percent).toBe(0);
        expect(details.matchStatus).toBe('excluded');
    });

    it('does not promote high-dose iron for unrelated needs or fatigue alone', () => {
        const iron = ALL_PRODUCTS.find((product) => product.id === 'p-nature-made-iron-65mg');
        expect(iron).toBeTruthy();
        const unrelated = getProductMatchDetailsForProduct(iron, { fullHealthIntake: { supportSelections: ['PCOS support', 'Cramps or period pain', 'Fatigue or low energy'] } });
        expect(unrelated.percent).toBe(0);
        expect(unrelated.matchStatus).toBe('excluded');
        const diagnosed = getProductMatchDetailsForProduct(iron, { fullHealthIntake: { supportSelections: ['Fatigue or low energy'], diagnosisSelections: ['Anemia or iron deficiency'] } });
        expect(diagnosed.percent).toBeGreaterThan(0);
    });

    it('returns no personalized percentage when there are no personalization signals', () => {
        expect(oura).toBeTruthy();
        expect(getProductRelevanceScore(oura, {}, null)).toBeNull();
    });

    it('does not let partnership or affiliate metadata change relevance', () => {
        const base = {
            id: 'test-product',
            name: 'Test Product',
            tags: ['cramps'],
            healthFunctions: ['cramp-relief'],
            category: 'cramp-relief',
        };

        const partnered = {
            ...base,
            partner: true,
            affiliateUrl: 'affiliate-test',
            affiliateCommission: 99,
        };

        const quiz = { frustrations: ['Painful cramps'] };

        expect(getProductRelevanceScore(partnered, quiz, null))
            .toBe(getProductRelevanceScore(base, quiz, null));
    });
});

// ─── Matching engine integration (step 2) ───────────────────────────────────
describe('matching engine integration', () => {
    const byId = (id) => ALL_PRODUCTS.find((p) => p.id === id);
    const spec = { fullHealthIntake: {
        supportSelections: ['Cramps or period pain', 'Acne', 'Anxiety', 'Vaginal dryness'],
        lifeStageSelections: ['I get periods regularly'], age: '27',
    } };

    it('shows the best per-need score and keeps the per-need breakdown (founder spec example)', () => {
        const heat = byId('p-thermacare');
        const perNeed = getNeedMatchesForProduct(heat, spec);
        expect(perNeed.map((m) => m.needId)).toEqual(expect.arrayContaining(['pain.menstrual_cramp', 'skin.acne', 'mood.general_anxiety', 'vaginal.dryness']));
        const cramps = perNeed.find((m) => m.needId === 'pain.menstrual_cramp');
        expect(cramps.score).toBeGreaterThanOrEqual(80);
        expect(perNeed.find((m) => m.needId === 'mood.general_anxiety').score).toBe(0);
        expect(getProfileMatchPercentForProduct(heat, spec)).toBe(cramps.score);
        expect(getProfileMatchLabelsForProduct(heat, spec)[0]).toBe('Matches the period cramps you selected');
        for (const m of perNeed) {
            expect(m).toEqual(expect.objectContaining({ needId: expect.any(String), label: expect.any(String), score: expect.any(Number), tier: expect.any(String), explanations: expect.any(Array), confidence: expect.any(Number) }));
            expect(m.safety).toEqual(expect.objectContaining({ eligible: true }));
        }
    });

    it('only recommends products at the exploratory bar (50) or above', () => {
        const { matches } = getRecommendationMatchesAndRest(spec);
        expect(matches.length).toBeGreaterThan(0);
        for (const p of matches) expect(getProfileMatchPercentForProduct(p, spec), p.id).toBeGreaterThanOrEqual(50);
        const percents = matches.map((p) => getProfileMatchPercentForProduct(p, spec));
        for (let i = 1; i < percents.length; i += 1) expect(percents[i]).toBeLessThanOrEqual(percents[i - 1] + 2);
    });

    it('builds one ecosystem shelf per need; picks per need controls quantity, never quality', () => {
        const seed = getEcosystemSeedFromQuiz({ fullHealthIntake: { ...spec.fullHealthIntake, recommendedProductsPerArea: 2 } });
        expect(seed.shelves.map((s) => s.needId)).toEqual(['pain.menstrual_cramp', 'skin.acne', 'mood.general_anxiety', 'vaginal.dryness']);
        for (const shelf of seed.shelves) {
            expect(shelf.picks.length).toBeLessThanOrEqual(2);
            shelf.picks.forEach((pick) => expect(pick.score).toBeGreaterThanOrEqual(50));
        }
        expect(seed.seedMeta.shelves).toBe(seed.shelves);
        expect(Object.keys(seed.seedMeta)).toEqual(Object.keys(seed.mergedProducts));
        const [firstId] = Object.keys(seed.seedMeta);
        expect(seed.seedMeta[firstId]).toEqual(expect.objectContaining({ needId: 'pain.menstrual_cramp', tag: 'pain.menstrual_cramp', frustration: 'Cramps or period pain' }));
        // Alternatives stay on the same need and above the bar.
        const alts = getEcosystemAlternatives(firstId, seed.seedMeta[firstId].tag, { fullHealthIntake: spec.fullHealthIntake });
        expect(alts.length).toBeGreaterThan(0);
        alts.forEach((p) => {
            expect(p.id).not.toBe(firstId);
            expect(getNeedMatchesForProduct(p, spec).find((m) => m.needId === 'pain.menstrual_cramp').score).toBeGreaterThanOrEqual(50);
        });
    });

    it('returns a shorter shelf rather than lowering the bar', () => {
        const seed = getEcosystemSeedFromQuiz({ fullHealthIntake: { supportSelections: ['Joint aches'], recommendedProductsPerArea: 5 } });
        const shelf = seed.shelves[0];
        expect(shelf.picks.length).toBeLessThan(5);
        expect(shelf.shortBy).toBe(5 - shelf.picks.length);
        shelf.picks.forEach((pick) => expect(pick.score).toBeGreaterThanOrEqual(50));
    });

    it('hard-excludes the avoid list (product and brand) with percent 0 and a reason', () => {
        const thermacare = byId('p-thermacare');
        const quiz = { fullHealthIntake: { supportSelections: ['Cramps or period pain'], avoidRepeat: [thermacare.name] } };
        const d = getProductMatchDetailsForProduct(thermacare, quiz);
        expect(d).toEqual(expect.objectContaining({ percent: 0, matchStatus: 'excluded', eligible: false }));
        expect(d.excludedBecause[0]).toMatch(/avoid/i);
        expect(getRecommendations(quiz)).not.toContainEqual(expect.objectContaining({ id: 'p-thermacare' }));
        expect(Object.keys(getEcosystemSeedFromQuiz(quiz).mergedProducts)).not.toContain('p-thermacare');
        expect(getRecommendationExplanation(thermacare, quiz).whyItWorks).toBeNull();
    });

    it('hard-excludes a serious reaction and a clinician-stopped product', () => {
        const thermacare = byId('p-thermacare');
        for (const history of [{ name: thermacare.name, reaction: 'Serious' }, { name: thermacare.name, stopReasons: ['A clinician recommended stopping it'] }]) {
            const quiz = { fullHealthIntake: { supportSelections: ['Cramps or period pain'], productHistory: [history] } };
            expect(getProductRelevanceScore(thermacare, quiz)).toBe(0);
            expect(getPersonalizedProductIds(quiz)).not.toContain('p-thermacare');
        }
    });

    it('maps behavior: "Not for me" hard-suppresses, saved is a small positive, in-ecosystem counts as owned', () => {
        const quiz = { fullHealthIntake: { supportSelections: ['Cramps or period pain'] } };
        const base = getProfileMatchPercentForProduct(byId('p-thermacare'), quiz);
        const omitted = getProductMatchDetailsForProduct(byId('p-thermacare'), quiz, null, { behavior: { omitted: { 'p-thermacare': true } } });
        expect(omitted).toEqual(expect.objectContaining({ percent: 0, matchStatus: 'excluded' }));
        expect(getPersonalizedProductIds(quiz, null, { behavior: { omitted: ['p-thermacare'] } })).not.toContain('p-thermacare');
        const saved = getProfileMatchPercentForProduct(byId('p-thermacare'), quiz, null, { behavior: { saved: ['p-thermacare'] } });
        expect(saved).toBeGreaterThan(base);
        expect(saved - base).toBeLessThanOrEqual(3);
        const owned = getProductMatchDetailsForProduct(byId('p-thermacare'), quiz, null, { behavior: { inEcosystem: { 'p-thermacare': {} } } });
        expect(owned.owned).toBe(true);
    });

    it('excludes high-dose iron unless iron deficiency is confirmed', () => {
        const iron = byId('p-nature-made-iron-65mg');
        expect(getProductMatchDetailsForProduct(iron, { fullHealthIntake: { supportSelections: ['Fatigue or low energy'] } }).excludedBecause[0]).toMatch(/iron deficiency is confirmed/);
        expect(getProductRelevanceScore(iron, {})).toBeNull();
    });

    it('exposes care flags: urgent yes = care first, UTI right now, pregnancy notes', () => {
        const urgent = getMatchCareFlags({ fullHealthIntake: { supportSelections: ['Pelvic pain'], safetyConcern: 'Yes' } });
        expect(urgent).toEqual(expect.objectContaining({ careFirst: true, careProminent: true }));
        const uti = { fullHealthIntake: { supportSelections: ['Recurrent UTI-like symptoms'], utiFrequency: 'I am experiencing them right now' } };
        expect(getMatchCareFlags(uti)).toEqual(expect.objectContaining({ utiRightNow: true, careProminent: true }));
        const dmannose = getProductMatchDetailsForProduct(byId('p-d-mannose-now'), uti);
        expect(dmannose.considerations[0].text).toMatch(/Not a substitute for getting checked/);
        const pregnant = getMatchCareFlags({ fullHealthIntake: { lifeStageSelections: ['I am pregnant'], supportSelections: ['Prenatal or pregnancy support'] } });
        expect(pregnant.notes.map((n) => n.code)).toContain('pregnancy_unknown');
        const seed = getEcosystemSeedFromQuiz({ fullHealthIntake: { supportSelections: ['Pelvic pain'], safetyConcern: 'Yes' } });
        expect(seed.careFirst).toBe(true);
    });

    it('reads older saved profiles (frustrations only) as specific needs', () => {
        const seed = getEcosystemSeedFromQuiz({ frustrations: ['Painful cramps', 'Recurrent UTIs', 'General discomfort'] });
        expect(seed.shelves.map((s) => s.needId)).toEqual(['pain.menstrual_cramp', 'urinary.recurrent_uti']);
    });

    it('uses imported health data as context, never as a new need', () => {
        const quiz = { fullHealthIntake: { supportSelections: ['Fatigue or low energy'] } };
        const iron = byId('p-nature-made-iron-65mg');
        expect(getProductMatchDetailsForProduct(iron, quiz, { conditions: ['Iron deficiency anemia'] }).eligible).toBe(true);
        expect(getPersonalizedProductIds({}, { conditions: ['PCOS'] })).toEqual([]);
    });
});

// ─── ASK2 adapters ──────────────────────────────────────────────────────────
describe('ASK2 adapters', () => {
    const byId = (id) => ALL_PRODUCTS.find((p) => p.id === id);

    it('opts.needId focuses the percent on that need (shelf badges never name another need)', () => {
        const quiz = { fullHealthIntake: { supportSelections: ['Cramps or period pain', 'Pelvic pain'] } };
        const heat = byId('p-thermacare');
        const best = getProductMatchDetailsForProduct(heat, quiz);
        const pelvic = getProductMatchDetailsForProduct(heat, quiz, null, { needId: 'pain.pelvic' });
        expect(best.needId).toBe('pain.menstrual_cramp');
        expect(pelvic.needId).toBe('pain.pelvic');
        expect(pelvic.percent).toBeLessThan(best.percent);
        expect(getProductMatchDetailsForProduct(heat, quiz).needId).toBe('pain.menstrual_cramp');
    });

    it('a restricted product keeps its percent but is never recommended', () => {
        const quiz = { fullHealthIntake: { supportSelections: ['Cramps or period pain'] } };
        const mag = byId('p-magnesium-glycinate');
        const d = getProductMatchDetailsForProduct(mag, quiz);
        expect(d.eligibility).toBe('restricted');
        expect(d.percent).toBeGreaterThan(0);
        expect(d.missingSafetyText.join(' ')).toMatch(/medicines/);
        expect(d.considerations[0].text).toMatch(/Safety not checked yet/);
        expect(getPersonalizedProductIds(quiz)).not.toContain('p-magnesium-glycinate');
        const answered = { fullHealthIntake: { supportSelections: ['Cramps or period pain'], takesCurrent: 'No' } };
        expect(getProductMatchDetailsForProduct(mag, answered).eligibility).toBe('eligible');
        expect(getProductMatchDetailsForProduct(mag, answered).percent).toBe(d.percent);
    });

    it('details list the actual inputs used and a soft hint when confidence is limited', () => {
        const quiz = { fullHealthIntake: { supportSelections: ['Night sweats'], lifeStageSelections: ['I am in perimenopause'], preferredFormats: ['Devices or wearables'] } };
        const d = getProductMatchDetailsForProduct(byId('d-eight-sleep'), quiz);
        expect(d.basedOn.map((b) => b.text)).toEqual(expect.arrayContaining(['Night sweats (you selected)', 'Perimenopause (you shared)']));
        expect(d.reasons[0]).toBe('Matches your night sweats and the perimenopause stage you shared');
        expect(d.profileHint).toBe('Add more to your health profile for more personal picks');
    });

    it('night sweats at 24 with regular periods: no menopause product is personalized', () => {
        const quiz = { fullHealthIntake: { age: '24', supportSelections: ['Night sweats'], lifeStageSelections: ['I get periods regularly'] } };
        const ids = getPersonalizedProductIds(quiz);
        for (const id of ['p-womaness-me', 'd-midi-health', 'p-gennev-care', 'p-remifemin', 'p-estroven-mood']) expect(ids).not.toContain(id);
        const seed = getEcosystemSeedFromQuiz(quiz);
        expect(seed.shelves[0].needId).toBe('vasomotor.night_sweats');
        expect(seed.shelves[0].picks.every((p) => !['p-womaness-me', 'd-midi-health'].includes(p.productId))).toBe(true);
    });

    it('old stored need ids still resolve for alternatives', () => {
        const quiz = { fullHealthIntake: { supportSelections: ['Night sweats'], lifeStageSelections: ['I am in perimenopause'] } };
        const alts = getEcosystemAlternatives('d-eight-sleep', 'menopause.night_sweats', quiz);
        expect(alts.length).toBeGreaterThan(0);
    });

    it('check-in picks never infer menopause or irregular cycles from tracker use', async () => {
        const { getCheckinRecommendations } = await import('./products.js');
        const recs = getCheckinRecommendations({ frustrations: [] }, { focusAreas: [] }, [{ date: '2026-10-01' }], [{ symptoms: ['hot flashes'] }]);
        expect(recs).toEqual([]);
    });
});

describe('postmenopausal profile regression', () => {
    // Ported from main's recommendation-formula tests. The matching engine
    // keeps the full catalog as a browse tail in getRecommendations(), so the
    // "trackers absent from the tail" check does not apply here; the
    // personalized set must still never infer these needs from life stage.
    const quiz = { fullHealthIntake: {
        age: '60+', lifeStageSelections: ['I am post-menopause'], takesCurrent: 'No',
        supportSelections: ['Strength and maintaining muscle', 'Bone health', 'Sleep', 'GLP-1 medication side effects and nausea'],
        supportOtherText: 'Chronic pain / CRPS',
    } };
    it('does not infer intimate, bladder, hot-flash or hormone-testing needs from life stage alone', () => {
        const ids = getPersonalizedProductIds(quiz);
        for (const id of ['p-proov-empower', 'p-elitone', 'p-elitone-urge', 'p-kindra-lotion', 'p-oboo-woosh-warming-wand', 'p-remifemin', 'p-estroven-mood', 'p-poise-ultra-thin-moderate']) expect(ids, id).not.toContain(id);
        expect(ids).toContain('p-citracal-bone-health');
    });
    it('does not interpret medication nausea as hormone imbalance or select high-dose nutrients for sleep', () => {
        const ids = getPersonalizedProductIds(quiz);
        for (const id of ['p-vitex', 'p-inositol-wholesome', 'p-flo-gummies', 'p-nature-made-iron-65mg', 'p-natures-bounty-d3-125mcg']) expect(ids, id).not.toContain(id);
    });
    it('never personalizes period or fertility trackers for a postmenopausal profile', () => {
        const ids = getPersonalizedProductIds(quiz);
        for (const id of ['d-clue', 'd-stardust', 'd-glow', 'd-inito']) expect(ids, id).not.toContain(id);
    });
});
