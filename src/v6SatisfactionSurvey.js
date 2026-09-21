import posthog from 'posthog-js';
import { getSupabaseClient } from './utils/supabaseClient';

// "How are you liking ayna" popup for verified users.
//   - WHEN: only after the person has opened a product card, closed it, and a couple of
//     seconds have passed since closing (see start()).
//   - HOW OFTEN: at most once a week until they submit feedback; once they have
//     (satisfaction_survey_completed_at is set) it is never shown again. Dismissing it
//     ("not now" / X) does not count as feedback, so it comes back a week later.
// The "last shown" and "completed" timestamps live in Supabase user metadata (not
// localStorage) so they follow the account across devices and survive a cleared browser.

const SHOWN_META_KEY = 'satisfaction_survey_shown_at';
const COMPLETED_META_KEY = 'satisfaction_survey_completed_at';
const REASK_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // once a week until feedback is given
const AFTER_PRODUCT_CLOSE_MS = 2500; // "a couple seconds" after the product view is closed

const REFERRAL_OPTIONS = [
  'TikTok',
  'Instagram',
  'LinkedIn',
  'Google / search',
  'Friend / word of mouth',
  'Event / conference',
  'Brand / partner',
  'Other',
];

const supabase = getSupabaseClient();
let attempted = false;

function isVerifiedUser(user) {
  if (!user) return false;
  const provider = String(user?.app_metadata?.provider || '').toLowerCase();
  return Boolean(
    user.email_confirmed_at ||
    user.phone_confirmed_at ||
    user.confirmed_at ||
    provider === 'google'
  );
}

function competingOverlayOpen() {
  return Boolean(document.querySelector('.v6-account-step, .v6-verify-backdrop, .v6-survey-backdrop, [aria-label="Finish creating your ayna account"]'));
}

async function markShown(user, meta) {
  try {
    await supabase.auth.updateUser({
      data: { ...meta, [SHOWN_META_KEY]: new Date().toISOString() },
    });
  } catch (_) {
    // Best-effort: if this fails, the survey may show again next visit.
    // Not worth blocking or retrying - it's a one-time nicety, not critical data.
  }
}

