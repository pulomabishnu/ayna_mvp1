import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getRecommendations, getPersonalizedProductIds, getProductRelevanceScore } from './products';
import { STARTUPS } from './startups';

describe('getPersonalizedProductIds', () => {
    it('restricts to real tag matches, unlike getRecommendations()\'s full fallback list', () => {
        const quiz = { frustrations: ['Painful cramps'], preference: ['Non-hormonal / hormone-free'] };

        const full = getRecommendations(quiz, null);
        const personalized = getPersonalizedProductIds(quiz, null);

        // getRecommendations() intentionally pads with every zero-score product as a
        // fallback tail (ecosystem-building always wants candidates) — so it stays
        // the full catalog. A membership filter built from it would be a near no-op.
        expect(full.length).toBe(ALL_PRODUCTS.length);

        // getPersonalizedProductIds() must NOT carry that fallback tail — it's the
        // hard, meaningfully-restricted set a "Personalized" toggle should filter to.
        expect(personalized.length).toBeGreaterThan(0);
        expect(personalized.length).toBeLessThan(ALL_PRODUCTS.length);

        const cramp_relief_or_non_hormonal = new Set(
            ALL_PRODUCTS.filter((p) => (p.tags || []).some((t) => t === 'cramps' || t === 'non-hormonal')).map((p) => p.id)
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

    it('raises Elitone relevance for an imported urinary-incontinence signal', () => {
        expect(elitone).toBeTruthy();

        const score = getProductRelevanceScore(
            elitone,
            { frustrations: [] },
            {
                conditions: ['Urinary incontinence'],
                medications: [],
                allergies: [],
                notes: 'Bladder leaks',
                intakeSummary: '',
                fhirSummary: { conditions: [], medications: [] },
                wearableSummary: '',
            }
        );

        expect(score).toBeGreaterThan(0);
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

    it('can give a modest contextual score from age and life stage without pretending it is a direct need', () => {
        expect(oura).toBeTruthy();

        const score = getProductRelevanceScore(
            oura,
            { age: '35-44', frustrations: [] },
            null
        );

        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThan(50);
        expect([0, 50, 100]).not.toContain(score);
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

