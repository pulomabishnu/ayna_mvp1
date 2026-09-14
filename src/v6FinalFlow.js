import './v6FinalPass.css';
import { getSupabaseClient } from './utils/supabaseClient';
import { mapIntakeToLegacyQuizProfile } from './utils/healthIntake';

const NAME_KEY = 'ayna_v6_first_name';
const DRAFT_KEY = 'ayna_intake_redesign_draft_v1';
const VERIFY_KEY = 'ayna_v6_verification_pending';
const ACCOUNT_DONE_KEY = 'ayna_v6_account_step_done';
const CONSENT_VERSION = 'v2-18plus';
const AGE_REQUIREMENT_VERSION = '18plus-v1';

const CONSENT_ITEMS = [
  'The health information I share with ayna is self-reported wellness information, not a clinical record.',
  'When I intentionally use an AI-powered feature, limited relevant wellness context may be processed by an external AI provider to generate my requested response. ayna minimizes the context sent, protects it in transit, and does not sell it.',
  'ayna provides wellness information, not medical advice or a substitute for care from a qualified healthcare provider.',
  'I confirm that I am at least 18 years old.',
];

const supabase = getSupabaseClient();
let authUser = null;
let authReady = false;
let observerTimer = null;

function cleanText(node) {
  return String(node?.textContent || '').replace(/\s+/g, ' ').trim();
}

function nextFrame(fn) {
  window.requestAnimationFrame(() => window.requestAnimationFrame(fn));
}

function readSessionJson(key) {
  try { return JSON.parse(window.sessionStorage.getItem(key) || 'null'); } catch (_) { return null; }
}

function readVerificationPending() {
  try { return JSON.parse(window.sessionStorage.getItem(VERIFY_KEY) || 'null'); } catch (_) { return null; }
}

function writeVerificationPending(value) {
  try {
    if (value) window.sessionStorage.setItem(VERIFY_KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(VERIFY_KEY);
  } catch (_) {}
}

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

function applyAuthClasses(user) {
  authUser = user || null;
  authReady = true;
  document.documentElement.classList.toggle('v6-signed-out', !authUser);
  document.documentElement.classList.toggle('v6-signed-in', Boolean(authUser));
  document.documentElement.classList.toggle('v6-user-verified', isVerifiedUser(authUser));
  if (isVerifiedUser(authUser)) {
    writeVerificationPending(null);
    try { window.sessionStorage.removeItem(ACCOUNT_DONE_KEY); } catch (_) {}
  }
}

async function syncAuthState() {
  if (!supabase) {
    applyAuthClasses(null);
    return;
  }
  try {
    const { data } = await supabase.auth.getUser();
    applyAuthClasses(data?.user || null);
  } catch (_) {
    applyAuthClasses(null);
  }
}

function signupMetadata() {
  const now = new Date().toISOString();
  const firstName = String(window.sessionStorage.getItem(NAME_KEY) || '').trim();
  return {
    first_name: firstName,
    full_name: firstName,
    consent_given_at: now,
    consent_version: CONSENT_VERSION,
    age_18_confirmed: true,
    age_18_confirmed_at: now,
    age_requirement_version: AGE_REQUIREMENT_VERSION,
  };
}

function getCompletedQuizFromDraft() {
  const draft = readSessionJson(DRAFT_KEY);
  const intake = draft?.intake;
  if (!intake || typeof intake !== 'object') return null;
  const completedAt = new Date().toISOString();
  const raw = {
    ...intake,
    personalizationCompleted: true,
    personalizationCompletedAt: completedAt,
    intakeVersion: intake.intakeVersion || 'beta-redesign-2026-09',
  };
  const mapped = mapIntakeToLegacyQuizProfile(raw);
  return {
    ...mapped,
    personalizationCompleted: true,
    personalizationCompletedAt: completedAt,
  };
}

function persistPendingQuizForRedirect() {
  try {
    const pending = getCompletedQuizFromDraft();
    window.sessionStorage.setItem('ayna_pending_auth_action', 'quiz-complete');
    if (pending) window.sessionStorage.setItem('ayna_pending_quiz_results', JSON.stringify(pending));
  } catch (_) {}
}

function normalizePhoneE164(raw) {
  const trimmed = String(raw || '').trim();
  if (/^\+[1-9]\d{6,14}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/[^\d]/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

function messageFromError(error, fallback = 'Something went wrong. Please try again.') {
  const raw = String(error?.message || error || '').trim();
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.message) return String(parsed.message);
  } catch (_) {}
  if (/gateway timeout|504/i.test(raw)) return 'The sign-in service took too long to respond. We retried once, but it is still timing out. Please try again in a moment.';
  if (/failed to fetch|network|load failed/i.test(raw)) return 'We could not reach the sign-in service. Check your connection and try again.';
  return raw;
}

function timeoutPromise(ms = 12000) {
  return new Promise((_, reject) => window.setTimeout(() => reject(new Error('auth_timeout')), ms));
}

async function withTimeout(promise, ms = 12000) {
  return Promise.race([promise, timeoutPromise(ms)]);
}

function retryableAuthError(error) {
  return /gateway timeout|504|auth_timeout|failed to fetch|network|load failed/i.test(String(error?.message || error || ''));
}

async function signInWithRetry(email, password) {
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await withTimeout(supabase.auth.signInWithPassword({ email, password }), 12000);
      if (result?.error) throw result.error;
      return result;
    } catch (error) {
      lastError = error;
      if (!retryableAuthError(error) || attempt === 1) break;
      await new Promise((resolve) => window.setTimeout(resolve, 650));
    }
  }
  throw lastError || new Error('signin_failed');
}

