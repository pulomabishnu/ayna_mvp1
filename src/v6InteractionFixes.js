import './v6InteractionFixes.css';
import { ALL_PRODUCTS, CATEGORY_LABELS, MACRO_GROUPS } from './data/products';
import { getSupabaseClient } from './utils/supabaseClient';

const SUBMITTED_STORAGE_KEY = 'ayna_v6_submitted_products';
const TYPEAHEAD_TOPICS = [
  ['Period care', 'period care'], ['PCOS', 'PCOS'], ['Vaginal health', 'vaginal health'],
  ['UTI support', 'UTI support'], ['Fertility', 'fertility'], ['Pregnancy', 'pregnancy'],
  ['Postpartum', 'postpartum'], ['Perimenopause', 'perimenopause'], ['Menopause', 'menopause'],
  ['Pelvic health', 'pelvic health'], ['Sexual wellness', 'sexual wellness'], ['Sleep + energy', 'sleep energy'],
  ['Skin + hair', 'skin hair'], ['Gut health', 'gut health'], ['Mental health + cycle mood', 'mental health cycle mood'],
];

const PRODUCT_RECORDS = (ALL_PRODUCTS || []).filter((p) => p?.name).map((product) => ({
  kind: 'product', value: String(product.name), title: String(product.name),
  subtitle: [product.brand || product.brandName, CATEGORY_LABELS[product.category] || product.category].filter(Boolean).join(' · '),
  image: product.image || product.imageUrl || product.image_url || product.thumbnail || (Array.isArray(product.images) ? product.images[0] : ''),
  haystack: [product.name, product.brand, product.brandName, product.manufacturer, product.company, CATEGORY_LABELS[product.category], product.category, product.summary, ...(Array.isArray(product.tags) ? product.tags : [])].filter(Boolean).join(' '),
}));

const BRAND_RECORDS = [...new Set((ALL_PRODUCTS || []).flatMap((p) => [p?.brand, p?.brandName, p?.manufacturer, p?.company]).filter(Boolean))]
  .map((brand) => ({ kind: 'brand', value: String(brand), title: String(brand), subtitle: 'brand', haystack: String(brand) }));

const TOPIC_RECORDS = [
  ...TYPEAHEAD_TOPICS.map(([title, value]) => ({ kind: 'topic', value, title, subtitle: 'health topic', haystack: `${title} ${value}` })),
  ...(MACRO_GROUPS || []).filter((g) => g?.id !== 'all' && g?.label).map((group) => ({
    kind: 'topic', value: String(group.label), title: String(group.label), subtitle: 'browse by need',
    haystack: [group.label, ...(group.categories || []), ...(group.keywords || [])].join(' '),
  })),
];

