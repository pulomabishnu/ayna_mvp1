import './v6AccountUX.css';
import posthog from 'posthog-js';
import { getSupabaseClient } from './utils/supabaseClient';

const THEME_KEY = 'ayna_v6_site_theme';
let observerTimer = null;
let signingOut = false;
let settingsKeyHandler = null;

function cleanText(node) {
  return String(node?.textContent || '').replace(/\s+/g, ' ').trim();
}

function storedTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'system'; } catch { return 'system'; }
}

function resolvedTheme(mode = storedTheme()) {
  if (mode === 'dark' || mode === 'light') return mode;
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch { return 'light'; }
}

function applyTheme(mode) {
  const safe = ['light','dark','system'].includes(mode) ? mode : 'system';
  try { localStorage.setItem(THEME_KEY, safe); } catch {}
  const resolved = resolvedTheme(safe);
  document.documentElement.dataset.v6SiteTheme = resolved;
  document.documentElement.dataset.v6SiteThemeMode = safe;
  document.querySelectorAll('.v6-settings-theme button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.theme === safe);
    button.setAttribute('aria-pressed', button.dataset.theme === safe ? 'true' : 'false');
  });
}

function clearLocalSupabaseSession() {
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      const remove = [];
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key && (/^sb-.+-auth-token$/i.test(key) || /^supabase\.auth\./i.test(key))) remove.push(key);
      }
      remove.forEach((key) => store.removeItem(key));
    } catch {}
  }
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function robustSignOut() {
  if (signingOut) return;
  signingOut = true;
  document.documentElement.classList.add('v6-signing-out');
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      try { await withTimeout(supabase.auth.signOut({ scope: 'local' }), 4500); } catch {}
    }
  } finally {
    clearLocalSupabaseSession();
    try { posthog.reset?.(); } catch {}
    window.location.replace('/');
  }
}

async function downloadMyData(status) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    status.textContent = 'Sign in again to download your data.';
    return;
  }
  status.textContent = 'preparing your download…';
  try {
    const { data, error } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (error || !token) throw new Error('session');
    const response = await fetch('/api/account-data', { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('download');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ayna-data-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    status.textContent = 'download ready.';
  } catch {
    status.textContent = 'Could not prepare your download. Try again.';
  }
}

function closeSettings() {
  document.querySelector('.v6-settings-backdrop')?.remove();
  document.body.classList.remove('v6-settings-open');
  if (settingsKeyHandler) {
    window.removeEventListener('keydown', settingsKeyHandler);
    settingsKeyHandler = null;
  }
}

function settingsRow(path, title, copy, arrow = '→') {
  return `<button type="button" class="v6-settings-row" data-go="${path}"><span><strong>${title}</strong><small>${copy}</small></span><b>${arrow}</b></button>`;
}

function openSettings() {
  if (document.querySelector('.v6-settings-backdrop')) return;
  const backdrop = document.createElement('div');
  backdrop.className = 'v6-settings-backdrop';
  backdrop.innerHTML = `
    <section class="v6-settings-card" role="dialog" aria-modal="true" aria-labelledby="v6-settings-title">
      <header class="v6-settings-head">
        <div><span>your ayna</span><h2 id="v6-settings-title">settings</h2></div>
        <button type="button" class="v6-settings-close" aria-label="Close settings">×</button>
      </header>

      <div class="v6-settings-section">
        <div class="v6-settings-label">appearance</div>
        <p>Same dainty matte Ayna, in the version that feels best on your screen.</p>
        <div class="v6-settings-theme" role="group" aria-label="Appearance">
          <button type="button" data-theme="light">☀ light</button>
          <button type="button" data-theme="dark">☾ dark</button>
          <button type="button" data-theme="system">system</button>
        </div>
      </div>

      <div class="v6-settings-section">
        <div class="v6-settings-label">your health universe</div>
        ${settingsRow('/ecosystem', 'my ecosystem', 'open your saved care areas and personalized products')}
        ${settingsRow('/profile', 'health profile', 'review or update the information Ayna uses')}
        ${settingsRow('/text-ayna', 'text ayna', 'manage the phone number used for personalized Ayna texts')}
      </div>

      <div class="v6-settings-section">
        <div class="v6-settings-label">your data</div>
        <button type="button" class="v6-settings-row" data-download><span><strong>download my data</strong><small>get a copy of the account data Ayna stores</small></span><b>↓</b></button>
        ${settingsRow('/profile', 'manage data + privacy', 'analytics controls and account deletion live with your profile')}
      </div>

      <div class="v6-settings-section">
        <div class="v6-settings-label">privacy + legal</div>
        ${settingsRow('/privacy-policy', 'privacy policy', 'how Ayna handles your information')}
        ${settingsRow('/consumer-health-data.html', 'consumer health data privacy', 'your rights for consumer health information')}
        ${settingsRow('/terms-of-use', 'terms of use', 'the terms for using Ayna')}
        ${settingsRow('/how-we-make-money', 'how we make money', 'how partnerships and recommendations stay separate')}
      </div>

      <div class="v6-settings-section v6-settings-last">
        <button type="button" class="v6-settings-logout">log out</button>
        <small class="v6-settings-status" role="status"></small>
      </div>
    </section>`;
  document.body.appendChild(backdrop);
  document.body.classList.add('v6-settings-open');

  const closeButton = backdrop.querySelector('.v6-settings-close');
  closeButton.addEventListener('click', closeSettings);
  backdrop.addEventListener('click', (event) => { if (event.target === backdrop) closeSettings(); });
  backdrop.querySelectorAll('.v6-settings-theme button').forEach((button) => button.addEventListener('click', () => applyTheme(button.dataset.theme)));
  backdrop.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => { window.location.href = button.dataset.go; }));
  backdrop.querySelector('[data-download]').addEventListener('click', () => downloadMyData(backdrop.querySelector('.v6-settings-status')));
  backdrop.querySelector('.v6-settings-logout').addEventListener('click', robustSignOut);
  settingsKeyHandler = (event) => { if (event.key === 'Escape') closeSettings(); };
  window.addEventListener('keydown', settingsKeyHandler);
  applyTheme(storedTheme());
  closeButton.focus();
}