function ensureNameQuestion() {
  if (!authReady || authUser) return;
  let existingName = '';
  try { existingName = window.sessionStorage.getItem(NAME_KEY) || ''; } catch (_) {}
  if (existingName.trim()) return;

  const root = document.querySelector('.ayna-intake-root');
  const question = root?.querySelector('.ayna-intake-question');
  if (!root || !question) return;
  const heading = cleanText(question.querySelector('h1'));
  if (!/^how old are you\??$/i.test(heading)) return;

  if (question.querySelector('.v6-name-step')) return;
  question.classList.add('v6-name-gated');

  const step = document.createElement('div');
  step.className = 'v6-name-step';
  step.innerHTML = `
    <div class="v6-name-step__eyebrow">first, a tiny introduction</div>
    <h1>what should we call you?</h1>
    <p>This is the name you’ll see inside your health universe.</p>
    <input class="v6-name-step__input" type="text" maxlength="50" autocomplete="given-name" placeholder="your first name" />
    <button class="v6-name-step__button" type="button" disabled>continue →</button>
  `;
  question.prepend(step);

  const input = step.querySelector('input');
  const button = step.querySelector('button');
  const sync = () => { button.disabled = !String(input.value || '').trim(); };
  input.addEventListener('input', sync);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !button.disabled) {
      event.preventDefault();
      button.click();
    }
  });
  button.addEventListener('click', () => {
    const value = String(input.value || '').trim();
    if (!value) return;
    try { window.sessionStorage.setItem(NAME_KEY, value); } catch (_) {}
    question.classList.remove('v6-name-gated');
    step.remove();
    nextFrame(() => root.querySelector('.ayna-age-range, input, button')?.focus?.());
  });
  window.setTimeout(() => input.focus(), 80);
}

function allConsented(step) {
  const boxes = [...step.querySelectorAll('.v6-account-consent-list input[type="checkbox"]')];
  return boxes.length === CONSENT_ITEMS.length && boxes.every((box) => box.checked);
}

function buildAccountStep(result) {
  const firstName = String(window.sessionStorage.getItem(NAME_KEY) || '').trim();
  const step = document.createElement('div');
  step.className = 'v6-account-step';
  step.innerHTML = `
    <div class="v6-account-step__card">
      <div class="v6-account-step__eyebrow">one last step</div>
      <h1>save your health universe.</h1>
      <p class="v6-account-step__sub">Your answers are done${firstName ? `, <span class="v6-account-name"></span>` : ''}. Create your private account so your ecosystem can be built and saved.</p>

      <div class="v6-account-step__methods" role="tablist" aria-label="Account method">
        <button type="button" class="v6-account-method is-active" data-method="email">email</button>
        <button type="button" class="v6-account-method" data-method="phone">phone</button>
      </div>

      <form class="v6-account-fields" novalidate>
        <input class="v6-account-input v6-account-email" type="email" autocomplete="email" placeholder="email address" />
        <input class="v6-account-input v6-account-password" type="password" autocomplete="new-password" minlength="8" placeholder="create a password" />
        <input class="v6-account-input v6-account-phone" type="tel" autocomplete="tel" placeholder="phone number" hidden />
        <input class="v6-account-input v6-account-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6-digit code" hidden />
        <p class="v6-account-code-note" hidden></p>
        <button class="v6-account-primary" type="submit" disabled>create account + build my ecosystem</button>
      </form>

      <div class="v6-account-divider">or</div>
      <button class="v6-account-google" type="button">continue with Google</button>

      <div class="v6-account-consent">
        <button type="button" aria-expanded="false"><span>Privacy, AI & age confirmation</span><span>⌄</span></button>
        <div class="v6-account-consent-list"></div>
      </div>
      <p class="v6-account-legal">ayna accounts are for adults 18+. By creating an account you agree to our <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>, <a href="/consumer-health-data.html" target="_blank" rel="noopener noreferrer">Consumer Health Data Privacy Notice</a>, and <a href="/terms-of-use" target="_blank" rel="noopener noreferrer">Terms of Service</a>.</p>
      <p class="v6-account-status" role="status"></p>
      <button type="button" class="v6-account-signin-link">already have an account? sign in</button>
    </div>
  `;

  if (firstName) step.querySelector('.v6-account-name').textContent = firstName;
  const consentList = step.querySelector('.v6-account-consent-list');
  CONSENT_ITEMS.forEach((text, index) => {
    const label = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.dataset.index = String(index);
    const span = document.createElement('span');
    span.textContent = text;
    label.append(box, span);
    consentList.append(label);
  });

  result.append(step);
  return step;
}

