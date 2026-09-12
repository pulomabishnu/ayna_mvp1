import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, filterPrescriptionCareGate, getRecommendations, getPersonalizedProductIds, getProductRelevanceScore } from './products';

describe('getPersonalizedProductIds', () => {
    it('restricts to real positive matches, unlike getRecommendations()\'s full fallback list', () => {
        const quiz = {
            fullHealthIntake: {
                primaryConcerns: ['Cramp and pain relief (devices, supplements, heat)'],
            },
        };

        const full = getRecommendations(quiz, null);
        const personalized = getPersonalizedProductIds(quiz, null);

        // getRecommendations() keeps a broad fallback tail after the safety and
        // life-stage gates. The exact count can change with catalog safety metadata;
        // the important contract is that the hard personalized subset is smaller.
        expect(full.length).toBeGreaterThan(personalized.length);
        expect(full.every((product) => filterPrescriptionCareGate(ALL_PRODUCTS).some((candidate) => candidate.id === product.id))).toBe(true);

        // Use the current intake schema here. Every id returned by the hard
        // Personalized filter must be a genuinely positive relevance match.
        expect(personalized.length).toBeGreaterThan(0);
        expect(personalized.length).toBeLessThan(ALL_PRODUCTS.length);

        personalized.forEach((id) => {
            const product = ALL_PRODUCTS.find((candidate) => candidate.id === id);
            expect(product).toBeTruthy();
            expect(getProductRelevanceScore(product, quiz, null)).toBeGreaterThan(0);
        });
    });

    it('returns an empty set (not the whole catalog) when nothing scores', () => {
        const ids = getPersonalizedProductIds({ frustrations: [] }, null);
        expect(ids.length).toBe(0);
    });
});

describe('personalized relevance scoring', () => {
    const elitone = ALL_PRODUCTS.find((p) => p.id === 'p-elitone');
    const oura = ALL_PRODUCTS.find((p) => p.id === 'd-oura');

    it('does not treat menstrual care as urinary leakage', () => {
        expect(elitone).toBeTruthy();
        const score = getProductRelevanceScore(
            elitone,
            {
                fullHealthIntake: {
                    primaryConcerns: ['Period care (pads, tampons, cups, discs, underwear)'],
                },
            },
            null
        );
        // null means there is no positive personalized health match. Returning
        // an artificial 0 would incorrectly imply that a percentage was scored.
        expect(score).toBeNull();
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
            {
                fullHealthIntake: {
                    primaryConcerns: ['UTI support'],
                },
            },
            null
        );
        expect(score).toBeNull();
    });

    it('does not turn an age band alone into a personalized product recommendation', () => {
        expect(oura).toBeTruthy();
        expect(getProductRelevanceScore(oura, { age: '35-44', frustrations: [] }, null)).toBeNull();
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
        const partnered = { ...base, partner: true, affiliateUrl: 'affiliate-test', affiliateCommission: 99 };
        const quiz = { frustrations: ['Painful cramps'] };
        expect(getProductRelevanceScore(partnered, quiz, null))
            .toBe(getProductRelevanceScore(base, quiz, null));
    });
});
