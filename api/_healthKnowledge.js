/* global process */
import { createClient } from '@supabase/supabase-js';

// Server-only health knowledge lookup. Sensitive health queries should stay
// inside ayna whenever our reviewed knowledge base can cover the topic. An
// external search is allowed only after the database was successfully queried
// and returned no adequate match. If the database is unavailable, we fail
// closed for privacy and use the small reviewed local index below when it can
// help; we never interpret an outage as permission to disclose a health query.

let _admin = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}

// This fallback mirrors the currently published, sourced Articles library.
// It exists only so a database outage never turns into an accidental external
// disclosure. The database remains authoritative whenever it is reachable.
const LOCAL_REVIEWED_INDEX = [
  {
    slug: 'intimate-wash',
    topic: 'Intimate Washes',
    aliases: ['intimate wash', 'vaginal wash', 'vulva wash', 'vulvar hygiene', 'vaginal hygiene', 'intimate care'],
    summary: 'Why the vagina is self-cleaning, when to use or skip cleansers, and what OB-GYNs recommend for external care.',
    source_names: ['UpToDate', 'ACOG', 'CDC'],
    article_id: 'intimate-wash',
  },
  {
    slug: 'heavy-bleeding',
    topic: 'Heavy Menstrual Bleeding',
    aliases: ['heavy bleeding', 'heavy period', 'heavy periods', 'menorrhagia', 'heavy flow'],
    summary: 'What counts as heavy bleeding, possible causes, when to seek care, and how it is evaluated and treated.',
    source_names: ['UpToDate', 'ACOG', 'CDC'],
    article_id: 'heavy-bleeding',
  },
  {
    slug: 'menopause-basics',
    topic: 'Menopause & Perimenopause',
    aliases: ['menopause', 'perimenopause', 'hot flashes', 'hot flushes', 'night sweats'],
    summary: 'What perimenopause and menopause are, common symptoms, and how hormone therapy and lifestyle changes can help.',
    source_names: ['NAMS', 'UpToDate', 'ACOG'],
    article_id: 'menopause-basics',
  },
  {
    slug: 'uti-prevention',
    topic: 'UTI Prevention',
    aliases: ['uti', 'urinary tract infection', 'recurrent uti', 'bladder infection', 'urinary health'],
    summary: 'Evidence-backed ways to reduce UTI risk and when to see a clinician for recurrent infections.',
    source_names: ['UpToDate', 'NIH', 'CDC'],
    article_id: 'uti-prevention',
  },
  {
    slug: 'yeast-infection-basics',
    topic: 'Yeast Infection Basics',
    aliases: ['yeast infection', 'candidiasis', 'vaginal yeast', 'vulvovaginal candidiasis'],
    summary: 'What causes yeast infections, how to recognize them, when to treat at home versus see a clinician, and how to prevent recurrence.',
    source_names: ['UpToDate', 'CDC', 'ACOG'],
    article_id: 'yeast-infection-basics',
  },
  {
    slug: 'period-pain-when-to-seek-care',
    topic: 'Period Pain: When to Seek Care',
    aliases: ['period pain', 'period cramps', 'menstrual cramps', 'dysmenorrhea', 'painful period'],
    summary: 'Normal cramps versus signs that something else may be going on, and what treatments and workups clinicians may suggest.',
    source_names: ['ACOG', 'UpToDate', 'Mayo Clinic'],
    article_id: 'period-pain-when-to-seek-care',
  },
  {
    slug: 'pcos-basics',
    topic: 'PCOS: What It Is and How It Is Managed',
    aliases: ['pcos', 'polycystic ovary syndrome', 'polycystic ovarian syndrome', 'irregular ovulation', 'hyperandrogenism'],
    summary: 'Polycystic ovary syndrome explained: diagnosis, symptoms, and evidence-based treatment options including lifestyle and medication.',
    source_names: ['ACOG', 'Endocrine Society', 'UpToDate'],
    article_id: 'pcos-basics',
  },
  {
    slug: 'pelvic-floor-dysfunction',
    topic: 'Pelvic Floor Dysfunction',
    aliases: ['pelvic floor', 'pelvic floor dysfunction', 'pelvic floor therapy', 'pelvic floor pt', 'pelvic pressure'],
    summary: 'What the pelvic floor does, common symptoms of dysfunction, and how pelvic floor physical therapy and at-home tools can help.',
    source_names: ['ACOG', 'UpToDate', 'APTA'],
    article_id: 'pelvic-floor-dysfunction',
  },
  {
    slug: 'endometriosis-basics',
    topic: 'Endometriosis: Symptoms, Diagnosis, and Care',
    aliases: ['endometriosis', 'endo pain', 'endometrioma', 'painful sex endometriosis'],
    summary: 'What endometriosis is, how it is diagnosed, and treatment options from pain management to surgery and fertility support.',
    source_names: ['ACOG', 'Endometriosis Foundation of America', 'UpToDate'],
    article_id: 'endometriosis-basics',
  },
  {
    slug: 'bacterial-vaginosis',
    topic: 'Bacterial Vaginosis (BV)',
    aliases: ['bacterial vaginosis', 'bv', 'fishy odor', 'vaginal odor'],
    summary: 'What causes BV, how it differs from a yeast infection, treatment options, and why it tends to recur.',
    source_names: ['CDC', 'ACOG', 'UpToDate'],
    article_id: 'bacterial-vaginosis',
  },
  {
    slug: 'pmdd',
    topic: 'PMDD: Premenstrual Dysphoric Disorder',
    aliases: ['pmdd', 'premenstrual dysphoric disorder', 'severe pms', 'pms mood', 'cycle mood'],
    summary: 'How PMDD differs from PMS, what causes it, and evidence-based treatments including SSRIs, hormonal options, and lifestyle support.',
    source_names: ['ACOG', 'IAPMD', 'UpToDate'],
    article_id: 'pmdd',
  },
  {
    slug: 'fibroids',
    topic: 'Uterine Fibroids',
    aliases: ['fibroids', 'uterine fibroid', 'leiomyoma', 'uterine fibroids'],
    summary: 'What fibroids are, why they can cause heavy bleeding and pain, and the range of treatment options from watchful waiting to surgery.',
    source_names: ['ACOG', 'NIH', 'UpToDate'],
    article_id: 'fibroids',
  },
  {
    slug: 'iron-deficiency-anemia',
    topic: 'Iron Deficiency & Anemia from Heavy Periods',
    aliases: ['iron deficiency', 'anemia', 'anaemia', 'low iron', 'ferritin', 'heavy periods anemia'],
    summary: 'How heavy periods can deplete iron, symptoms to watch for, and how deficiency is addressed through diet, supplements, and treating the root cause.',
    source_names: ['ACOG', 'NIH', 'UpToDate'],
    article_id: 'iron-deficiency-anemia',
  },
  {
    slug: 'ovarian-cysts',
    topic: 'Ovarian Cysts',
    aliases: ['ovarian cyst', 'ovarian cysts', 'ruptured cyst', 'ovary cyst'],
    summary: 'Most ovarian cysts are harmless and resolve on their own. Learn when monitoring is enough and when to seek care.',
    source_names: ['ACOG', 'Mayo Clinic', 'UpToDate'],
    article_id: 'ovarian-cysts',
  },
  {
    slug: 'hormonal-birth-control',
    topic: 'Hormonal Birth Control: Types, Benefits & Side Effects',
    aliases: ['birth control', 'hormonal birth control', 'contraception', 'contraceptive pill', 'iud', 'implant'],
    summary: 'A plain-language guide to pills, patches, rings, shots, implants, and hormonal IUDs: how they work, common side effects, and how to choose.',
    source_names: ['ACOG', 'Planned Parenthood', 'UpToDate'],
    article_id: 'hormonal-birth-control',
  },
];