function setupAccountStep(result, step) {
  let method = 'email';
  let phoneStage = 'number';
  let normalizedPhone = '';

  const methodButtons = [...step.querySelectorAll('.v6-account-method')];
  const form = step.querySelector('form');
  const email = step.querySelector('.v6-account-email');
  const password = step.querySelector('.v6-account-password');
  const phone = step.querySelector('.v6-account-phone');
  const code = step.querySelector('.v6-account-code');
  const codeNote = step.querySelector('.v6-account-code-note');
  const primary = step.querySelector('.v6-account-primary');
  const google = step.querySelector('.v6-account-google');
  const status = step.querySelector('.v6-account-status');
  const consent = step.querySelector('.v6-account-consent');
  const consentToggle = consent.querySelector(':scope > button');
  const signinLink = step.querySelector('.v6-account-signin-link');

  const setStatus = (text = '', good = false) => {
    status.textContent = text;
    status.style.color = good ? '#4f6d50' : '#8e493f';
  };

  const syncPrimary = () => {
    const consentOk = allConsented(step);
    const fieldsOk = method === 'email'
      ? Boolean(email.value.trim() && password.value.length >= 8)
      : phoneStage === 'number'
        ? Boolean(normalizePhoneE164(phone.value))
        : Boolean(code.value.trim().length === 6);
    primary.disabled = !(consentOk && fieldsOk);
    primary.textContent = method === 'email'
      ? 'create account + build my ecosystem'
      : phoneStage === 'number' ? 'text me a code' : 'verify + build my ecosystem';
  };

  const setMethod = (next) => {
    method = next;
    phoneStage = 'number';
    normalizedPhone = '';
    setStatus('');
    methodButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.method === next));
    email.hidden = next !== 'email';
    password.hidden = next !== 'email';
    phone.hidden = next !== 'phone';
    code.hidden = true;
    codeNote.hidden = true;
    syncPrimary();
  };

  methodButtons.forEach((button) => button.addEventListener('click', () => setMethod(button.dataset.method)));
  [email, password, phone, code].forEach((input) => input.addEventListener('input', syncPrimary));
  step.querySelectorAll('.v6-account-consent-list input').forEach((box) => box.addEventListener('change', syncPrimary));

  consentToggle.addEventListener('click', () => {
    const open = !consent.classList.contains('is-open');
    consent.classList.toggle('is-open', open);
    consentToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  signinLink.addEventListener('click', () => {
    const loginButton = result.querySelector('.ayna-result-login');
    loginButton?.click();
  });

  google.addEventListener('click', async () => {
    if (!allConsented(step)) {
      consent.classList.add('is-open');
      consentToggle.setAttribute('aria-expanded', 'true');
      setStatus('Please confirm the privacy, AI, wellness, and 18+ statements first.');
      return;
    }
    if (!supabase) {
      setStatus('Sign-in is not configured on this deployment.');
      return;
    }
    setStatus('Opening Google…', true);
    google.disabled = true;
    persistPendingQuizForRedirect();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw error;
    } catch (error) {
      google.disabled = false;
      setStatus(messageFromError(error, 'Could not continue with Google.'));
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (primary.disabled || !supabase) return;
    setStatus('');
    primary.disabled = true;
    primary.textContent = 'please wait…';
    persistPendingQuizForRedirect();

    try {
      if (method === 'email') {
        const cleanEmail = email.value.trim();
        const { data, error } = await withTimeout(supabase.auth.signUp({
          email: cleanEmail,
          password: password.value,
          options: {
            emailRedirectTo: 'https://www.aynahealth.co/confirmed',
            data: signupMetadata(),
          },
        }), 15000);
        if (error) throw error;
        if (data?.user?.identities?.length === 0) throw new Error('An account with this email already exists. Sign in instead.');

        try { window.sessionStorage.setItem(ACCOUNT_DONE_KEY, '1'); } catch (_) {}
        if (data?.session) {
          setStatus('Account created. Building your ecosystem…', true);
          return;
        }

        writeVerificationPending({ type: 'email', value: cleanEmail });
        setStatus('Check your email to verify your account. Your ecosystem preview is ready.', true);
        window.setTimeout(() => {
          result.classList.remove('v6-awaiting-account');
          step.remove();
          enhancePendingVerificationResult();
        }, 650);
        return;
      }

      if (phoneStage === 'number') {
        normalizedPhone = normalizePhoneE164(phone.value);
        if (!normalizedPhone) throw new Error('Please enter a valid phone number.');
        const { error } = await withTimeout(supabase.auth.signInWithOtp({
          phone: normalizedPhone,
          options: { data: signupMetadata() },
        }), 15000);
        if (error) throw error;
        phoneStage = 'code';
        phone.hidden = true;
        code.hidden = false;
        codeNote.hidden = false;
        codeNote.textContent = `We texted a code to ${normalizedPhone}.`;
        code.focus();
        setStatus('');
        syncPrimary();
        return;
      }

      const { data, error } = await withTimeout(supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: code.value.trim(),
        type: 'sms',
      }), 15000);
      if (error) throw error;
      if (!data?.session) throw new Error('We verified the code but could not start your session. Please sign in.');
      try { window.sessionStorage.setItem(ACCOUNT_DONE_KEY, '1'); } catch (_) {}
      setStatus('Verified. Building your ecosystem…', true);
    } catch (error) {
      setStatus(messageFromError(error));
      syncPrimary();
    }
  });

  syncPrimary();
}