function clean(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
function norm(value) { return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function text(node) { return clean(node?.textContent); }

function scoreRecord(record, query) {
  const q = norm(query);
  if (!q) return record.kind === 'topic' ? 30 : Number.POSITIVE_INFINITY;
  const title = norm(record.title); const value = norm(record.value); const haystack = norm(record.haystack || `${record.title} ${record.subtitle || ''}`);
  if (title === q || value === q) return 0;
  if (title.startsWith(q) || value.startsWith(q)) return 1 + Math.abs(title.length - q.length) / 100;
  const titleAt = title.indexOf(q); if (titleAt >= 0) return 3 + titleAt / 100;
  const hayAt = haystack.indexOf(q); if (hayAt >= 0) return 6 + hayAt / 100;
  const words = q.split(' ').filter(Boolean); if (words.length > 1 && words.every((word) => haystack.includes(word))) return 9;
  return Number.POSITIVE_INFINITY;
}

function catalogSuggestions(query) {
  const q = clean(query);
  if (!q) return TOPIC_RECORDS.slice(0, 6);
  const rank = (records, limit) => records.map((record) => ({ record, score: scoreRecord(record, q) })).filter((e) => Number.isFinite(e.score)).sort((a,b) => a.score-b.score || a.record.title.localeCompare(b.record.title)).slice(0, limit).map((e) => e.record);
  const seen = new Set();
  return [...rank(PRODUCT_RECORDS, 6), ...rank(TOPIC_RECORDS, 3), ...rank(BRAND_RECORDS, 2)].filter((record) => {
    const key = `${record.kind}:${norm(record.title)}`; if (seen.has(key)) return false; seen.add(key); return true;
  }).slice(0, 9);
}

function setControlledInput(input, value) {
  if (!input) return;
  const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(input, value); else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function closeNonblockingAuth() {
  const overlay = document.querySelector('.v6-auth-overlay.v6-auth-sheet-mode');
  const close = overlay?.querySelector('button[aria-label="Skip for now"], button[aria-label="Close"]');
  close?.click();
}

function submitSearch(form, input, value) {
  closeNonblockingAuth();
  setControlledInput(input, value);
  window.setTimeout(() => {
    if (typeof form?.requestSubmit === 'function') form.requestSubmit();
    else form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }, 35);
}

async function authHeader() {
  try {
    const supabase = getSupabaseClient(); if (!supabase) return {};
    const { data } = await supabase.auth.getSession(); const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}

function rememberSubmission(name, source, submission = {}) {
  try {
    const parsed = JSON.parse(localStorage.getItem(SUBMITTED_STORAGE_KEY) || '[]'); const items = Array.isArray(parsed) ? parsed : [];
    const next = { id: submission.id || `local-${Date.now()}`, name, source, status: submission.status || 'pending', createdAt: submission.created_at || new Date().toISOString() };
    localStorage.setItem(SUBMITTED_STORAGE_KEY, JSON.stringify([next, ...items.filter((item) => norm(item?.name) !== norm(name))].slice(0, 30)));
  } catch {}
}

async function submitMissingProduct(name, source, button) {
  const value = clean(name); if (value.length < 2 || !button || button.dataset.busy === '1') return;
  if (source === 'browse') {
    const helperButton = document.querySelector('.ayna-browse__search .v6-add-product-helper button');
    if (helperButton) {
      button.dataset.busy = '1'; button.textContent = 'adding…'; helperButton.click();
      window.setTimeout(() => { button.textContent = 'added ✓'; delete button.dataset.busy; }, 700); return;
    }
  }
  button.dataset.busy = '1'; button.textContent = 'adding…';
  try {
    const headers = await authHeader();
    const response = await fetch('/api/product-submissions', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ name: value, source, clientSubmissionId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}` }) });
    const body = await response.json().catch(() => ({})); if (!response.ok || !body?.submission) throw new Error(body?.error || 'submission_failed');
    rememberSubmission(value, source, body.submission); button.textContent = 'added ✓';
  } catch { button.textContent = 'couldn’t add · try again'; }
  finally { window.setTimeout(() => { delete button.dataset.busy; }, 500); }
}

function resultRow(record, onChoose) {
  const button = document.createElement('button'); button.type = 'button'; button.className = `v6-typeahead-row is-${record.kind}`; button.setAttribute('role','option');
  button.addEventListener('mousedown', (event) => event.preventDefault()); button.addEventListener('click', () => onChoose(record));
  const visual = document.createElement('span'); visual.className = 'v6-typeahead-visual';
  if (record.image) {
    const image = document.createElement('img'); image.src = record.image; image.alt = '';
    image.addEventListener('error', () => { image.remove(); visual.textContent = record.title.slice(0,1).toLowerCase(); }); visual.appendChild(image);
  } else visual.textContent = record.kind === 'topic' ? '♡' : record.kind === 'brand' ? 'b' : record.title.slice(0,1).toLowerCase();
  const copy = document.createElement('span'); copy.className='v6-typeahead-copy'; const strong=document.createElement('strong'); strong.textContent=record.title; const small=document.createElement('small'); small.textContent=record.subtitle || record.kind; copy.append(strong,small);
  const kind=document.createElement('em'); kind.textContent=record.kind==='topic'?'explore →':record.kind==='brand'?'brand →':'product →'; button.append(visual,copy,kind); return button;
}

function bindCatalogTypeahead(input, source) {
  if (!input || input.dataset.v6TypeaheadBound === '1') return;
  const form=input.closest('form'); if (!form) return; input.dataset.v6TypeaheadBound='1'; form.classList.add('v6-typeahead-host');
  const dropdown=document.createElement('div'); dropdown.className='v6-live-search-dropdown'; dropdown.hidden=true; dropdown.setAttribute('role','listbox'); form.appendChild(dropdown);
  let activeIndex=-1; let blurTimer=null;
  const close=()=>{dropdown.hidden=true;form.classList.remove('v6-typeahead-open');activeIndex=-1;};
  const render=()=>{
    const query=clean(input.value); const records=catalogSuggestions(query); dropdown.replaceChildren();
    if (!records.length && query.length<2) { close(); return; }
    if (!query) { const label=document.createElement('div'); label.className='v6-typeahead-label'; label.textContent='popular in ayna'; dropdown.appendChild(label); }
    records.forEach((record)=>dropdown.appendChild(resultRow(record,(chosen)=>{close();submitSearch(form,input,chosen.value);}))); 
    const exactProduct=PRODUCT_RECORDS.some((record)=>norm(record.title)===norm(query));
    if (query.length>=2 && !exactProduct) {
      const add=document.createElement('button'); add.type='button'; add.className='v6-typeahead-add'; add.setAttribute('role','option');
      add.innerHTML='<span class="v6-typeahead-plus">+</span><span class="v6-typeahead-addcopy"><strong></strong><small>new submissions appear in Browse right away</small></span><em>add</em>';
      add.querySelector('strong').textContent=`Can’t find “${query}”?`; add.addEventListener('mousedown',(event)=>event.preventDefault());
      add.addEventListener('click',async()=>{await submitMissingProduct(query,source==='home'?'global_search':source,add.querySelector('em'));}); dropdown.appendChild(add);
    }
    dropdown.hidden=false; form.classList.add('v6-typeahead-open'); activeIndex=-1;
  };
  input.addEventListener('focus',()=>{window.clearTimeout(blurTimer);render();}); input.addEventListener('input',()=>window.requestAnimationFrame(render)); input.addEventListener('blur',()=>{blurTimer=window.setTimeout(close,180);});
  input.addEventListener('keydown',(event)=>{
    if (dropdown.hidden) { if(event.key==='ArrowDown'){render();event.preventDefault();} return; }
    const rows=[...dropdown.querySelectorAll('button:not(:disabled)')]; if(!rows.length)return;
    if(event.key==='ArrowDown'){event.preventDefault();activeIndex=(activeIndex+1)%rows.length;} else if(event.key==='ArrowUp'){event.preventDefault();activeIndex=(activeIndex-1+rows.length)%rows.length;} else if(event.key==='Escape'){event.preventDefault();close();return;} else if(event.key==='Enter'&&activeIndex>=0){event.preventDefault();rows[activeIndex]?.click();return;} else return;
    rows.forEach((row,index)=>row.classList.toggle('is-keyboard-active',index===activeIndex)); rows[activeIndex]?.scrollIntoView({block:'nearest'});
  });
}

function bindIntakeSupportTypeahead(input) {
  if (!input || input.dataset.v6SupportTypeaheadBound==='1') return;
  const question=input.closest('.ayna-intake-question'); if(!question || !/currently experiencing|looking for support/i.test(text(question.querySelector('h1')))) return;
  const labels=[...question.querySelectorAll('.ayna-row-choice')].map((button)=>text(button.querySelector('span:first-child')||button)).filter(Boolean); if(!labels.length)return;
  input.dataset.v6SupportTypeaheadBound='1'; const wrap=input.closest('.ayna-search-wrap'); wrap?.classList.add('v6-intake-typeahead-host');
  const dropdown=document.createElement('div'); dropdown.className='v6-intake-search-dropdown'; dropdown.hidden=true; dropdown.setAttribute('role','listbox'); wrap?.appendChild(dropdown);
  let activeIndex=-1; let blurTimer=null;
  const choose=(label)=>{
    const button=[...question.querySelectorAll('.ayna-row-choice')].find((candidate)=>text(candidate.querySelector('span:first-child')||candidate)===label);
    if(button){button.closest('.v6-support-category')?.classList.add('is-open');button.click();} setControlledInput(input,''); dropdown.hidden=true; wrap?.classList.remove('v6-intake-typeahead-open');
  };
  const render=()=>{
    const query=clean(input.value); if(!query){dropdown.hidden=true;wrap?.classList.remove('v6-intake-typeahead-open');activeIndex=-1;return;}
    const q=norm(query); const matches=labels.map((label)=>{const n=norm(label);let score=Number.POSITIVE_INFINITY;if(n===q)score=0;else if(n.startsWith(q))score=1;else if(n.includes(q))score=2+n.indexOf(q)/100;else if(q.split(' ').filter(Boolean).every((word)=>n.includes(word)))score=4;return{label,score};}).filter((entry)=>Number.isFinite(entry.score)).sort((a,b)=>a.score-b.score||a.label.localeCompare(b.label)).slice(0,8);
    dropdown.replaceChildren(); const heading=document.createElement('div'); heading.className='v6-typeahead-label'; heading.textContent=matches.length?'matching support options':'no exact option yet'; dropdown.appendChild(heading);
    matches.forEach(({label})=>{const button=document.createElement('button');button.type='button';button.className='v6-intake-search-row';button.setAttribute('role','option');button.innerHTML='<span></span><em>select +</em>';button.querySelector('span').textContent=label;button.addEventListener('mousedown',(event)=>event.preventDefault());button.addEventListener('click',()=>choose(label));dropdown.appendChild(button);});
    if(!matches.length){const hint=document.createElement('div');hint.className='v6-intake-search-empty';hint.textContent='Try a broader word, or open “Other” below.';dropdown.appendChild(hint);} dropdown.hidden=false;wrap?.classList.add('v6-intake-typeahead-open');activeIndex=-1;
  };
  input.addEventListener('focus',()=>{window.clearTimeout(blurTimer);render();});input.addEventListener('input',()=>window.requestAnimationFrame(render));input.addEventListener('blur',()=>{blurTimer=window.setTimeout(()=>{dropdown.hidden=true;wrap?.classList.remove('v6-intake-typeahead-open');},180);});
  input.addEventListener('keydown',(event)=>{if(dropdown.hidden)return;const rows=[...dropdown.querySelectorAll('button')];if(!rows.length)return;if(event.key==='ArrowDown'){event.preventDefault();activeIndex=(activeIndex+1)%rows.length;}else if(event.key==='ArrowUp'){event.preventDefault();activeIndex=(activeIndex-1+rows.length)%rows.length;}else if(event.key==='Enter'&&activeIndex>=0){event.preventDefault();rows[activeIndex]?.click();return;}else if(event.key==='Escape'){dropdown.hidden=true;wrap?.classList.remove('v6-intake-typeahead-open');return;}else return;rows.forEach((row,index)=>row.classList.toggle('is-keyboard-active',index===activeIndex));});
}

function updateAuthSheetMode() {
  document.querySelectorAll('.v6-auth-overlay').forEach((overlay)=>{
    const card=overlay.querySelector('.v6-auth-card'); if(!card)return; const tagline=text(card.querySelector('.v6-auth-tagline'));
    const isQuizAccount=Boolean(document.querySelector('.ayna-intake-root')) || /save your health profile|build your ecosystem/i.test(tagline);
    overlay.classList.toggle('v6-auth-sheet-mode',!isQuizAccount);
  });
}

function fixEcosystemStructure() {
  if(!document.documentElement.classList.contains('v6-page-ecosystem'))return;
  document.querySelector('.container.animate-fade-in-up')?.classList.add('v6-ecosystem-real-container');
}

function enhance() {
  bindCatalogTypeahead(document.querySelector('.v6-home-search input'),'home');
  bindCatalogTypeahead(document.querySelector('.ayna-browse__search input'),'browse');
  bindIntakeSupportTypeahead(document.querySelector('.ayna-intake-question .ayna-search-wrap input'));
  updateAuthSheetMode(); fixEcosystemStructure();
}

let timer=null; const observer=new MutationObserver(()=>{window.clearTimeout(timer);timer=window.setTimeout(enhance,24);});
function start(){observer.observe(document.documentElement,{childList:true,subtree:true});enhance();document.addEventListener('focusin',(event)=>{if(event.target?.matches?.('.v6-home-search input, .ayna-browse__search input, .ayna-intake-question .ayna-search-wrap input'))window.setTimeout(enhance,0);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
