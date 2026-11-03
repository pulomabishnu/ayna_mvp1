import posthog from 'posthog-js';

/**
 * Where visitors drop off (founder, Nov 3: "track friction, where they drop
 * off"). Two events, kept separate from analyticsEvents.js:
 *   landing_cta_clicked  { cta, surface }                       which home-page button
 *   quiz_step_viewed     { step_id, step_number, step_total, part, surface }
 * Only names of buttons and questions, never an answer or anything about her
 * health. `platform` is added to every event in src/main.jsx.
 */
const CTAS = new Set(['sign_up_free', 'go_home', 'watch_demo', 'sign_up_free_demo', 'go_home_demo']);
const SURFACES = new Set(['web', 'app', 'mobile_web']);
const SAFE_ID = /^[a-zA-Z][a-zA-Z0-9_]{0,40}$/;

let client = posthog;
/** Tests swap the client. */
export function setFunnelClient(c) { client = c || posthog; }

export function trackLandingCta(cta, surface = 'web') {
  if (!CTAS.has(cta)) return;
  try { client.capture('landing_cta_clicked', { cta, surface: SURFACES.has(surface) ? surface : 'web' }); } catch { /* never blocks */ }
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