function ensureQuizAccountStep() {
  if (!authReady || authUser) return;
  const result = document.querySelector('.ayna-quiz-result-screen');
  if (!result) return;
  if (readVerificationPending()) {
    enhancePendingVerificationResult();
    return;
  }
  let done = false;
  try { done = window.sessionStorage.getItem(ACCOUNT_DONE_KEY) === '1'; } catch (_) {}
  if (done) return;
  if (result.querySelector('.v6-account-step')) return;

  result.classList.add('v6-awaiting-account');
  const step = buildAccountStep(result);
  setupAccountStep(result, step);
}

function showVerificationNotice() {
  if (document.querySelector('.v6-verify-backdrop')) return;
  const pending = readVerificationPending();
  const backdrop = document.createElement('div');
  backdrop.className = 'v6-verify-backdrop';
  backdrop.innerHTML = `
    <div class="v6-verify-card" role="dialog" aria-modal="true" aria-labelledby="v6-verify-title">
      <div class="v6-account-step__eyebrow">almost yours</div>
      <h2 id="v6-verify-title">verify first.</h2>
      <p>Verify your account before opening Browse or your saved ecosystem. Your quiz answers are still here.</p>
      <div class="v6-verify-actions">
        <button type="button" class="v6-verify-primary">resend verification</button>
        <button type="button" class="v6-verify-secondary">not now</button>
      </div>
      <p class="v6-account-status" role="status"></p>
    </div>
  `;
  document.body.append(backdrop);
  const status = backdrop.querySelector('.v6-account-status');
  backdrop.querySelector('.v6-verify-secondary').addEventListener('click', () => backdrop.remove());
  backdrop.addEventListener('click', (event) => { if (event.target === backdrop) backdrop.remove(); });
  backdrop.querySelector('.v6-verify-primary').addEventListener('click', async () => {
    if (!supabase || pending?.type !== 'email' || !pending?.value) {
      status.textContent = 'Open the verification message we sent you, then come back to ayna.';
      return;
    }
    const button = backdrop.querySelector('.v6-verify-primary');
    button.disabled = true;
    status.textContent = 'sending…';
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pending.value,
        options: { emailRedirectTo: 'https://www.aynahealth.co/confirmed' },
      });
      if (error) throw error;
      status.style.color = '#4f6d50';
      status.textContent = 'Sent. Check your inbox and spam folder.';
    } catch (error) {
      status.textContent = messageFromError(error, 'Could not resend right now.');
    } finally {
      button.disabled = false;
    }
  });
}

