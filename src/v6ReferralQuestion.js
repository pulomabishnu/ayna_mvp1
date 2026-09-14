import './v6ReferralQuestion.css';
import { getSupabaseClient } from './utils/supabaseClient';

const NAME_KEY = 'ayna_v6_first_name';
const DRAFT_KEY = 'ayna_intake_redesign_draft_v1';
const REFERRAL_KEY = 'ayna_v6_referral_source';
const REFERRAL_OTHER_KEY = 'ayna_v6_referral_source_other';
const REFERRAL_SKIPPED_KEY = 'ayna_v6_referral_skipped';

const OPTIONS = [
  'TikTok',
  'Instagram',
  'LinkedIn',
  'Google / search',
  'Friend / word of mouth',
  'Event / conference',
  'Brand / partner',
  'Other',
];

let active = false;
let bypassNextFinish = false;
let syncing = false;

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function firstName() {
  try { return clean(window.sessionStorage.getItem(NAME_KEY)); } catch { return ''; }
}

function readStored(key) {
  try { return clean(window.sessionStorage.getItem(key) || window.localStorage.getItem(key)); } catch { return ''; }
}

function writeStored(key, value) {
  try {
    if (value) {
      window.sessionStorage.setItem(key, value);
      window.localStorage.setItem(key, value);
    } else {
      window.sessionStorage.removeItem(key);
      window.localStorage.removeItem(key);
    }
  } catch {}
}

function updateDraft(source, other = '') {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    draft.intake = { ...(draft?.intake || {}), referralSource: source, referralSourceOther: other };
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {}
}

function finalReferralValue() {
  const source = readStored(REFERRAL_KEY);
  const other = readStored(REFERRAL_OTHER_KEY);
  if (!source) return '';
  return source === 'Other' && other ? `Other: ${other}` : source;
}

async function syncReferralToUser() {
  if (syncing) return;
  const value = finalReferralValue();
  if (!value) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;
  syncing = true;
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return;
    if (clean(user?.user_metadata?.heard_about_us) === value) return;
    await supabase.auth.updateUser({ data: { heard_about_us: value } });
  } catch {
    // Referral attribution is non-critical. Keep it locally and retry after auth changes.
  } finally {
    syncing = false;
  }
}

function nativeLastQuestion() {
  const question = document.querySelector('.ayna-intake-question');
  if (!question) return null;
  const heading = clean(question.querySelector(':scope > h1')?.textContent);
  return /anything else you want ayna to know/i.test(heading) ? question : null;
}

function restoreNativeStep(question) {
  question?.classList.remove('v6-referral-active');
  question?.querySelector('.v6-referral-step')?.remove();
  active = false;
}

function finishNative(question) {
  const nativeButton = question?.querySelector(':scope > .ayna-continue-wrap .ayna-continue');
  restoreNativeStep(question);
  if (!nativeButton) return;
  bypassNextFinish = true;
  nativeButton.click();
  window.setTimeout(() => { bypassNextFinish = false; }, 0);
}

function saveReferral(source, other = '') {
  writeStored(REFERRAL_KEY, source);
  writeStored(REFERRAL_OTHER_KEY, other);
  writeStored(REFERRAL_SKIPPED_KEY, '');
  updateDraft(source, other);
  syncReferralToUser();
}

function markSkipped() {
  writeStored(REFERRAL_KEY, '');
  writeStored(REFERRAL_OTHER_KEY, '');
  writeStored(REFERRAL_SKIPPED_KEY, '1');
  updateDraft('', '');
}

function buildReferralStep(question) {
  if (!question || active || question.querySelector('.v6-referral-step')) return;
  active = true;
  question.classList.add('v6-referral-active');

  let selected = readStored(REFERRAL_KEY);
  let otherValue = readStored(REFERRAL_OTHER_KEY);
  const name = firstName();

  const step = document.createElement('div');
  step.className = 'v6-referral-step';
  step.innerHTML = `
    <div class="v6-referral-step__eyebrow"></div>
    <h1>how did you hear about us?</h1>
    <p class="v6-referral-step__sub">pick the closest one.</p>
    <div class="v6-referral-options" role="radiogroup" aria-label="How did you hear about Ayna?"></div>
    <div class="v6-referral-other" hidden>
      <input class="ayna-text-input" type="text" maxlength="120" placeholder="tell us where you found ayna" />
    </div>
    <div class="v6-referral-actions">
      <button type="button" class="ayna-continue" disabled>continue <span aria-hidden="true">→</span></button>
      <button type="button" class="ayna-skip">skip this step</button>
    </div>
  `;

  step.querySelector('.v6-referral-step__eyebrow').textContent = name ? `one last question, ${name.toLowerCase()}` : 'one last question';

  const optionsHost = step.querySelector('.v6-referral-options');
  const otherWrap = step.querySelector('.v6-referral-other');
  const otherInput = otherWrap.querySelector('input');
  const continueButton = step.querySelector('.ayna-continue');
  const skipButton = step.querySelector('.ayna-skip');

  const sync = () => {
    [...optionsHost.querySelectorAll('.v6-referral-option')].forEach((button) => {
      const on = button.dataset.value === selected;
      button.classList.toggle('is-selected', on);
      button.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    const showOther = selected === 'Other';
    otherWrap.hidden = !showOther;
    continueButton.disabled = !selected || (showOther && !clean(otherInput.value));
  };

  OPTIONS.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'v6-referral-option';
    button.dataset.value = option;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');
    button.textContent = option;
    button.addEventListener('click', () => {
      selected = option;
      if (option !== 'Other') otherValue = '';
      sync();
      if (option === 'Other') window.setTimeout(() => otherInput.focus(), 30);
    });
    optionsHost.appendChild(button);
  });

  if (otherValue) otherInput.value = otherValue;
  otherInput.addEventListener('input', () => {
    otherValue = clean(otherInput.value);
    sync();
  });

  continueButton.addEventListener('click', () => {
    if (continueButton.disabled) return;
    const custom = selected === 'Other' ? clean(otherInput.value) : '';
    saveReferral(selected, custom);
    finishNative(question);
  });

  skipButton.addEventListener('click', () => {
    markSkipped();
    finishNative(question);
  });

  question.appendChild(step);
  sync();
  window.setTimeout(() => step.querySelector('.v6-referral-option')?.focus(), 50);
}

function installFinishIntercept() {
  document.addEventListener('click', (event) => {
    const target = event.target?.closest?.('button');
    if (!target) return;

    if (active && target.classList.contains('ayna-intake-back')) {
      const question = document.querySelector('.ayna-intake-question.v6-referral-active');
      if (question) {
        event.preventDefault();
        event.stopImmediatePropagation();
        restoreNativeStep(question);
      }
      return;
    }

    if (!target.classList.contains('ayna-continue')) return;
    if (target.closest('.v6-referral-step')) return;
    if (bypassNextFinish) return;

    const question = nativeLastQuestion();
    if (!question) return;
    if (readStored(REFERRAL_KEY) || readStored(REFERRAL_SKIPPED_KEY)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    buildReferralStep(question);
  }, true);
}

function start() {
  installFinishIntercept();
  syncReferralToUser();
  const supabase = getSupabaseClient();
  try {
    supabase?.auth?.onAuthStateChange?.(() => window.setTimeout(syncReferralToUser, 250));
  } catch {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
