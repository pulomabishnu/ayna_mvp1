import './v6BrowseAdd.css';
import { getSupabaseClient } from './utils/supabaseClient';

const STORAGE_KEY = 'ayna_v6_submitted_products';
let timer = null;

function clean(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalized(value) {
  return clean(value).toLowerCase();
}

function readLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeLocal(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 30))); } catch {}
}

function exactVisibleMatch(query) {
  const q = normalized(query);
  if (!q) return false;
  return [...document.querySelectorAll('.ayna-discover-card__name')].some((node) => normalized(node.textContent) === q);
}

async function authHeader() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return {};
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}

function localEntry(name, source, backendSubmission) {
  return {
    id: backendSubmission?.id || `local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    name,
    source,
    status: backendSubmission?.status || 'pending',
    createdAt: backendSubmission?.created_at || new Date().toISOString(),
  };
}

async function submitProduct(name, source, helper) {
  const trimmed = clean(name);
  if (trimmed.length < 2) return;
  const button = helper.querySelector('button');
  const status = helper.querySelector('.v6-add-product-status');
  button.disabled = true;
  status.textContent = 'adding…';

  const clientSubmissionId = crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    const headers = await authHeader();
    const response = await fetch('/api/product-submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ name: trimmed, source, clientSubmissionId }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body?.submission) throw new Error(body?.error || 'submission_failed');

    const current = readLocal();
    const withoutDuplicate = current.filter((item) => normalized(item.name) !== normalized(trimmed));
    writeLocal([localEntry(trimmed, source, body.submission), ...withoutDuplicate]);
    status.textContent = 'added to Browse ✓';
    button.textContent = 'added';
    renderSubmittedSection();
  } catch (error) {
    status.textContent = error?.message === 'too_many_submissions'
      ? 'You’ve added a few products already. Try again later.'
      : 'Could not add it right now. Try again.';
    button.disabled = false;
  }
}

function buildHelper(input, source) {
  const existing = input.closest('.v6-add-product-wrap')?.querySelector('.v6-add-product-helper')
    || input.parentElement?.querySelector(':scope > .v6-add-product-helper')
    || input.closest('form')?.querySelector(':scope > .v6-add-product-helper');
  if (existing) return existing;

  const helper = document.createElement('div');
  helper.className = 'v6-add-product-helper';
  helper.hidden = true;
  helper.innerHTML = `
    <span class="v6-add-product-copy">Can’t find it?</span>
    <button type="button"><b>+</b><span>add product</span></button>
    <small class="v6-add-product-status" role="status"></small>`;

  const form = input.closest('form');
  (form || input.parentElement).appendChild(helper);

  helper.querySelector('button').addEventListener('click', () => submitProduct(input.value, source, helper));
  return helper;
}

function syncInput(input, source) {
  if (!input || input.closest('.ayna-intake-root')) return;
  const query = clean(input.value);
  const helper = buildHelper(input, source);
  const show = query.length >= 2 && !exactVisibleMatch(query);
  helper.hidden = !show;
  if (!show) return;
  const label = helper.querySelector('.v6-add-product-copy');
  const buttonText = helper.querySelector('button span');
  label.textContent = `Can’t find “${query}”?`;
  buttonText.textContent = `add “${query}”`;
  helper.querySelector('.v6-add-product-status').textContent = '';
  helper.querySelector('button').disabled = false;
}

function bindInput(input, source) {
  if (!input || input.dataset.v6AddBound === '1') return;
  input.dataset.v6AddBound = '1';
  input.addEventListener('input', () => window.setTimeout(() => syncInput(input, source), 45));
  input.addEventListener('focus', () => syncInput(input, source));
  syncInput(input, source);
}

function submittedCard(item) {
  const article = document.createElement('article');
  article.className = 'v6-submitted-card';
  article.innerHTML = `
    <div class="v6-submitted-card__tile"><span>${clean(item.name).slice(0,1).toUpperCase()}</span></div>
    <div class="v6-submitted-card__body">
      <small>added by you · ${item.status || 'pending'}</small>
      <strong></strong>
      <p>We saved this product submission and it is ready for catalog review.</p>
    </div>`;
  article.querySelector('strong').textContent = clean(item.name);
  return article;
}

function renderSubmittedSection() {
  const browse = document.querySelector('.ayna-browse');
  const grid = browse?.querySelector('.ayna-browse__grid');
  if (!browse || !grid) return;

  const search = browse.querySelector('.ayna-browse__search input[type="search"], .ayna-browse__search input');
  const q = normalized(search?.value);
  const items = readLocal().filter((item) => !q || normalized(item.name).includes(q));

  let section = browse.querySelector('.v6-submitted-products');
  if (!items.length) {
    section?.remove();
    return;
  }
  if (!section) {
    section = document.createElement('section');
    section.className = 'v6-submitted-products';
    section.innerHTML = `<div class="v6-submitted-products__head"><span>added by you</span><small>new submissions appear here right away</small></div><div class="v6-submitted-products__grid"></div>`;
    grid.insertAdjacentElement('beforebegin', section);
  }
  const localGrid = section.querySelector('.v6-submitted-products__grid');
  localGrid.replaceChildren(...items.map(submittedCard));
}

function enhance() {
  const browseInput = document.querySelector('.ayna-browse__search input[type="search"], .ayna-browse__search input');
  bindInput(browseInput, 'browse');

  [...document.querySelectorAll('input[type="search"]')].forEach((input) => {
    if (input === browseInput || input.closest('.ayna-intake-root')) return;
    const placeholder = normalized(input.getAttribute('placeholder'));
    if (placeholder.includes('search')) bindInput(input, 'global_search');
  });

  renderSubmittedSection();
}

function start() {
  enhance();
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(enhance, 35);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('input', () => setTimeout(renderSubmittedSection, 80), true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
