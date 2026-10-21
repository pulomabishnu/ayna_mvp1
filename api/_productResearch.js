/**
 * Shared rules for "Research this product" (api/research-product.js).
 *
 * The same rules the team used by hand (Eliz's Neycher page is the model):
 * the brand's own instructions for how to use it, only credible clinical and
 * science sources, reviews only when real ones can be linked, plain words and
 * no dashes. Everything here is pure so it can be tested without a network.
 */
import { isCredibleScienceSource } from '../src/data/sourcePolicy.js';

export const SECTIONS = ['who', 'how', 'clinical', 'science', 'reviews'];

/** Government, peer-reviewed journals, medical societies, academic medical centers. */
export const CREDIBLE_HOST = /(\.gov$|\.gov\.[a-z]{2}$|\.mil$|nhs\.uk$|nice\.org\.uk$|who\.int$|europa\.eu$|nih\.gov$|pubmed|cochranelibrary\.com$|cochrane\.org$|doi\.org$|nejm\.org$|jamanetwork\.com$|thelancet\.com$|bmj\.com$|nature\.com$|sciencedirect\.com$|springer\.com$|wiley\.com$|tandfonline\.com$|sagepub\.com$|frontiersin\.org$|mdpi\.com$|plos\.org$|oup\.com$|lww\.com$|ajog\.org$|acog\.org$|aafp\.org$|asrm\.org$|reproductivefacts\.org$|menopause\.org$|endocrine\.org$|ics\.org$|issm\.info$|isswsh\.org$|mayoclinic\.org$|clevelandclinic\.org$|hopkinsmedicine\.org$|health\.harvard\.edu$|medlineplus\.gov$|cancer\.org$|aad\.org$|apa\.org$|jmir\.org$|healthychildren\.org$|aap\.org$|thieme-connect\.com$|cureus\.com$|koreamed\.org$)/i;

export function isSearchUrl(url) {
  try {
    const u = new URL(url);
    return /\/search\b|\/results\b/i.test(u.pathname) || /[?&](q|query|search|search_query)=/i.test(u.search);
  } catch {
    return true;
  }
}

export function isCredibleUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || isSearchUrl(url)) return false;
    // Both the host allowlist and the site-wide source policy (no .com
    // science sources: journal papers are linked through PubMed or PMC).
    return CREDIBLE_HOST.test(u.hostname.replace(/^www\./, '')) && isCredibleScienceSource(url);
  } catch {
    return false;
  }
}

