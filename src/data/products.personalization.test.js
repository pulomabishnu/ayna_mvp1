import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getRecommendations, getPersonalizedProductIds, getProductMatchDetailsForProduct, getProductRelevanceScore, hydrateCatalogProduct } from './products';
import { STARTUPS } from './startups';
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
        expect(full.length).toBeGreaterThan(ALL_PRODUCTS.length - 5);

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
    const elitone = STARTUPS.find((p) => p.id === 's-elitone');
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
        expect(getProductRelevanceScore(crampProduct, { fullHealthIntake: { supportSelections: ['Endometriosis support'] } })).toBe(0);
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
        for (const id of ['p-pink-stork-bloat', 'p-love-wellness-bloat', 'p-natures-bounty-d3-125mcg', 'p-zinc', 'd-ovia', 'd-glow', 'd-natural-cycles', 'd-initio', 'p-proov-complete']) {
            const product = ALL_PRODUCTS.find((entry) => entry.id === id);
            expect(product, id).toBeTruthy();
            expect(getProductRelevanceScore(product, pcosOnly), id).toBe(0);
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

    it('uses all selected needs instead of treating one matched need as a full match', () => {
        const product = { id: 'cramp-test', name: 'Cramp warmer', category: 'cramp-relief', tags: ['cramps'], healthFunctions: ['cramp-relief'] };
        const oneNeed = getProductRelevanceScore(product, { fullHealthIntake: { supportSelections: ['Cramps or period pain'] } });
        const twoNeeds = getProductRelevanceScore(product, { fullHealthIntake: { supportSelections: ['Cramps or period pain', 'Recurrent UTIs'] } });
        expect(oneNeed).toBeGreaterThan(twoNeeds);
        expect(twoNeeds).toBeGreaterThan(0);
        expect(getProductMatchDetailsForProduct(product, { fullHealthIntake: { supportSelections: ['Cramps or period pain', 'Recurrent UTIs'] } }).unmetNeeds).toContain('Recurrent UTIs');
    });

    it('keeps a broad-profile percentage conservative while explaining a real match', () => {
        const product = { id: 'cramp-support', name: 'Cramp warmer', category: 'cramp-relief', tags: ['cramps'], healthFunctions: ['cramp-relief'] };
        const quiz = { fullHealthIntake: { supportSelections: [
            'Cramps or period pain', 'Sleep support', 'Skin or acne concerns',
            'Fertility support', 'Bladder leakage', 'Hair thinning',
        ] } };
        const match = getProductMatchDetailsForProduct(product, quiz);
        expect(match.percent).toBeGreaterThan(0);
        expect(match.percent).toBeLessThan(85);
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

    it('does not let evidence alone claim a strong personal match', () => {
        const product = { id: 'single-need', name: 'Cramp warmer', category: 'cramp-relief', tags: ['cramps'], healthFunctions: ['cramp-relief'], scientificCitations: Array(8).fill('source') };
        const details = getProductMatchDetailsForProduct(product, { frustrations: ['Painful cramps'] });
        expect(details.percent).toBeLessThanOrEqual(85);
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