const SENSITIVE_HEALTH_TERMS = [
  'period', 'menstrual', 'menstruation', 'bleeding', 'cramp', 'pelvic', 'vagina', 'vaginal', 'vulva', 'vulvar',
  'discharge', 'odor', 'itching', 'uti', 'urinary', 'bladder infection', 'yeast infection', 'bacterial vaginosis',
  'pcos', 'polycystic', 'endometriosis', 'fibroid', 'ovarian cyst', 'pmdd', 'pms', 'menopause', 'perimenopause',
  'fertility', 'infertility', 'trying to conceive', 'pregnan', 'postpartum', 'birth control', 'contraception',
  'hormone', 'sexual health', 'painful sex', 'dyspareunia', 'vaginismus', 'vulvodynia', 'iron deficiency', 'anemia',
  'symptom', 'diagnos', 'medication', 'allergy', 'reproductive', 'cycle', 'hot flash', 'night sweat',
];

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'because', 'before', 'best', 'could', 'does', 'from', 'have', 'help', 'into',
  'just', 'like', 'more', 'most', 'need', 'product', 'products', 'should', 'that', 'their', 'there', 'these', 'they',
  'this', 'those', 'what', 'when', 'where', 'which', 'with', 'women', 'womens', 'would', 'your', 'youre', 'want',
]);

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return normalize(value)
    .split(' ')
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