function enhancePendingVerificationResult() {
  const pending = readVerificationPending();
  if (!pending) return;
  const result = document.querySelector('.ayna-quiz-result-screen');
  if (!result) return;
  result.classList.remove('v6-awaiting-account');
  result.querySelectorAll('.ayna-result-login').forEach((button) => { button.style.display = 'none'; });
  result.querySelectorAll('.ayna-result-signup').forEach((button) => {
    button.textContent = 'go to your ecosystem';
    if (!button.dataset.v6VerifyBound) {
      button.dataset.v6VerifyBound = '1';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        showVerificationNotice();
      }, true);
    }
  });
  const title = result.querySelector('.ayna-result-title');
  if (title && !result.querySelector('.v6-result-verify-note')) {
    const note = document.createElement('p');
    note.className = 'v6-result-verify-note';
    note.textContent = 'Your preview is ready. Verify your account to unlock Browse and save this ecosystem.';
    note.style.cssText = 'margin:10px auto 0;max-width:620px;color:rgba(255,250,243,.68);font-size:12px;line-height:1.5;';
    title.insertAdjacentElement('afterend', note);
  }
}

function isProtectedPendingClick(target) {
  const clickable = target?.closest?.('a,button');
  if (!clickable) return false;
  if (clickable.closest('.v6-verify-backdrop')) return false;
  if (clickable.classList.contains('v6-browse-needs-trigger')) return false;
  const text = cleanText(clickable).toLowerCase();
  const href = String(clickable.getAttribute('href') || '').toLowerCase();
  return (
    /^(browse|my ecosystem|view my ecosystem|go to your ecosystem)$/.test(text) ||
    /browse products|browse my matches|open my ecosystem|view ecosystem/.test(text) ||
    /\/browse(?:$|[?#])|\/ecosystem(?:$|[?#])/.test(href)
  );
}

function installVerificationGuard() {
  if (document.documentElement.dataset.v6VerifyGuard === '1') return;
  document.documentElement.dataset.v6VerifyGuard = '1';
  document.addEventListener('click', (event) => {
    if (!readVerificationPending()) return;
    if (!isProtectedPendingClick(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showVerificationNotice();
  }, true);
}

function enhanceExistingSignIn() {
  if (!supabase) return;
  const cards = [...document.querySelectorAll('.v6-auth-card')];
  cards.forEach((card) => {
    const form = card.querySelector('form');
    const submit = form?.querySelector('button[type="submit"]');
    if (!form || !submit || form.dataset.v6SignInRetry === '1') return;
    if (!/^sign in$/i.test(cleanText(submit))) return;

    form.dataset.v6SignInRetry = '1';
    form.addEventListener('submit', async (event) => {
      if (!/^sign in$/i.test(cleanText(submit))) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const email = form.querySelector('input[type="email"]')?.value?.trim();
      const password = form.querySelector('input[type="password"], input[autocomplete="current-password"]')?.value || '';
      if (!email || !password) return;

      let message = form.querySelector('.v6-auth-inline-error');
      if (!message) {
        message = document.createElement('p');
        message.className = 'v6-auth-inline-error';
        submit.insertAdjacentElement('beforebegin', message);
      }
      message.textContent = '';
      const original = cleanText(submit) || 'Sign in';
      submit.disabled = true;
      submit.textContent = 'signing in…';
      try {
        await signInWithRetry(email, password);
        message.style.color = '#4f6d50';
        message.textContent = 'signed in. opening your ayna…';
      } catch (error) {
        message.style.color = '#8f423d';
        message.textContent = messageFromError(error, 'Could not sign in. Please try again.');
        submit.disabled = false;
        submit.textContent = original;
      }
    }, true);
  });

  document.querySelectorAll('.v6-auth-card p').forEach((paragraph) => {
    if (/gateway timeout/i.test(cleanText(paragraph))) {
      paragraph.textContent = 'The sign-in service timed out. Please try again.';
    }
  });
}

function enhanceAll() {
  ensureNameQuestion();
  ensureQuizAccountStep();
  enhancePendingVerificationResult();
  enhanceExistingSignIn();
}

function start() {
  installVerificationGuard();
  syncAuthState().finally(enhanceAll);

  if (supabase) {
    supabase.auth.onAuthStateChange((_event, session) => {
      applyAuthClasses(session?.user || null);
      nextFrame(enhanceAll);
    });
  }

  const observer = new MutationObserver(() => {
    window.clearTimeout(observerTimer);
    observerTimer = window.setTimeout(enhanceAll, 24);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('input', () => nextFrame(enhanceAll), true);
  document.addEventListener('change', () => nextFrame(enhanceAll), true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
