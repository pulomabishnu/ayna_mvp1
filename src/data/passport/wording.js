/**
 * Dangerous-wording linter (spec 30). Flags catalog copy that makes medical
 * or safety promises: cures, treats, prevents, clinically proven, doctor
 * recommended, pregnancy safe, hormone balancing, detox, and close cousins.
 *
 * It flags, it never rewrites. A flag means "a person should check this has
 * the evidence and wording it needs", not "this is wrong".
 *
 * Severity:
 *   high   a medical or safety promise (cure, treat, prevent, pregnancy safe)
 *   medium an authority or proof claim (clinically proven, doctor recommended)
 *   low    a vague wellness claim (detox, hormone balancing)
 */
export const WORDING_RULES = [
  { id: 'cure', severity: 'high', label: 'cures', re: /\b(?:cures?|cured|curing)\b/i },
  { id: 'treat', severity: 'high', label: 'treats', re: /\b(?:treats|treating)\b(?!\s+(?:yourself|herself|you))/i },
  { id: 'prevent', severity: 'high', label: 'prevents', re: /\b(?:prevents?|preventing|prevention of)\b(?!\s+(?:\w+\s+){0,2}(?:leaks?|leaking|stains?|staining|odou?rs?|chafing|slipping|spills?|bunching|shifting))/i },
  { id: 'heal', severity: 'high', label: 'heals', re: /\bheals?\b/i },
  { id: 'pregnancy-safe', severity: 'high', label: 'pregnancy safe', re: /\b(?:pregnancy[- ]safe|safe (?:during|in|for) pregnancy|safe while pregnant|safe for (?:pregnant|breastfeeding|nursing))\b/i },
  { id: 'guaranteed', severity: 'high', label: 'guaranteed / 100% safe', re: /\b(?:guarantee[ds]?|100% safe|completely safe|totally safe|risk[- ]free|no side effects)\b/i },
  { id: 'fda-approved', severity: 'medium', label: 'FDA approved', re: /\bfda[- ]approved\b/i },
  { id: 'clinically-proven', severity: 'medium', label: 'clinically proven', re: /\b(?:clinically|scientifically|medically) (?:proven|tested|validated)\b/i },
  { id: 'doctor-recommended', severity: 'medium', label: 'doctor recommended', re: /\b(?:doctor|gyn(?:a|e)?ecologist|ob-?gyn|physician|dermatologist|clinician)[- ](?:recommended|approved|trusted)\b/i },
  { id: 'hormone-balancing', severity: 'low', label: 'hormone balancing', re: /\b(?:hormone[- ]balanc\w*|balanc\w* (?:your |the )?hormones?|hormonal balance)\b/i },
  { id: 'detox', severity: 'low', label: 'detox', re: /\bdetox\w*\b/i },
  { id: 'boost-immunity', severity: 'low', label: 'boosts immunity', re: /\bboosts? (?:your )?immun\w*/i },
];

// Hedged uses ("may help prevent") are softer: kept, but downgraded to low.
const HEDGE = /\b(?:may|might|can|could) (?:help(?: to)?|support)\s*$/i;
// Negated uses are not claims: "not a cure", "does not treat".
const NEGATION = /\b(?:not|no|never|isn['’]t|doesn['’]t|don['’]t|cannot|can['’]t|won['’]t|without|nor|n['’]t)\b[^.]{0,30}$/i;

/** Copy fields that are shown to people, with a short label. */
export const LINTED_FIELDS = [
  ['name', 'Name'],
  ['summary', 'Summary'],
  ['effectiveness', 'Effectiveness'],
  ['doctorOpinion', 'Clinician opinion'],
  ['doctorOpinionShort', 'Clinician opinion (short)'],
  ['communityReview', 'Community summary'],
  ['recommendationWhyDetail', 'Why recommended'],
  ['badges', 'Badges'],
  ['whoItsFor', "Who it's for"],
  ['howToUse.intro', 'How to use'],
];

function fieldText(product, path) {
  const v = path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), product);
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string').join(' | ');
  return typeof v === 'string' ? v : '';
}

/** Lint one string. Returns [{ rule, severity, label, match, excerpt }]. */
export function lintText(text) {
  const t = String(text || '');
  if (!t) return [];
  const out = [];
  for (const rule of WORDING_RULES) {
    const re = new RegExp(rule.re.source, 'gi');
    let m;
    while ((m = re.exec(t))) {
      const before = t.slice(Math.max(0, m.index - 40), m.index);
      if (NEGATION.test(before)) continue;
      const start = Math.max(0, m.index - 50);
      const end = Math.min(t.length, m.index + m[0].length + 50);
      const hedged = HEDGE.test(before.trimEnd());
      out.push({
        rule: rule.id,
        severity: hedged ? 'low' : rule.severity,
        hedged,
        label: rule.label,
        match: m[0],
        excerpt: `${start > 0 ? '…' : ''}${t.slice(start, end).replace(/\s+/g, ' ').trim()}${end < t.length ? '…' : ''}`,
      });
    }
  }
  return out;
}

/** Lint every shown copy field on a product. */
export function lintProductCopy(product) {
  const out = [];
  for (const [path, label] of LINTED_FIELDS) {
    for (const hit of lintText(fieldText(product, path))) out.push({ ...hit, field: path, fieldLabel: label });
  }
  return out;
}