/** ayna copy never uses em or en dashes. */
export function plain(text) {
  return String(text || '')
    .replace(/\s*[—]\s*/g, ', ')
    .replace(/(\d)\s*[–]\s*(\d)/g, '$1 to $2')
    .replace(/\s*[–]\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

// A named doctor we can't trace, invented-sounding stats and hype words are refused.
const HYPE = /\b(game[- ]?changer|holy grail|miracle|cure[sd]?\b|guarantee[sd]?|clinically proven to cure)\b/i;
const NAMED_DOCTOR = /\bDr\.\s+[A-Z][a-z]+/;

const STYLE = `Tone: plain, warm, direct, short sentences, "you" where natural. Never use em dashes or en dashes; write "4 to 8 hours". No hype, no filler, nothing that sounds AI-written. Never invent facts, studies, numbers, people, quotes, reviews or prices. If you can't verify something, leave it out and say why in "skipped".`;

const TASKS = {
  who: `Write "whoItsFor": 3 or 4 short bullets on who this product suits, based on what the brand says it is for and what credible sources support. You may add one bullet starting "Not the pick for" when the brand or a credible source states a limit or contraindication. Return {"whoItsFor": [...], "sources": [{"url","label"}], "skipped": ""}.`,
  how: `Write "howToUse" from the BRAND'S OWN instructions (product page, FAQ, label or user guide). For a generic product type with no brand instructions, use official guidance (FDA, NHS, Mayo Clinic) and say so in the intro. 3 to 6 short imperative steps. For supplements, give dose and timing exactly as the label states. For apps and services, how to get started. Return {"howToUse": {"intro": "Per {Brand}'s instructions:", "steps": [...], "sourceUrl": "...", "sourceLabel": "..."}, "skipped": ""}.`,
  clinical: `Find 1 to 3 CLINICAL GUIDANCE sources relevant to using this product or product type, ONLY from government health agencies, medical societies or academic medical centers (FDA, CDC, NIH, NHS, ACOG, AAFP, ASRM, The Menopause Society, Mayo Clinic, Cleveland Clinic, Johns Hopkins, MedlinePlus). Only .gov, .edu or medical-society and academic-medical-center .org sites. Never .com, brand sites, news, blogs or Healthline. Return {"clinicalSources": [{"url","label","summary": "one sentence on what it says that matters for this product"}], "skipped": ""}.`,
  science: `Find 1 to 3 STUDIES (trials, systematic reviews, meta-analyses) about this exact product, its key ingredients, or its product type, ONLY peer-reviewed papers, linked through their PubMed record (https://pubmed.ncbi.nlm.nih.gov/<PMID>/) or PMC full text (https://pmc.ncbi.nlm.nih.gov/articles/PMC<id>/), never the publisher's .com page, never preprints (medRxiv, bioRxiv). Strongest designs first: systematic reviews and meta-analyses, then randomized controlled trials; animal, cell, case-report or small observational studies only when nothing stronger exists, and say so. State the design and sample size in the summary. Prefer a study of this exact product. Say plainly when a study is about the ingredient or product type, not this product. Return {"scienceSources": [{"url","label","summary": "one sentence on what it found"}], "skipped": ""}.`,
  reviews: `Read real, public customer reviews or discussions (retailer reviews, Trustpilot, Reddit threads, YouTube reviews). Write "communityReview": 2 to 4 sentences on recurring themes, positive AND negative ("Reviewers often praise X. Common complaints are Y."). No star numbers unless you saw them. If reviews are only brand-picked testimonials, look unreliable, or you can't find real ones, return an empty review and say why. Return {"communityReview": "...", "sources": [{"url","label"}], "skipped": ""}.`,
};

export function buildPrompt(product, section) {
  const p = product || {};
  const facts = [
    `Name: ${p.name || ''}`,
    p.brand && `Brand: ${p.brand}`,
    p.category && `Category: ${p.category}`,
    p.url && `Brand page: ${p.url}`,
    p.summary && `ayna's summary: ${p.summary}`,
    p.ingredients && `Ingredients on file: ${p.ingredients}`,
  ].filter(Boolean).join('\n');
  return `You are researching one product for ayna, a women's health product site. The team writes these pages by hand; you are filling one empty section.\n\n${facts}\n\nTask: ${TASKS[section]}\n\nUse web search to find sources and open each page before citing it. Never cite a search-results page. ${STYLE}\n\nReply with ONLY the JSON object.`;
}

function cleanSources(list, { credibleOnly }, issues, field) {
  const out = [];
  const seen = new Set();
  for (const s of Array.isArray(list) ? list : []) {
    const url = String(s?.url || '').trim();
    if (!url || seen.has(url)) continue;
    if (!/^https:\/\//i.test(url)) { issues.push(`${field}: removed a link that isn't https (${url})`); continue; }
    if (isSearchUrl(url)) { issues.push(`${field}: removed a search-results link (${url})`); continue; }
    if (credibleOnly && !isCredibleUrl(url)) { issues.push(`${field}: removed a source that isn't a government, journal or medical-society site (${url})`); continue; }
    seen.add(url);
    out.push({ url, label: plain(s.label || s.title || url).slice(0, 200), ...(s.summary ? { summary: plain(s.summary).slice(0, 400) } : {}) });
  }
  return out.slice(0, 3);
}

function checkText(text, issues, field) {
  const t = plain(text);
  if (NAMED_DOCTOR.test(t)) { issues.push(`${field}: names a doctor; removed until the team confirms it`); return ''; }
  if (HYPE.test(t)) { issues.push(`${field}: uses a claim word we don't allow (cure, guarantee, miracle); removed`); return ''; }
  return t;
}

/**
 * Turn the model's JSON into a safe draft for one section.
 * @returns {{ draft: object, issues: string[], empty: boolean }}
 */
export function sanitizeDraft(section, raw) {
  const issues = [];
  const r = raw && typeof raw === 'object' ? raw : {};
  let draft = {};
  if (section === 'who') {
    const items = (Array.isArray(r.whoItsFor) ? r.whoItsFor : []).map((x) => checkText(x, issues, 'whoItsFor')).filter(Boolean).slice(0, 4);
    draft = { whoItsFor: items, sources: cleanSources(r.sources, { credibleOnly: false }, issues, 'sources') };
  } else if (section === 'how') {
    const h = r.howToUse || {};
    const steps = (Array.isArray(h.steps) ? h.steps : []).map((x) => checkText(x, issues, 'howToUse')).filter(Boolean).slice(0, 6);
    const src = cleanSources([{ url: h.sourceUrl, label: h.sourceLabel }], { credibleOnly: false }, issues, 'howToUse source')[0];
    if (steps.length && !src) issues.push('howToUse: no source page for the steps, so they were dropped');
    draft = steps.length && src ? { howToUse: { intro: checkText(h.intro, issues, 'howToUse intro'), steps, sourceUrl: src.url, sourceLabel: src.label } } : { howToUse: null };
  } else if (section === 'clinical') {
    draft = { clinicalSources: cleanSources(r.clinicalSources, { credibleOnly: true }, issues, 'clinicalSources') };
  } else if (section === 'science') {
    draft = { scienceSources: cleanSources(r.scienceSources, { credibleOnly: true }, issues, 'scienceSources') };
  } else if (section === 'reviews') {
    const sources = cleanSources(r.sources, { credibleOnly: false }, issues, 'review sources');
    let text = checkText(r.communityReview, issues, 'communityReview');
    if (text && !sources.length) { issues.push('communityReview: no review pages linked, so the summary was dropped'); text = ''; }
    draft = { communityReview: text, sources };
  }
  if (r.skipped) issues.push(`Researcher note: ${plain(r.skipped)}`);
  const empty = !(
    (draft.whoItsFor || []).length || draft.howToUse || (draft.clinicalSources || []).length
    || (draft.scienceSources || []).length || draft.communityReview
  );
  return { draft, issues, empty };
}

/** Every URL a draft cites, for the reachability check. */
export function draftUrls(draft) {
  const d = draft || {};
  return [
    ...(d.sources || []).map((s) => s.url),
    ...(d.clinicalSources || []).map((s) => s.url),
    ...(d.scienceSources || []).map((s) => s.url),
    d.howToUse?.sourceUrl,
  ].filter(Boolean);
}

/** Remove links that didn't load from a draft. */
export function dropUrls(draft, dead) {
  if (!dead.size) return draft;
  const keep = (list) => (list || []).filter((s) => !dead.has(s.url));
  const d = { ...draft };
  if (d.sources) d.sources = keep(d.sources);
  if (d.clinicalSources) d.clinicalSources = keep(d.clinicalSources);
  if (d.scienceSources) d.scienceSources = keep(d.scienceSources);
  if (d.howToUse && dead.has(d.howToUse.sourceUrl)) d.howToUse = null;
  if (d.communityReview && d.sources && !d.sources.length) d.communityReview = '';
  return d;
}
