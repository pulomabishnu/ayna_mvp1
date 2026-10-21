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

// Algorithm v2 (src/matching/v2.js) is off for everyone until it passes its
// release gates and clinical review. To compare on one browser: ?match=v2
// (remembered), ?match=v1 to go back.
export function matchEngine() {
    try {
        if (typeof window === 'undefined') return 'v1';
        // The native app keeps its own engine (app changes ship separately).
        if (window.Capacitor?.isNativePlatform?.() || /^\/mobile-preview/.test(window.location.pathname)) return 'v1';
        const q = new URLSearchParams(window.location.search).get('match');
        if (q === 'v2' || q === 'v1') { try { localStorage.setItem('ayna_match_engine', q); } catch { /* private mode */ } return q; }
        // v2 (evidence-graded, research-backed) is the default on the website
        // since Oct 17; ?match=v1 switches a browser back to the old engine.
        return localStorage.getItem('ayna_match_engine') === 'v1' ? 'v1' : 'v2';
    } catch { return 'v2'; }
}