function enhanceAccountMenus() {
  const logoutButtons = [...document.querySelectorAll('button')].filter((button) => /^(log out|sign out)$/i.test(cleanText(button)));
  logoutButtons.forEach((logout) => {
    const parent = logout.parentElement;
    if (!parent || parent.querySelector('.v6-settings-entry')) return;
    const settings = document.createElement('button');
    settings.type = 'button';
    settings.className = logout.classList.contains('mobile-drawer-item') ? 'mobile-drawer-item v6-settings-entry' : 'v6-settings-entry';
    settings.textContent = 'Settings';
    settings.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openSettings();
    });
    parent.insertBefore(settings, logout);
  });
}

function shouldRouteSignup(target) {
  const clickable = target?.closest?.('a,button');
  if (!clickable) return false;
  if (clickable.closest('.v6-account-step')) return false;
  if (clickable.closest('.v6-settings-backdrop')) return false;
  const text = cleanText(clickable).toLowerCase();
  return /^(create account|create an account|sign up|get started|join ayna)$/.test(text)
    || /create (an |my )?account/.test(text)
    || /sign up/.test(text);
}

function installGlobalGuards() {
  if (document.documentElement.dataset.v6AccountGuard === '1') return;
  document.documentElement.dataset.v6AccountGuard = '1';

  document.addEventListener('click', (event) => {
    const clickable = event.target?.closest?.('a,button');
    const text = cleanText(clickable);

    if (clickable && /^(log out|sign out)$/i.test(text)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      robustSignOut();
      return;
    }

    if (shouldRouteSignup(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = '/quiz';
    }
  }, true);
}

function start() {
  installGlobalGuards();
  applyTheme(storedTheme());
  enhanceAccountMenus();
  const observer = new MutationObserver(() => {
    clearTimeout(observerTimer);
    observerTimer = setTimeout(enhanceAccountMenus, 30);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (storedTheme() === 'system') applyTheme('system');
    });
  } catch {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
