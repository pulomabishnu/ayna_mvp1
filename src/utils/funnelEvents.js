import posthog from 'posthog-js';
import { countJourneyStep } from './journeyStep.js';

/**
 * Where visitors drop off (founder, Nov 3: "track friction, where they drop
 * off"). Two events, kept separate from analyticsEvents.js:
 *   landing_cta_clicked  { cta, surface, copy? }                which home-page button (and its words)
 *   quiz_step_viewed     { step_id, step_number, step_total, part, surface }
 * Only names of buttons and questions, never an answer or anything about her
 * health. `platform` is added to every event in src/main.jsx.
 */
const CTAS = new Set(['start_quiz', 'start_quiz_demo', 'start_quiz_end', 'start_quiz_nav', 'sign_up_free', 'go_home', 'watch_demo', 'sign_up_free_demo', 'go_home_demo', 'go_home_end', 'finish_quiz']);

/**
 * The main button's words (Nov 3 research: first person, says what you get, says free).
 * Default "Get my free matches". A PostHog multivariate flag `landing-cta-copy` can
 * switch a share of visitors to "Sign up free" to compare; `copy` is sent with each click.
 */
export const CTA_COPY = { get_my_free_matches: 'Get my free matches', sign_up_free: 'Take the quiz' };
export function landingCtaCopy() {
  try {
    const v = client.getFeatureFlag?.('landing-cta-copy');
    if (typeof v === 'string' && CTA_COPY[v]) return v;
  } catch { /* flags not loaded */ }
  return 'sign_up_free'; // Nov 12: the header button says "Take the quiz" (the hero says "Take the 1-minute quiz"); same event key
}
const SURFACES = new Set(['web', 'app', 'mobile_web']);
const SAFE_ID = /^[a-zA-Z][a-zA-Z0-9_]{0,40}$/;

let client = posthog;
/** Tests swap the client. */
export function setFunnelClient(c) { client = c || posthog; }

export function trackLandingCta(cta, surface = 'web', copy = null) {
  if (!CTAS.has(cta)) return;
  // The main "Sign up free" button also feeds the anonymous journey counter
  // (journeyStep.js), which runs before a consent choice; this event doesn't.
  if (cta === 'sign_up_free') countJourneyStep('sign_up_free_clicked');
  try { client.capture('landing_cta_clicked', { cta, surface: SURFACES.has(surface) ? surface : 'web', ...(CTA_COPY[copy] ? { copy } : {}) }); } catch { /* never blocks */ }
}

const lastStep = { key: '' };
export function trackQuizStep({ stepId, number, total, part = 'core', surface = 'web' }) {
  if (!SAFE_ID.test(String(stepId || ''))) return;
  const key = `${surface}:${part}:${stepId}`;
  if (lastStep.key === key) return; // a re-render isn't a new view
  lastStep.key = key;
  try {
    client.capture('quiz_step_viewed', {
      step_id: stepId,
      step_number: Number.isFinite(number) ? number : null,
      step_total: Number.isFinite(total) ? total : null,
      part: part === 'more' ? 'more' : 'core',
      surface: SURFACES.has(surface) ? surface : 'web',
    });
  } catch { /* never blocks */ }
}
