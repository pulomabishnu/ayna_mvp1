/**
 * Ranking + filtering for the Early Stage Startups page (ported from the
 * mobile app's EarlyStageScreen in ProfileFlow.jsx). Operates only on the
 * real startups returned by /api/startups (Airtable / early_stage_startups);
 * it never adds or invents entries.
 */
import { inferTagsFromHealthProfile } from './healthDataProfile';

// Same frustration -> tag vocabulary Airtable's "Symptom Tags" were filled
// in against (mirrors src/data/startups.js / the mobile screen).
export const FRUSTRATION_TAG_MAP = {
  'Heavy flow': 'heavy-flow',
  'Painful cramps': 'cramps',
  'Hormonal bloating': 'bloating',
  'Irregular cycles': 'irregular',
  'Leaks & staining': 'leaks',
  'General discomfort': 'discomfort',
  'Not sure if products are safe': 'safety-concern',
  'Recurrent UTIs': 'uti',
  'PCOS symptoms': 'pcos',
  'Pelvic pain': 'pelvic-floor',
  'Menopause symptoms': 'menopause',
  'Endometriosis': 'endometriosis',
};

/** Tags describing the viewer, from quiz frustrations + (optional) health profile. */
export function getViewerTags(quizResults, healthProfile = null) {
  const tags = new Set();
  (quizResults?.frustrations || []).forEach((f) => {
    const tag = FRUSTRATION_TAG_MAP[f];
    if (tag) tags.add(tag);
  });
  let inferred = [];
  try {
    inferred = inferTagsFromHealthProfile(healthProfile) || [];
  } catch {
    inferred = [];
  }
  inferred.forEach((t) => tags.add(t));
  return tags;
}

/** Symptom tags on `startup` that overlap the viewer's tags. */
export function matchedTags(startup, viewerTags) {
  if (!viewerTags || viewerTags.size === 0) return [];
  return (startup?.tags || []).filter((t) => viewerTags.has(t));
}

/**
 * Stable sort: most overlapping symptom tags first; ties keep featured
 * startups first, then the API's own order. With no viewer signal, the API
 * order is kept (featured first).
 */
export function rankStartups(startups, viewerTags) {
  const list = Array.isArray(startups) ? startups : [];
  return list
    .map((s, i) => ({ s, i, score: matchedTags(s, viewerTags).length }))
    .sort((a, b) => (b.score - a.score) || ((b.s.featured === true) - (a.s.featured === true)) || (a.i - b.i))
    .map((x) => x.s);
}

// There's no dedicated "clinical" field; Airtable's Tags (badges) are the
// closest honest proxy for some form of clinical/medical involvement.
export const CLINICAL_BADGES = new Set(['Clinically Backed', 'Doctor-Founded', 'FDA-Cleared']);

export const STARTUP_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'for-you', label: 'For you' },
  { key: 'women', label: 'Women-founded' },
  { key: 'preseed', label: 'Pre-seed' },
  { key: 'clinical', label: 'Clinical' },
];

export function matchesStartupFilter(startup, filter, viewerTags) {
  if (filter === 'for-you') return matchedTags(startup, viewerTags).length > 0;
  if (filter === 'women') return startup.womenFounded === true;
  if (filter === 'preseed') return startup.stage === 'Pre-Seed';
  if (filter === 'clinical') return (startup.badges || []).some((b) => CLINICAL_BADGES.has(b));
  return true;
}

/**
 * Display text for a badge. Regulatory claims in Airtable come from the
 * founders, not from an FDA lookup (see CLAUDE.md), so they're attributed.
 */
export function badgeLabel(badge) {
  if (/fda/i.test(badge || '')) return `${badge} (per the brand)`;
  return badge;
}

export function formatCategoryLabel(category) {
  if (!category) return '';
  return category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Only allow http(s) links from the API (defense against odd Airtable values). */
export function safeHttpUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const s = url.trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(s)) return `https://${s}`;
  return null;
}
