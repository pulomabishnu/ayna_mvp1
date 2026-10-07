import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getRecommendations, getPersonalizedProductIds, getProductMatchDetailsForProduct, getProductRelevanceScore } from './products';
import { STARTUPS } from './startups';

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
    });

    it('keeps older concern answers when a newer symptom list is also present', () => {
        const pcosProduct = { id: 'pcos-support', name: 'PCOS support', category: 'supplement', tags: ['pcos'], healthFunctions: ['pcos-management'] };
        const quiz = { frustrations: ['PCOS symptoms'], fullHealthIntake: { symptoms: ['cramps'] } };
        expect(getProductRelevanceScore(pcosProduct, quiz)).toBeGreaterThan(0);
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
