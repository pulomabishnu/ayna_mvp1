// Pure helpers read from her quiz answers and the browser (no catalog data).
// Moved here unchanged from products.js, which re-exports them, so the site
// shell can use them before the catalog loads (src/data/catalog.js).

export function rawIntakeFromProfile(quizAnswers) {
    if (!quizAnswers || typeof quizAnswers !== 'object') return {};
    if (quizAnswers.fullHealthIntake && typeof quizAnswers.fullHealthIntake === 'object') {
        return quizAnswers.fullHealthIntake;
    }
    return quizAnswers;
}

export function asStringArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (value == null || value === '') return [];
    return [String(value)];
}

/**
 * Whether the user has explicitly stated a life stage (e.g. "I am
 * post-menopause"), a strong, standalone personalization signal. Callers use
 * it to decide whether Discovery should default to personalized results even
 * when no separate concerns were flagged.
 */
export function hasStatedLifeStage(quizAnswers) {
    const intake = rawIntakeFromProfile(quizAnswers);
    return asStringArray(intake?.lifeStageSelections).length > 0
        || asStringArray(intake?.lifeStage).length > 0;
}

// Which matching engine computes the "NN% match". v2 (src/matching/v2.js:
// evidence-graded fit, safety first) is the default everywhere: website,
// app (Capacitor and /mobile-preview) and server routes, since Oct 24
// (founder decision). ?match=v1 switches one browser back to the old engine
// for comparison (remembered), ?match=v2 returns to v2.
export function matchEngine() {
    try {
        if (typeof window === 'undefined') return 'v2';
        const q = new URLSearchParams(window.location.search).get('match');
        if (q === 'v2' || q === 'v1') { try { localStorage.setItem('ayna_match_engine', q); } catch { /* private mode */ } return q; }
        return localStorage.getItem('ayna_match_engine') === 'v1' ? 'v1' : 'v2';
    } catch { return 'v2'; }
}