function scoreRow(query, row) {
  const q = normalize(query);
  if (!q) return 0;
  const aliases = Array.isArray(row?.aliases) ? row.aliases : [];
  const topic = String(row?.topic || '');
  const summary = String(row?.summary || row?.content || '');
  const haystack = normalize([topic, ...aliases, summary].join(' '));
  if (!haystack) return 0;

  let score = 0;
  const topicNorm = normalize(topic);
  if (topicNorm && (q.includes(topicNorm) || topicNorm.includes(q))) score += 8;
  for (const alias of aliases) {
    const a = normalize(alias);
    if (a && (q.includes(a) || (a.length > 5 && a.includes(q)))) score += 6;
  }

  const qTokens = [...new Set(tokens(q))];
  const hayTokens = new Set(tokens(haystack));
  let overlap = 0;
  for (const t of qTokens) if (hayTokens.has(t)) overlap += 1;
  score += overlap * 1.5;
  if (qTokens.length && overlap / qTokens.length >= 0.5) score += 3;
  return score;
}

function rankRows(query, rows, limit) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({ row, score: scoreRow(query, row) }))
    .filter(({ score }) => score >= 4.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ row }) => row);
}

export function isSensitiveHealthQuery(query) {
  const q = normalize(query);
  if (!q) return false;
  if (SENSITIVE_HEALTH_TERMS.some((term) => q.includes(normalize(term)))) return true;
  return rankRows(q, LOCAL_REVIEWED_INDEX, 1).length > 0;
}

export function minimizeExternalHealthQuery(query) {
  let q = String(query || '');
  q = q
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, ' ')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, ' ')
    .replace(/\b\d{5}(?:-\d{4})?\b/g, ' ')
    .replace(/\b(?:i am|i'm|im|i have|i've|ive|my|me|mine|we have|our|currently|diagnosed with|taking|age|years? old|live in|located in)\b/gi, ' ')
    .replace(/\b\d+(?:\.\d+)?\b/g, ' ')
    .replace(/[^a-zA-Z0-9&+\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!q) return 'women health product information';
  return q.slice(0, 160);
}

function toInternalHits(matches, source) {
  return matches.map((row) => ({
    title: row.topic || row.slug || 'Ayna health knowledge',
    snippet: String(row.summary || row.content || '').slice(0, 600),
    url: row.article_id ? `/articles/${encodeURIComponent(row.article_id)}` : '',
    sourceType: 'ayna_knowledge',
    knowledgeSource: source,
    sourceNames: Array.isArray(row.source_names) ? row.source_names.slice(0, 6) : [],
  }));
}

export async function lookupHealthKnowledge(query, { limit = 4 } = {}) {
  const safeLimit = Math.max(1, Math.min(8, Number(limit) || 4));
  const admin = getAdmin();

  if (admin) {
    try {
      const { data, error } = await admin
        .from('health_knowledge')
        .select('slug,topic,aliases,summary,content,source_names,source_urls,article_id')
        .eq('active', true)
        .eq('review_status', 'approved')
        .limit(250);

      if (!error) {
        const matches = rankRows(query, data, safeLimit);
        return { status: 'ok', matches, source: 'database' };
      }
      console.error('[health-knowledge] database lookup failed:', error.message || error.code || 'unknown');
    } catch (e) {
      console.error('[health-knowledge] database lookup threw:', e?.message || e);
    }
  }

  // Database unavailable: local reviewed index may answer, but external search
  // remains disallowed because an outage is not the same thing as a true miss.
  return {
    status: 'unavailable',
    matches: rankRows(query, LOCAL_REVIEWED_INDEX, safeLimit),
    source: 'local-fallback',
  };
}

export async function routeHealthQuery(query, { limit = 4 } = {}) {
  const sensitive = isSensitiveHealthQuery(query);
  if (!sensitive) {
    return { sensitive: false, allowExternal: true, internalHits: [], minimizedQuery: String(query || '') };
  }

  const lookup = await lookupHealthKnowledge(query, { limit });
  const internalHits = toInternalHits(lookup.matches, lookup.source);
  return {
    sensitive: true,
    internalHits,
    // Only a successful, authoritative DB lookup with zero matches qualifies
    // as a real knowledge-base miss. DB/config/network failure fails closed.
    allowExternal: lookup.status === 'ok' && internalHits.length === 0,
    minimizedQuery: minimizeExternalHealthQuery(query),
    knowledgeStatus: lookup.status,
    knowledgeSource: lookup.source,
  };
}