function buildSurvey(user, meta) {
  const askReferral = !meta?.heard_about_us;

  const backdrop = document.createElement('div');
  backdrop.className = 'v6-survey-backdrop';
  backdrop.innerHTML = `
    <div class="v6-survey-card" role="dialog" aria-modal="true" aria-labelledby="v6-survey-title">
      <button type="button" class="v6-survey-close" aria-label="Close">✕</button>
      <h2 id="v6-survey-title">how are you liking ayna?</h2>
      <p class="v6-survey-sub">takes ten seconds - totally optional.</p>
      <div class="v6-survey-stars" role="radiogroup" aria-label="Rate ayna from 1 to 5 stars"></div>
      <textarea class="v6-survey-textarea" maxlength="600" placeholder="anything you want to tell us? (optional)"></textarea>
      ${askReferral ? `
      <select class="v6-account-input v6-survey-select v6-survey-referral" aria-label="How did you hear about us?">
        <option value="">how did you hear about us? (optional)</option>
      </select>
      <input class="v6-account-input v6-survey-select v6-survey-referral-other" type="text" maxlength="120" placeholder="tell us where you found ayna" hidden />
      ` : ''}
      <div class="v6-survey-actions">
        <button type="button" class="v6-survey-submit" disabled>send feedback</button>
        <button type="button" class="v6-survey-skip">not now</button>
      </div>
      <p class="v6-survey-status" role="status"></p>
    </div>
  `;

  const starsHost = backdrop.querySelector('.v6-survey-stars');
  let rating = 0;
  for (let i = 1; i <= 5; i += 1) {
    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'v6-survey-star';
    star.dataset.value = String(i);
    star.setAttribute('role', 'radio');
    star.setAttribute('aria-checked', 'false');
    star.setAttribute('aria-label', `${i} star${i === 1 ? '' : 's'}`);
    star.textContent = '★';
    starsHost.appendChild(star);
  }

  const submit = backdrop.querySelector('.v6-survey-submit');
  const skip = backdrop.querySelector('.v6-survey-skip');
  const close = backdrop.querySelector('.v6-survey-close');
  const textarea = backdrop.querySelector('.v6-survey-textarea');
  const status = backdrop.querySelector('.v6-survey-status');
  const referralSelect = backdrop.querySelector('.v6-survey-referral');
  const referralOther = backdrop.querySelector('.v6-survey-referral-other');

  if (referralSelect) {
    REFERRAL_OPTIONS.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.textContent = option;
      referralSelect.appendChild(opt);
    });
    referralSelect.addEventListener('change', () => {
      const showOther = referralSelect.value === 'Other';
      referralOther.hidden = !showOther;
      if (showOther) window.setTimeout(() => referralOther.focus(), 30);
    });
  }

  const syncStars = () => {
    [...starsHost.querySelectorAll('.v6-survey-star')].forEach((star) => {
      const on = Number(star.dataset.value) <= rating;
      star.classList.toggle('is-filled', on);
      star.setAttribute('aria-checked', Number(star.dataset.value) === rating ? 'true' : 'false');
    });
    submit.disabled = rating < 1;
  };

  starsHost.addEventListener('click', (event) => {
    const star = event.target.closest('.v6-survey-star');
    if (!star) return;
    rating = Number(star.dataset.value);
    syncStars();
  });

  const dismiss = () => backdrop.remove();

  close.addEventListener('click', () => {
    posthog.capture('satisfaction_survey_dismissed', { hadInteracted: rating > 0 });
    dismiss();
  });
  skip.addEventListener('click', () => {
    posthog.capture('satisfaction_survey_dismissed', { hadInteracted: rating > 0 });
    dismiss();
  });

  submit.addEventListener('click', async () => {
    if (submit.disabled) return;
    submit.disabled = true;
    submit.textContent = 'sending…';

    const feedback = String(textarea.value || '').trim();
    const referralSource = referralSelect ? referralSelect.value : '';
    const referralOtherText = referralSelect && referralSource === 'Other'
      ? String(referralOther.value || '').trim()
      : '';
    const heardAboutUs = referralSource
      ? (referralSource === 'Other' && referralOtherText ? `Other: ${referralOtherText}` : referralSource)
      : '';

    try {
      const { data } = await supabase.auth.getUser();
      const currentMeta = data?.user?.user_metadata || meta || {};
      const { error: saveError } = await supabase.auth.updateUser({
        data: {
          ...currentMeta,
          satisfaction_rating: rating,
          satisfaction_feedback: feedback,
          satisfaction_survey_completed_at: new Date().toISOString(),
          ...(heardAboutUs ? { heard_about_us: heardAboutUs } : {}),
        },
      });
      if (saveError) throw saveError;
    } catch (_) {
      status.style.color = '#8e493f';
      status.textContent = "Couldn't save your feedback. Please try again.";
      submit.disabled = false;
      submit.textContent = 'send feedback';
      return;
    }

    try {
      posthog.capture('satisfaction_survey_submitted', {
        rating,
        hasFeedback: feedback.length > 0,
        ...(referralSource ? { referralSource } : {}),
      });
      posthog.people?.set?.({
        last_satisfaction_rating: rating,
        ...(referralSource ? { heard_about_us: referralSource } : {}),
      });
    } catch (_) {}

    status.style.color = '#4f6d50';
    status.textContent = 'thank you!';
    window.setTimeout(dismiss, 900);
  });

  document.body.append(backdrop);
  syncStars();
}

async function maybeShowSurvey() {
  if (attempted || !supabase) return;
  if (competingOverlayOpen()) return;

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (_) {
    return;
  }
  if (!user || !isVerifiedUser(user)) return;

  const meta = user.user_metadata || {};
  // Already gave feedback: never ask again.
  if (meta[COMPLETED_META_KEY]) {
    attempted = true;
    return;
  }
  // Asked within the last week (and no feedback yet): wait until a week has passed.
  const lastShown = Date.parse(meta[SHOWN_META_KEY] || '');
  if (Number.isFinite(lastShown) && Date.now() - lastShown < REASK_AFTER_MS) {
    attempted = true;
    return;
  }

  // Re-check right before committing - avoids a race where a competing
  // overlay opened while the getUser() call above was in flight.
  if (competingOverlayOpen()) return;

  attempted = true;
  await markShown(user, meta);
  buildSurvey(user, meta);
}

// The survey is only offered right after someone finishes looking at a product: a product
// page is open at /product/<slug>; once they leave it, wait a couple of seconds and, if
// they have not opened another one, ask.
function isProductViewOpen() {
  return /^\/product\//.test(window.location.pathname);
}

function start() {
  if (!supabase) return;

  let sawProduct = false;
  let closeTimer = null;
  window.setInterval(() => {
    if (isProductViewOpen()) {
      sawProduct = true;
      if (closeTimer) { window.clearTimeout(closeTimer); closeTimer = null; }
      return;
    }
    if (sawProduct && !closeTimer) {
      closeTimer = window.setTimeout(() => {
        closeTimer = null;
        sawProduct = false;
        if (!isProductViewOpen()) maybeShowSurvey();
      }, AFTER_PRODUCT_CLOSE_MS);
    }
  }, 400);

  // A new sign-in re-evaluates eligibility, but never pops the survey up by itself.
  supabase.auth.onAuthStateChange(() => { attempted = false; });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
