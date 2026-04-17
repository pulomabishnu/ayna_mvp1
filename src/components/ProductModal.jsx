import React, { useState, useEffect, useMemo } from 'react';
import Disclaimer from './Disclaimer';
import { getProfileMatchLabelsForProduct, getRecommendationExplanation, getPrescriptionAccessGuidance } from '../data/products';
import { getHowToUseContent } from '../data/productHowToUse';
import { getAynaRating } from '../data/aynaReviews';
import { fetchProductInsights } from '../utils/fetchProductInsights';
import { buildUserHealthContextString } from '../utils/userHealthContextForInsights';
import { buildProfileTailoring } from '../utils/profileProductTailoring';
import { fetchFdaRecall } from '../utils/fetchFdaRecall';
import { fetchPubmedArticles } from '../utils/fetchPubmedArticles';
import { resolveProductImage, isPlaceholderProductImage } from '../utils/resolveProductImage';

// Build purchase/search URLs for common retailers (product name encoded). Keys matched by store name.
const STORE_SEARCH_URLS = {
  'Amazon': (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
  'Target': (q) => `https://www.target.com/s?searchTerm=${encodeURIComponent(q)}`,
  'Walmart': (q) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}`,
  'CVS': (q) => `https://www.cvs.com/shop/search?searchTerm=${encodeURIComponent(q)}`,
  'Whole Foods': (q) => `https://www.amazon.com/wholefoods/s?k=${encodeURIComponent(q)}`,
  'iHerb': (q) => `https://www.iherb.com/search?kw=${encodeURIComponent(q)}`,
  'Ulta': (q) => `https://www.ulta.com/shop/all?search=${encodeURIComponent(q)}`,
  'Sephora': (q) => `https://www.sephora.com/search?keyword=${encodeURIComponent(q)}`,
  'App Store': () => 'https://apps.apple.com/',
  'Google Play': () => 'https://play.google.com/store',
  'Ritual.com': () => 'https://www.ritual.com/',
  'Ritual': () => 'https://www.ritual.com/',
  'LOLA.com': (q) => `https://www.mylola.com/search?q=${encodeURIComponent(q || '')}`,
  'OurKindra.com': () => 'https://ourkindra.com/',
  'Maude.com': (q) => `https://hellomaude.com/search?q=${encodeURIComponent(q || '')}`,
  'Maude': () => 'https://hellomaude.com/',
  'VisanaHealth.com': () => 'https://www.visanahealth.com/',
  'Saalt.com': (q) => `https://saalt.com/search?q=${encodeURIComponent(q || '')}`,
  'Saalt': (q) => `https://saalt.com/search?q=${encodeURIComponent(q || '')}`,
  'Thinx.com': () => 'https://www.shethinx.com/',
  'Thinx': () => 'https://www.shethinx.com/',
  'Bodily': () => 'https://itsbodily.com/',
  'ItsBodily.com': () => 'https://itsbodily.com/',
  'Best Buy': (q) => `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(q || '')}`,
  'Pharmacy with prescription': () => 'https://www.goodrx.com/',
};
// If the store name looks like a brand domain (e.g. Rael.com, Cora.life), return direct URL instead of Google search.
function isBrandDomain(storeName) {
  if (!storeName || typeof storeName !== 'string') return false;
  const normalized = storeName.trim().toLowerCase().replace(/\s+/g, '');
  return /^[a-z0-9][a-z0-9.-]*\.(com|io|co|life|health|org|net)$/i.test(normalized);
}
function brandDomainToUrl(storeName) {
  const normalized = storeName.trim().toLowerCase().replace(/\s+/g, '');
  return normalized.startsWith('http') ? normalized : `https://${normalized}`;
}
function getStoreUrl(storeName, productName) {
  if (!storeName || typeof storeName !== 'string') return 'https://www.google.com/search?q=women+health+products';
  if (isBrandDomain(storeName)) return brandDomainToUrl(storeName);
  const key = Object.keys(STORE_SEARCH_URLS).find(k => storeName.toLowerCase().replace(/\s+/g, '').includes(k.toLowerCase().replace(/\s+/g, '')) || k.toLowerCase() === storeName.toLowerCase());
  if (key) {
    const fn = STORE_SEARCH_URLS[key];
    const out = typeof fn === 'function' ? fn(productName || '') : fn;
    return (typeof out === 'string' && out.startsWith('http')) ? out : `https://www.google.com/search?q=${encodeURIComponent((productName || '') + ' ' + storeName)}`;
  }
  const safe = (productName || '') + ' ' + storeName;
  return `https://www.google.com/search?q=${encodeURIComponent(safe.trim() || 'women health products')}`;
}

// Ensure social/community links use working URLs (fix bare domains, http→https)
function normalizeSocialUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const u = url.trim();
  try {
    const noHash = u.replace(/#.*$/, '');
    if (/^https?:\/\/(www\.)?tiktok\.com\/?$/i.test(noHash)) return 'https://www.tiktok.com/search?q=women+health';
    const parsed = new URL(u);
    const host = (parsed.hostname || '').replace(/^www\./, '');
    if (parsed.protocol === 'http:' && /^(instagram|facebook|tiktok|youtube)\.com$/i.test(host)) return u.replace(/^http:/i, 'https:');
    return u;
  } catch (_) {
    return u;
  }
}

// Platform order and labels for grouped social links
const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram Reels & Posts', icon: '📷' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
  { key: 'youtube', label: 'YouTube & Shorts', icon: '▶️' },
  { key: 'reddit', label: 'Reddit', icon: '💬' },
  { key: 'facebook', label: 'Facebook', icon: '👥' },
  { key: 'wirecutter', label: 'NYT Wirecutter', icon: '📰' },
  { key: 'instyle', label: 'InStyle', icon: '📰' },
  { key: 'other', label: 'Other', icon: '🔗' }
];

function inferPlatform(url) {
  if (!url) return 'other';
  try {
    const host = (new URL(url).hostname || '').toLowerCase();
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('tiktok.com')) return 'tiktok';
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('reddit.com')) return 'reddit';
    if (host.includes('facebook.com') || host.includes('fb.com') || host.includes('fb.me')) return 'facebook';
    if (host.includes('nytimes.com') || host.includes('wirecutter.com') || host.includes('thewirecutter.com')) return 'wirecutter';
    if (host.includes('instyle.com')) return 'instyle';
  } catch (_) {}
  return 'other';
}

function truncate(s, max) {
  if (!s || typeof s !== 'string') return '';
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Normalize verification section: { links, aiSummary }, array, or single link */
function getVerificationSection(section) {
  if (!section) return { links: [], aiSummary: null };
  if (Array.isArray(section)) return { links: section.filter((l) => l && (l.url || l.href)), aiSummary: null };
  const url = section.url || section.href;
  if (url) return { links: [{ ...section, url }], aiSummary: section.aiSummary || null };
  const list = section.links || section.link;
  const arr = Array.isArray(list) ? list : list ? [list] : [];
  return {
    links: arr.filter((l) => l && (l.url || l.href)).map((l) => ({ ...l, url: l.url || l.href })),
    aiSummary: section.aiSummary || null,
  };
}

function countHttpsLinksInSection(section) {
  const { links } = getVerificationSection(section);
  return links.filter((l) => {
    const u = (l.url || l.href || '').trim();
    return u.startsWith('http://') || u.startsWith('https://');
  }).length;
}

/** Show FDA MedWatch only when our recall text suggests something to look into (not routine no-recalls boilerplate). */
function hasRecallConcern(product) {
  const r = product?.safety?.recalls || '';
  if (!r.trim()) return false;
  if (r.includes('⚠️')) return true;
  if (/no active|none listed|no recalls|no recall\b/i.test(r)) return false;
  return /\brecall\b|\balert\b|\bwarning\b|voluntary|withdrawn|fda has/i.test(r);
}

function productHasMeaningfulSafety(product) {
  const s = product?.safety;
  const safetyFields = s && typeof s === 'object'
    ? ['fdaStatus', 'materials', 'recalls', 'sideEffects', 'opinionAlerts']
    : [];
  const hasSafetyFields = safetyFields.some((k) => String(s[k] || '').trim().length > 0);
  const hasIngredients = String(product?.ingredients || '').trim().length > 0;
  return hasSafetyFields || hasIngredients;
}

function getMaterialsAndComponentsText(product) {
  const materials = String(product?.safety?.materials || '').trim();
  const ingredients = String(product?.ingredients || '').trim();
  if (materials && ingredients && materials.toLowerCase() !== ingredients.toLowerCase()) {
    return `${materials}\n\nIngredients: ${ingredients}`;
  }
  return materials || ingredients || 'N/A';
}

function productHasScienceSignals(product, aiInsights) {
  if ((product.effectiveness || '').trim().length >= 40) return true;
  if (countHttpsLinksInSection(product.verificationLinks?.scientific) > 0) return true;
  if ((aiInsights?.literatureLinks || []).length > 0) return true;
  return false;
}

function productHasCommunitySignals(product, aiInsights) {
  if ((product.communityReview || '').trim().length > 0) return true;
  if ((aiInsights?.communityLinks || []).length > 0) return true;
  if (countHttpsLinksInSection(product.verificationLinks?.community) > 0) return true;
  return false;
}

const MEDWATCH_URL =
  'https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program';

/** Heuristic: product-level evidence text looks thin or explicitly limited. */
function scienceEvidenceIsLimited(product) {
  const eff = (product.effectiveness || '').toLowerCase();
  if (!eff || eff.length < 50) return true;
  if (/aggregat|being summarized|still being|limited|preliminary|insufficient|unclear|mixed evidence|not a substitute/i.test(eff)) return true;
  if (/clinical effectiveness data.*aggregat|being aggregated/i.test(eff)) return true;
  return false;
}

function nonEmptyInsight(s) {
  const t = (s || '').trim();
  return t.length > 0 ? t : null;
}

const purpleInsightBoxStyle = {
  marginBottom: '1.25rem',
  padding: '1.25rem',
  borderRadius: 'var(--radius-lg)',
  background: 'linear-gradient(135deg, #FDF4FF 0%, #F5F3FF 100%)',
  border: '1px solid #E9D5FF',
};

function toInsightObject(bullets = []) {
  const cleaned = (bullets || []).map((b) => String(b || '').trim()).filter(Boolean);
  if (cleaned.length === 0) return null;
  return { bullets: cleaned };
}

function renderInsightBullets(insight) {
  if (!insight) return null;
  if (typeof insight === 'string') {
    return (
      <ul style={{ margin: 0, paddingLeft: '1.05rem', lineHeight: 1.65 }}>
        <li>{renderRichText(insight)}</li>
      </ul>
    );
  }
  const bullets = Array.isArray(insight?.bullets) ? insight.bullets : [];
  if (bullets.length === 0) return null;
  return (
    <ul style={{ margin: 0, paddingLeft: '1.05rem', lineHeight: 1.65 }}>
      {bullets.map((b, idx) => (
        <li key={idx} style={{ marginBottom: idx === bullets.length - 1 ? 0 : '0.35rem' }}>
          {renderRichText(b)}
        </li>
      ))}
    </ul>
  );
}

function getBridgeToCareGuidance(product) {
  if (!product) return null;
  if (String(product.category || '').toLowerCase() === 'telehealth') return null;

  const textBlob = [
    product.name,
    product.summary,
    product.effectiveness,
    product.doctorOpinion,
    product.communityReview,
    product.safety?.sideEffects,
    product.safety?.opinionAlerts,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const tags = new Set((product.tags || []).map((t) => String(t).toLowerCase()));
  const isUtiRelated =
    tags.has('uti') ||
    tags.has('uti-prevention') ||
    /uti|urinary|cystitis|bladder/.test(textBlob);
  const isAzoOrCystex = /(^|\s)azo(\s|$)|cystex/.test(textBlob);
  const isBoricAcid = /boric acid|suppositor/.test(textBlob);
  const symptomOnlySignals = /pain relief|symptom relief|at-home.*test|test strip|while.*seek care|not a substitute|temporary/.test(textBlob);

  if (isBoricAcid) {
    return {
      shortTerm:
        '**Care pathway:** This is typically a short-term or adjunct option for vaginal pH/BV-type symptoms while you follow a clinician-guided plan.',
      escalation:
        '**Escalate care if:** symptoms persist/return, pain worsens, or you are pregnant/trying to conceive before using boric acid products.',
    };
  }

  if (isAzoOrCystex || (isUtiRelated && symptomOnlySignals)) {
    return {
      shortTerm:
        '**Care pathway:** This is best treated as bridge care (short-term symptom check/relief), not definitive UTI treatment by itself.',
      escalation:
        '**Escalate care if:** fever, flank/back pain, blood in urine, pregnancy, or symptoms that do not improve quickly.',
    };
  }

  return null;
}

/** Clinical insight: bullet format with relevance + validity + takeaway. */
function buildClinicalInsight(product, aiInsights, quizResults, healthProfile, profileTailoring) {
  const narrative = (aiInsights?.clinicalNarrative || '').trim();
  const doctor = (product.doctorOpinion || '').trim();
  const matchLabels = getProfileMatchLabelsForProduct(product, quizResults, healthProfile);
  const bridgeCare = getBridgeToCareGuidance(product);
  const bullets = [];
  if (profileTailoring) {
    bullets.push(`**Relevance for you:** ${profileTailoring}`);
  } else if (matchLabels.length > 0) {
    bullets.push(`**Relevance for you:** This aligns with your priorities: ${matchLabels.join(', ')}.`);
  }
  if (narrative) {
    bullets.push(`**Clinician signal:** ${narrative}`);
  } else if (doctor) {
    bullets.push(`**Clinician signal:** ${doctor}`);
  }
  if (product.clinicianOpinionSource === 'brand' && (narrative || doctor)) {
    bullets.push('**Validity:** Some citations may be brand-leaning, so treat this as directional and confirm with independent clinical sources.');
  } else if (narrative || doctor) {
    bullets.push('**Validity:** Use this as educational context; final fit depends on your medical history, meds, and clinician guidance.');
  }
  if (bridgeCare?.shortTerm) bullets.push(bridgeCare.shortTerm);
  if (bridgeCare?.escalation) bullets.push(bridgeCare.escalation);
  return toInsightObject(bullets);
}

/** Science insight: bullet format with evidence validity + personalization. */
function buildScienceInsight(product, aiInsights, quizResults, healthProfile) {
  const curated = countHttpsLinksInSection(product.verificationLinks?.scientific);
  const aiLit = (aiInsights?.literatureLinks || []).length;
  const aiSci = (aiInsights?.scienceSummary || '').trim();
  const eff = (product.effectiveness || '').trim();
  const hasScienceBody = curated > 0 || aiLit > 0 || !!aiSci || !!eff;
  const limited = scienceEvidenceIsLimited(product);
  const matchLabels = getProfileMatchLabelsForProduct(product, quizResults, healthProfile);
  const bullets = [];
  if (matchLabels.length > 0) {
    bullets.push(`**Relevance for you:** This may fit your priorities (${matchLabels.join(', ')}), but check whether study populations match your profile.`);
  }
  if (aiSci) bullets.push(`**Key finding:** ${aiSci}`);
  else if (eff) bullets.push(`**Key finding:** ${eff}`);
  if (hasScienceBody) {
    bullets.push(
      limited
        ? `**Validity:** Evidence is limited for this exact brand (about ${curated + aiLit} literature links available), so confidence is moderate-to-low.`
        : `**Validity:** Evidence is comparatively stronger here (about ${curated + aiLit} literature links available), but still verify study quality and applicability.`
    );
    bullets.push('**What this means for you:** Prefer products with stronger independent evidence when your goals are symptom control and safety confidence.');
  }
  return toInsightObject(bullets);
}

/** Community insight: bullet format with relevance + opinion validity. */
function buildSocialInsight(product, aiInsights, quizResults, healthProfile) {
  const ai = (aiInsights?.communitySummary || '').trim();
  const raw = product.communityReview || '';
  const quotePart = raw
    ? raw.indexOf(' — ') >= 0
      ? raw.slice(0, raw.indexOf(' — ')).trim()
      : raw.trim()
    : '';
  const quoteRedundant = !!(
    quotePart &&
    ai &&
    ai.includes(quotePart.slice(0, Math.min(50, quotePart.length)))
  );
  const matchLabels = getProfileMatchLabelsForProduct(product, quizResults, healthProfile);
  const bullets = [];
  if (matchLabels.length > 0) {
    bullets.push(`**Relevance for you:** Community reports overlap with your priorities (${matchLabels.join(', ')}).`);
  }
  if (ai) bullets.push(`**What people report:** ${ai}`);
  if (quotePart && !quoteRedundant) bullets.push(`**Example report:** ${quotePart}`);
  if (ai || quotePart) {
    bullets.push('**Validity:** Community feedback is anecdotal and can be biased by incentives, extremes, and selection effects—treat as supportive context, not proof.');
  }
  return toInsightObject(bullets);
}

/**
 * Quick overview: profile fit only — clinical/science/community live in their tabs (avoids repeating the same blurbs).
 * Each item: { id, title?, bullets } — strings use **bold** via renderRichText per bullet.
 */
function buildQuickOverviewBlocks(product, aiInsights, quizResults, healthProfile, profileTailoring) {
  const matchLabels = getProfileMatchLabelsForProduct(product, quizResults, healthProfile);
  const { whyItWorks, considerations } = getRecommendationExplanation(product, quizResults, healthProfile);
  const recallBad = product.safety?.recalls?.includes('⚠️') || hasRecallConcern(product);
  const bridgeCare = getBridgeToCareGuidance(product);
  const hasProfile =
    (quizResults?.frustrations?.length ?? 0) > 0 ||
    matchLabels.length > 0 ||
    !!profileTailoring ||
    (healthProfile && Object.keys(healthProfile).length > 0);

  const bullets = [];
  if (!hasProfile) {
    bullets.push(
      '**Match:** Add a health profile or complete the quiz so we can say whether this product fits your priorities.'
    );
  } else if (matchLabels.length > 0) {
    bullets.push(
      `**Match:** Based on what you shared, this product is **a plausible fit** for themes you care about: ${matchLabels.join(', ')}.`
    );
  } else {
    bullets.push(
      '**Match:** Overlap between this product and your profile tags is **limited**—use the tabs below before you decide.'
    );
  }
  if (whyItWorks && (quizResults?.frustrations?.length || matchLabels.length)) {
    const w = whyItWorks.trim();
    bullets.push(...splitOverviewBulletIfLong(w, 320));
  }
  if (bridgeCare?.shortTerm) bullets.push(bridgeCare.shortTerm);
  if (bridgeCare?.escalation) bullets.push(bridgeCare.escalation);
  if (considerations) bullets.push(considerations);
  if (profileTailoring) bullets.push(profileTailoring);
  if (recallBad) bullets.push('**Safety:** Check the Safety tab for recalls or alerts before you buy.');

  return [{ id: 'you', title: null, bullets }];
}

/** Break very long “why it works” copy into two bullets on sentence boundaries for scannability. */
function splitOverviewBulletIfLong(text, maxChars) {
  const t = (text || '').trim();
  if (t.length <= maxChars) return [t];
  const cut = t.slice(0, maxChars);
  const lastPeriod = cut.lastIndexOf('. ');
  if (lastPeriod >= 80) {
    const a = t.slice(0, lastPeriod + 1).trim();
    const b = t.slice(lastPeriod + 2).trim();
    return b ? [a, b] : [t];
  }
  return [t];
}

/** Render markdown-like **bold** in plain text as <strong> */
function renderRichText(text) {
  if (!text) return null;
  const chunks = String(text).split(/(\*\*[^*]+\*\*)/g);
  return chunks.map((chunk, i) => {
    const m = chunk.match(/^\*\*([^*]+)\*\*$/);
    if (m) return <strong key={i}>{m[1]}</strong>;
    return <span key={i}>{chunk}</span>;
  });
}

export default function ProductModal({
    product,
    onClose,
    onTrack,
    isTracked,
    onOmit,
    isOmitted,
    onToggleCompare,
    isInCompare,
    onAddToEcosystem,
    isInEcosystem,
    userZipCode,
    aynaReviews = null,
    onRate,
    onReview,
    quizResults = null,
    healthProfile = null,
}) {
    const [activeTab, setActiveTab] = useState('safety');
    const [chatMessages, setChatMessages] = useState([{ role: 'assistant', text: `Hi! I'm Ayna. What would you like to know about ${product?.name}?` }]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [reviewInput, setReviewInput] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [aiInsights, setAiInsights] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [fdaRecallData, setFdaRecallData] = useState(null);
    const [fdaRecallLoading, setFdaRecallLoading] = useState(false);
    const [pubmedArticles, setPubmedArticles] = useState([]);
    const [pubmedLoading, setPubmedLoading] = useState(false);
    const [resolvedModalImage, setResolvedModalImage] = useState('');
    const healthContextKey = useMemo(
        () => buildUserHealthContextString(quizResults, healthProfile),
        [quizResults, healthProfile]
    );

    const profileTailoring = useMemo(
        () => buildProfileTailoring(product, quizResults, healthProfile),
        [product, quizResults, healthProfile]
    );

    const prescriptionAccess = useMemo(() => (product ? getPrescriptionAccessGuidance(product) : null), [product]);

    const howToUse = useMemo(() => (product ? getHowToUseContent(product) : null), [product]);

    const condensed = useMemo(() => {
        if (!product) return null;
        return {
            quickOverview: buildQuickOverviewBlocks(product, aiInsights, quizResults, healthProfile, profileTailoring),
            clinicalInsight: buildClinicalInsight(product, aiInsights, quizResults, healthProfile, profileTailoring),
            scienceInsight: buildScienceInsight(product, aiInsights, quizResults, healthProfile),
            socialInsight: buildSocialInsight(product, aiInsights, quizResults, healthProfile),
        };
    }, [product, aiInsights, quizResults, healthProfile, profileTailoring]);

    useEffect(() => {
        let active = true;
        setResolvedModalImage('');
        if (!product?.name) return () => { active = false; };
        if (!isPlaceholderProductImage(product.image)) return () => { active = false; };
        resolveProductImage(product.name, product.brand || '').then((url) => {
            if (!active || !url) return;
            setResolvedModalImage(url);
        });
        return () => {
            active = false;
        };
    }, [product?.id, product?.name, product?.brand, product?.image]);

    const heroImageSrc = resolvedModalImage || product?.image || '';

    /** Hide curated doctor bullet when AI narrative already contains the same opening (avoids duplicate). */
    const suppressDoctorDuplicateInList = useMemo(() => {
        const n = (aiInsights?.clinicalNarrative || '').trim();
        const d = (product?.doctorOpinion || '').trim();
        if (!n || !d || d.length < 12) return false;
        return n.includes(d.slice(0, Math.min(48, d.length)));
    }, [aiInsights?.clinicalNarrative, product?.doctorOpinion]);

    useEffect(() => {
        if (!product?.name) return;
        setFdaRecallData(null);
        setFdaRecallLoading(true);
        fetchFdaRecall(product.name, product.brand || '', product.category || '').then((data) => {
            setFdaRecallData(data);
            setFdaRecallLoading(false);
        });
    }, [product?.name, product?.brand]);

    useEffect(() => {
        if (!product?.name) return;
        setPubmedArticles([]);
        setPubmedLoading(true);
        const query = `${product.name} ${product.category || ''}`.trim().slice(0, 100);
        fetchPubmedArticles(query, 5).then((articles) => {
            setPubmedArticles(articles);
            setPubmedLoading(false);
        });
    }, [product?.name, product?.category]);

    useEffect(() => {
        setAiInsights(null);
        setAiError(null);
        if (!product?.id) return;
        let cancelled = false;
        setAiLoading(true);
        fetchProductInsights(product, { quizResults, healthProfile })
            .then((data) => {
                if (!cancelled) setAiInsights(data);
            })
            .catch((e) => {
                if (cancelled) return;
                if (e?.status === 429) {
                    const sec = e.retryAfterSeconds;
                    const mins = sec != null && sec >= 60 ? Math.ceil(sec / 60) : null;
                    setAiError(
                        mins != null
                            ? `Too many insight requests. Try again in about ${mins} min.`
                            : 'Too many insight requests. Please wait a bit and try again.'
                    );
                } else {
                    setAiError(e?.message || 'Could not load Ayna insights');
                }
            })
            .finally(() => {
                if (!cancelled) setAiLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [product?.id, healthContextKey, product, quizResults, healthProfile]);

    if (!product) return null;

    const isDigital = product.type === 'digital';
    const isPrescriptionOnly = product.requiresPrescription === true || (product.whereToBuy?.length === 1 && product.whereToBuy[0] === 'Pharmacy with prescription');

    const loadAiInsights = async () => {
        setAiLoading(true);
        setAiError(null);
        try {
            const data = await fetchProductInsights(product, { quizResults, healthProfile });
            setAiInsights(data);
        } catch (e) {
            if (e?.status === 429) {
                const sec = e.retryAfterSeconds;
                const mins = sec != null && sec >= 60 ? Math.ceil(sec / 60) : null;
                setAiError(
                    mins != null
                        ? `Too many insight requests. Try again in about ${mins} min.`
                        : 'Too many insight requests. Please wait a bit and try again.'
                );
            } else {
                setAiError(e?.message || 'Could not load Ayna insights');
            }
        } finally {
            setAiLoading(false);
        }
    };

    const renderAiReferenceCards = (links, heading, compact = false) => {
        if (!links || links.length === 0) return null;
        if (compact) {
            return (
                <div style={{ marginTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{heading}</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.88rem', lineHeight: 1.55 }}>
                        {links.map((link, idx) => (
                            <li key={idx} style={{ marginBottom: '0.35rem' }}>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                                    {link.text}
                                </a>
                                {link.summary ? <span style={{ color: 'var(--color-text-muted)' }}> — {link.summary}</span> : null}
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }
        return (
            <div style={{ marginTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>{heading}</h4>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {links.map((link, idx) => (
                        <div key={idx} style={{ padding: '1rem 1.25rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid #E9D5FF' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 200px' }}>
                                    <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{link.text}</p>
                                    <span style={{ fontSize: '0.7rem', color: '#7E22CE', fontWeight: '600' }}>{link.justification}</span>
                                </div>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" style={{
                                    fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-primary)', textDecoration: 'none',
                                    padding: '0.4rem 0.8rem', background: 'var(--color-primary-fade)', borderRadius: '8px', whiteSpace: 'nowrap',
                                }}>Open ↗</a>
                            </div>
                            {link.summary && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>{link.summary}</p>}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const aynaData = aynaReviews && product ? (aynaReviews[product.id] || { ratings: [], reviews: [] }) : { ratings: [], reviews: [] };
    const aynaReviewCount = (aynaData.reviews || []).length;

    const tabs = [
        { id: 'safety', label: isDigital ? 'Privacy & Safety' : 'Safety & Ingredients', icon: '🛡️' },
        { id: 'how-to-use', label: 'How to use', icon: '📖' },
        { id: 'doctor', label: 'Clinician opinions', icon: '👩‍⚕️' },
        { id: 'social', label: 'Community', icon: '💬' },
        { id: 'science', label: 'Scientific literature', icon: '🔬' },
        { id: 'ayna-reviews', label: 'Ayna Reviews', icon: '⭐', badge: aynaReviewCount > 0 ? aynaReviewCount : null },
        { id: 'chat', label: 'Ask Ayna', icon: '✨' },
    ];

    const aynaInsightBoxStyle = {
        marginBottom: '1.25rem',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-secondary-fade)',
        border: '1px solid var(--color-border)',
        fontSize: '0.85rem',
        color: 'var(--color-text-muted)',
        lineHeight: 1.5,
    };
    const AynaInsight = ({ children }) => (children ? (
        <div style={aynaInsightBoxStyle}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Ayna insight</div>
            <p style={{ margin: 0 }}>{children}</p>
        </div>
    ) : null);

    const renderPrescriptionWorkflow = (compact = false) => (
        <div style={compact ? { marginTop: 0 } : { marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', lineHeight: 1.6, marginBottom: '1rem' }}>
                This product is prescription-only. You can’t buy it directly online or in-store without a prescription. Here’s how to get it:
            </p>
            <ol style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', lineHeight: 1.7, paddingLeft: '1.25rem', marginBottom: '1rem' }}>
                <li><strong>Talk to a clinician.</strong> Schedule a visit with your OB-GYN, primary care provider, or use a telehealth service. Discuss whether this product is right for you.</li>
                <li><strong>Get a prescription.</strong> If they prescribe it, they’ll send the prescription to your preferred pharmacy (or you can use the manufacturer’s telehealth/portal if the product offers one).</li>
                <li><strong>Fill and pick up.</strong> Pick it up at a local pharmacy or have it mailed to you (mail-order/specialty pharmacy, depending on the product).</li>
            </ol>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <a href="https://www.goodrx.com/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary)', textDecoration: 'none', padding: '0.35rem 0.6rem', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-pill)' }}>
                    Compare pharmacy prices (GoodRx) ↗
                </a>
                {product.prescriptionPatientUrl && (
                    <a href={product.prescriptionPatientUrl.startsWith('http') ? product.prescriptionPatientUrl : `https://${product.prescriptionPatientUrl}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary)', textDecoration: 'none', padding: '0.35rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', background: 'var(--color-surface-soft)' }}>
                        How to get {product.name.split(/[(\[]/)[0].trim()} ↗
                    </a>
                )}
                {product.prescriptionSavingsUrl && (
                    <a href={product.prescriptionSavingsUrl.startsWith('http') ? product.prescriptionSavingsUrl : `https://${product.prescriptionSavingsUrl}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-primary)', textDecoration: 'none', padding: '0.35rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', background: 'var(--color-surface-soft)' }}>
                        Savings / coupon program ↗
                    </a>
                )}
            </div>
        </div>
    );

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput.trim();
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setChatInput('');
        setIsTyping(true);

        setTimeout(() => {
            setIsTyping(false);
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                text: `Based on my analysis of ${product.name}, that's a great question. According to our Tier 1 data and clinician reviews, it is designed to help with ${product.tags?.join(' and ') || 'your health needs'}. Always consult your healthcare provider for personalized medical advice.`
            }]);
        }, 1500);
    };

    const renderVerificationLinks = (linksOrSection, aiSummaryOverride, label, type, productRef, options = {}) => {
        const { suppressAiSummary = false, suppressDoctorEmptyBanner = false } = options;
        const section = typeof linksOrSection === 'object' && linksOrSection !== null && !Array.isArray(linksOrSection) && (linksOrSection.links || linksOrSection.url || linksOrSection.link)
            ? linksOrSection
            : { links: linksOrSection, aiSummary: aiSummaryOverride };
        const { links, aiSummary } = getVerificationSection(section);
        const linksArray = links.map(l => ({ ...l, url: normalizeSocialUrl((l.url || l.href || '').trim()) })).filter(l => l.url && (l.url.startsWith('http://') || l.url.startsWith('https://')));
        const hasReputableSources = linksArray.length > 0;

        // Avoid duplication: Doctor tab has clinician quote; Science tab has Effectiveness Summary
        const showAiSummary = !suppressAiSummary && aiSummary && type !== 'doctor' && !(type === 'science' && productRef?.effectiveness);

        return (
            <div style={{ marginTop: '1.5rem' }}>
                {/* AI Summary Section (purple box — not shown for Doctor tab) */}
                {showAiSummary && (
                    <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #FDF4FF 0%, #F5F3FF 100%)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid #E9D5FF',
                        marginBottom: '1.5rem',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem', background: '#FAF5FF', fontSize: '0.7rem', fontWeight: '800', color: '#A855F7', borderBottomLeftRadius: '12px' }}>
                            ✨ Ayna insight
                        </div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#7E22CE', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Summary
                        </h4>
                        <p style={{ fontSize: '0.95rem', color: '#581C87', lineHeight: '1.6', fontWeight: '500' }}>
                            {aiSummary}
                        </p>
                    </div>
                )}

                {!suppressDoctorEmptyBanner && !hasReputableSources && type === 'doctor' && (
                    <div style={{
                        padding: '1.5rem',
                        background: '#FFF7ED',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid #FFEDD5',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{ fontSize: '1.5rem' }}>⚠️</div>
                        <div>
                            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#9A3412', marginBottom: '0.25rem' }}>
                                No Verified Clinician Opinions Found
                            </p>
                            <p style={{ fontSize: '0.85rem', color: '#C2410C' }}>
                                Ayna could not find reputable independent clinician reviews for this product online. We strongly recommend discussing this product with your clinician to ensure it fits your specific health profile.
                            </p>
                        </div>
                    </div>
                )}

                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                    display: 'block',
                    marginBottom: '0.75rem'
                }}>
                    {label} {hasReputableSources ? `(${linksArray.length})` : '(0)'}
                </span>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {hasReputableSources ? linksArray.map((link, idx) => (
                        <div key={idx} style={{
                            padding: '1.25rem',
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            transition: 'all 0.2s ease'
                        }} className="hover-lift">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{link.text}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: '#F0FDF4', color: '#166534', borderRadius: '4px', fontWeight: '700' }}>
                                            Reputable Source
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', italic: 'true' }}>
                                            — {link.justification || 'Verified medical review or public record.'}
                                        </span>
                                    </div>
                                </div>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--color-primary)',
                                    fontWeight: '700',
                                    textDecoration: 'none',
                                    padding: '0.4rem 0.8rem',
                                    background: 'var(--color-primary-fade)',
                                    borderRadius: '8px',
                                    whiteSpace: 'nowrap'
                                }}>
                                    Full Source ↗
                                </a>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>{link.summary}</p>
                        </div>
                    )) : !aiSummary && (
                        <div style={{
                            padding: '1.5rem',
                            border: '1px dashed var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            textAlign: 'center',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.85rem'
                        }}>
                            No verified external sources found for this section.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Social tab: group community links by platform (Instagram, TikTok, YouTube, Reddit, Facebook), summarized
    const renderSocialLinks = (linksOrSection, aiSummaryOverride, options = {}) => {
        const { suppressAiSummary = false } = options;
        const section = typeof linksOrSection === 'object' && linksOrSection !== null && !Array.isArray(linksOrSection) && (linksOrSection.links || linksOrSection.url || linksOrSection.link)
            ? linksOrSection
            : { links: linksOrSection, aiSummary: aiSummaryOverride };
        const { links, aiSummary } = getVerificationSection(section);
        const linksArray = links
            .map(l => ({ ...l, url: normalizeSocialUrl((l.url || l.href || '').trim()), platform: (l.platform || inferPlatform(l.url || l.href)).toLowerCase() }))
            .filter(l => l.url && (l.url.startsWith('http://') || l.url.startsWith('https://')));
        const byPlatform = {};
        linksArray.forEach(l => {
            const p = (l.platform === 'instagram' || l.platform === 'tiktok' || l.platform === 'youtube' || l.platform === 'reddit' || l.platform === 'facebook') ? l.platform : 'other';
            if (!byPlatform[p]) byPlatform[p] = [];
            byPlatform[p].push(l);
        });
        const hasAny = linksArray.length > 0;

        return (
            <div style={{ marginTop: '1rem' }}>
                {!suppressAiSummary && aiSummary && (
                    <div style={{
                        padding: '1.25rem',
                        background: 'linear-gradient(135deg, #FDF4FF 0%, #F5F3FF 100%)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid #E9D5FF',
                        marginBottom: '1.5rem'
                    }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#7E22CE', marginBottom: '0.5rem' }}>Summary</h4>
                        <p style={{ fontSize: '0.9rem', color: '#581C87', lineHeight: '1.55' }}>{aiSummary}</p>
                    </div>
                )}
                {!hasAny && (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No social or community links for this product yet.</p>
                )}
                {hasAny && SOCIAL_PLATFORMS.map(({ key, label, icon }) => {
                    const list = byPlatform[key];
                    if (!list || list.length === 0) return null;
                    return (
                        <div key={key} style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>{icon}</span> {label} ({list.length})
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {list.map((link, idx) => (
                                    <div key={idx} style={{
                                        padding: '1rem 1.25rem',
                                        background: 'var(--color-surface)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <div style={{ flex: '1 1 200px' }}>
                                                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{link.text}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.45' }}>{link.summary}</p>
                                            </div>
                                            <a href={link.url} target="_blank" rel="noopener noreferrer" style={{
                                                fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-primary)',
                                                textDecoration: 'none', padding: '0.35rem 0.75rem',
                                                background: 'var(--color-primary-fade)', borderRadius: '8px',
                                                whiteSpace: 'nowrap', flexShrink: 0
                                            }}>
                                                Open ↗
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'var(--color-surface-soft)', borderRadius: 'var(--radius-lg)',
                width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)', position: 'relative'
            }} onClick={e => e.stopPropagation()}>

                {/* Close */}
                <button onClick={onClose} style={{
                    position: 'absolute', top: '1.5rem', right: '1.5rem', width: '36px', height: '36px',
                    borderRadius: '50%', backgroundColor: 'var(--color-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', zIndex: 10,
                    border: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-text-main)'
                }}>✕</button>

                {/* Hero Image Section */}
                <div style={{ position: 'relative', height: '240px', width: '100%', overflow: 'hidden', background: 'var(--color-secondary-fade, #fdf2f4)' }}>
                    {heroImageSrc && !isPlaceholderProductImage(heroImageSrc) ? (
                        <>
                            <img
                                src={heroImageSrc}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                }}
                            />
                            <div style={{ display: 'none', width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-primary)', letterSpacing: '0.02em' }}>AYNA</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)', opacity: 0.9 }}>Your women's health assistant</span>
                            </div>
                        </>
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-primary)', letterSpacing: '0.02em' }}>AYNA</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)', opacity: 0.9 }}>Your women's health assistant</span>
                        </div>
                    )}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: '60px', background: 'linear-gradient(to top, var(--color-surface-soft), transparent)'
                    }}></div>
                </div>

                {/* Header */}
                <div style={{ padding: '2.5rem', paddingTop: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{
                                background: 'var(--color-primary-fade)', color: 'var(--color-primary)',
                                padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)',
                                fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>
                                {product.category}
                            </span>
                            {product.badges && product.badges.map(badge => (
                                <span key={badge} style={{
                                    background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0',
                                    padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)',
                                    fontSize: '0.7rem', fontWeight: '700'
                                }}>
                                    ✨ {badge}
                                </span>
                            ))}
                            {product.integrations && (Array.isArray(product.integrations) ? product.integrations : [product.integrations]).map(int => (
                                <span key={int} style={{ background: 'var(--color-secondary)', color: 'var(--color-text-main)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)', fontSize: '0.7rem', fontWeight: '700' }}>
                                    🔗 {int}
                                </span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {onToggleCompare && (
                                <button
                                    onClick={() => onToggleCompare(product)}
                                    style={{
                                        background: isInCompare ? 'var(--color-primary-fade)' : 'transparent',
                                        border: `1px solid ${isInCompare ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        color: isInCompare ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        padding: '0.3rem 0.75rem',
                                        borderRadius: 'var(--radius-pill)',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isInCompare ? '✓ In Comparison' : '+ Add to Compare'}
                                </button>
                            )}
                            <button
                                onClick={() => onOmit(product)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                {isOmitted ? 'Restore' : "Omit"}
                            </button>
                        </div>
                    </div>

                    <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>{product.name}</h2>
                    {product.outOfBusiness && (
                        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'var(--color-surface-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                            <strong>No longer sold.</strong> This brand is out of business. We keep this page so you can still view safety and care information if you have the product.
                        </div>
                    )}
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '600px' }}>{product.summary || product.description || product.tagline}</p>

                    {product.ratingNote && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', color: '#9A3412' }}>
                            <strong>Rating note:</strong> {product.ratingNote}
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                        <button
                            className={`btn ${isTracked ? 'btn-outline' : 'btn-primary'}`}
                            onClick={() => onTrack(product)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: isTracked ? 'transparent' : 'var(--color-primary)',
                                color: isTracked ? 'var(--color-primary)' : 'white',
                                borderColor: 'var(--color-primary)',
                            }}
                        >
                            {isTracked ? '✓ Tracking Safety Alerts' : '🔔 Monitor Safety Recalls'}
                        </button>
                        {onAddToEcosystem && (
                            <button
                                className={`btn ${isInEcosystem ? 'btn-outline' : 'btn-primary'}`}
                                onClick={() => onAddToEcosystem(product)}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: isInEcosystem ? 'transparent' : 'var(--color-primary)',
                                    color: isInEcosystem ? 'var(--color-primary)' : 'white',
                                    borderColor: 'var(--color-primary)',
                                }}
                            >
                                {isInEcosystem ? '✓ In My Ecosystem' : '+ Add to My Ecosystem'}
                            </button>
                        )}
                        {(product.price || product.stage) && <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-main)' }}>{product.price || product.stage}</span>}
                        {!product.ratingNote && (getAynaRating(product, aynaReviews?.[product.id]) ?? product.userRating) != null && (
                            <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }} title="Based on user reviews, clinical opinions, and scientific literature">
                                ★ {(getAynaRating(product, aynaReviews?.[product.id]) ?? product.userRating).toFixed(1)}
                            </span>
                        )}
                    </div>

                    {/* Where to buy + product website — visible under the action buttons */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: '600' }}>
                            {isPrescriptionOnly ? 'How to get it' : 'Where to buy'}
                        </p>
                        {isPrescriptionOnly ? (
                            renderPrescriptionWorkflow(true)
                        ) : product.outOfBusiness ? (
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>This product is no longer available for purchase. If you already have it, you can continue to use it and reference the safety info above.</p>
                        ) : (
                            <div>
                                {userZipCode && (
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                                        In-store and online availability for zip <strong>{userZipCode}</strong> is shown when we have data. We use retailer and zip code data to surface in-stock status when available.
                                    </p>
                                )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                {product.url && (() => {
                                    const websiteUrl = (product.url || '').trim();
                                    const isValidUrl = websiteUrl !== '#' && (websiteUrl.startsWith('http://') || websiteUrl.startsWith('https://'));
                                    if (!isValidUrl) return null;
                                    const href = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl.replace(/^(https?:\/\/)?/i, '')}`;
                                    return (
                                        <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary)', textDecoration: 'none', padding: '0.35rem 0.6rem', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-pill)' }}>
                                            Product website ↗
                                        </a>
                                    );
                                })()}
                                {(product.whereToBuy || []).map(shop => {
                                    const rawUrl = product.whereToBuyLinks?.[shop] || getStoreUrl(shop, product.name);
                                    const url = (typeof rawUrl === 'string' && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) ? rawUrl : getStoreUrl(shop, product.name);
                                    const inStock = product.whereToBuyInStock && product.whereToBuyInStock[shop] === true;
                                    return (
                                        <a
                                            key={shop}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                color: 'var(--color-primary)',
                                                textDecoration: 'none',
                                                padding: '0.35rem 0.6rem',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-pill)',
                                                background: 'var(--color-surface-soft)'
                                            }}
                                        >
                                            {shop} ↗ {inStock && <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>· In stock</span>}
                                        </a>
                                    );
                                })}
                            </div>
                            {product.platform && (
                                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                                    <strong>Platform:</strong> {product.platform}
                                </p>
                            )}
                            </div>
                        )}
                    </div>

                    {condensed?.quickOverview?.length > 0 && (
                        <div
                            style={{
                                marginTop: '1.25rem',
                                padding: '1rem 1.15rem',
                                background: 'var(--color-bg)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    color: 'var(--color-text-muted)',
                                    margin: '0 0 0.85rem',
                                }}
                            >
                                Quick overview
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {condensed.quickOverview.map((block) => (
                                    <div key={block.id}>
                                        {block.title ? (
                                            <p
                                                style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.04em',
                                                    color: 'var(--color-primary)',
                                                    margin: '0 0 0.35rem',
                                                }}
                                            >
                                                {block.title}
                                            </p>
                                        ) : null}
                                        {Array.isArray(block.bullets) && block.bullets.length > 0 ? (
                                            <ul
                                                style={{
                                                    margin: 0,
                                                    paddingLeft: '1.15rem',
                                                    color: 'var(--color-text-main)',
                                                }}
                                            >
                                                {block.bullets.map((line, i) => (
                                                    <li
                                                        key={i}
                                                        style={{
                                                            fontSize: '0.9rem',
                                                            lineHeight: 1.55,
                                                            marginBottom: i < block.bullets.length - 1 ? '0.55rem' : 0,
                                                            paddingLeft: '0.2rem',
                                                        }}
                                                    >
                                                        {renderRichText(line)}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : block.body ? (
                                            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-main)', lineHeight: 1.6, margin: 0 }}>
                                                {renderRichText(block.body)}
                                            </p>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.75rem 0 0', lineHeight: 1.45 }}>
                                Quick read before you buy—not medical advice.
                            </p>
                        </div>
                    )}

                    {prescriptionAccess && (prescriptionAccess.patientUrl || prescriptionAccess.savingsUrl || prescriptionAccess.telehealthProduct) && (
                        <div
                            style={{
                                marginTop: '1rem',
                                padding: '1rem 1.15rem',
                                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid #bbf7d0',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    color: 'var(--color-text-muted)',
                                    margin: '0 0 0.65rem',
                                }}
                            >
                                Prescription or clinical access
                            </p>
                            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-main)', lineHeight: 1.55, margin: '0 0 0.75rem' }}>
                                Many items like this require a prescription or clinician visit. Ayna only points you to licensed paths—not medical advice.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {prescriptionAccess.patientUrl && (
                                    <a
                                        href={prescriptionAccess.patientUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary)' }}
                                    >
                                        How to get this product (manufacturer / patient program) ↗
                                    </a>
                                )}
                                {prescriptionAccess.savingsUrl && (
                                    <a
                                        href={prescriptionAccess.savingsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary)' }}
                                    >
                                        Savings or access program ↗
                                    </a>
                                )}
                                {prescriptionAccess.telehealthProduct && (() => {
                                    const tp = prescriptionAccess.telehealthProduct;
                                    const raw = tp.whereToBuy && tp.whereToBuy[0];
                                    const href =
                                        raw && /^https?:\/\//i.test(String(raw).trim())
                                            ? String(raw).trim()
                                            : raw
                                              ? `https://${String(raw).replace(/^www\./i, '')}`
                                              : '#';
                                    return (
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.65rem',
                                                background: 'var(--color-surface-soft)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--color-border)',
                                            }}
                                        >
                                            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                                                <img src={tp.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-main)' }}>{tp.name}</p>
                                                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                                                    Virtual care that may prescribe or coordinate access in your situation—confirm coverage and state rules.
                                                </p>
                                            </div>
                                            {href !== '#' && (
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-outline"
                                                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', flexShrink: 0 }}
                                                >
                                                    Visit
                                                </a>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    <Disclaimer compact style={{ marginTop: '1rem' }} />
                </div>

                {/* Navigation Tabs */}
                <div style={{ padding: '0 2.5rem', position: 'sticky', top: 0, background: 'var(--color-surface-soft)', zIndex: 5 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                style={{
                                    padding: '1.25rem 1rem', fontSize: '0.9rem', fontWeight: activeTab === tab.id ? '600' : '400',
                                    borderBottom: activeTab === tab.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                                    color: activeTab === tab.id ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap',
                                    background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span> {tab.label}
                                {tab.badge != null && (
                                    <span style={{ background: 'var(--color-primary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '700' }}>{tab.badge}</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div style={{ padding: '0.65rem 2.5rem 0.85rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                            <button type="button" className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={loadAiInsights} disabled={aiLoading}>
                                {aiLoading ? 'Loading…' : 'Refresh Ayna insights'}
                            </button>
                            {aiError && <span style={{ color: '#b91c1c', fontSize: '0.85rem' }}>{aiError}</span>}
                            {aiInsights?.generatedAt && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    Updated {new Date(aiInsights.generatedAt).toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tab Panel Content */}
                <div style={{ padding: '2rem 2.5rem 3rem' }}>
                    {activeTab === 'how-to-use' && howToUse && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>How to use</h3>
                            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                                From our product database, plus common guidance and links to brand resources, tutorials, and videos. Not medical advice.
                            </p>
                            {howToUse.fromBrand?.paragraphs?.length > 0 && (
                                <div style={{ marginBottom: '1.5rem', padding: '1.1rem 1.25rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 0.65rem' }}>From the brand &amp; Ayna database</h4>
                                    {howToUse.fromBrand.paragraphs.map((p, i) => (
                                        <p key={i} style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--color-text-main)', margin: i === 0 ? 0 : '0.75rem 0 0' }}>{p}</p>
                                    ))}
                                </div>
                            )}
                            {howToUse.aggregatedIntro && (
                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', lineHeight: 1.6, marginBottom: '1.25rem' }}>{howToUse.aggregatedIntro}</p>
                            )}
                            {howToUse.steps?.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 0.65rem' }}>Steps</h4>
                                    <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.92rem', lineHeight: 1.65, color: 'var(--color-text-main)' }}>
                                        {howToUse.steps.map((s, i) => (
                                            <li key={i} style={{ marginBottom: '0.45rem' }}>{s}</li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                            {(howToUse.signupBullets?.length > 0 || howToUse.whatToExpectBullets?.length > 0) && (
                                <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: '1.5rem' }}>
                                    {howToUse.signupBullets?.length > 0 && (
                                        <div style={{ padding: '1rem 1.15rem', background: 'var(--color-secondary-fade)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                            <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-primary)', margin: '0 0 0.65rem' }}>How to sign up</h4>
                                            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.9rem', lineHeight: 1.55 }}>
                                                {howToUse.signupBullets.map((s, i) => (
                                                    <li key={i} style={{ marginBottom: '0.4rem' }}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {howToUse.whatToExpectBullets?.length > 0 && (
                                        <div style={{ padding: '1rem 1.15rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                            <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 0.65rem' }}>What to expect</h4>
                                            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.9rem', lineHeight: 1.55 }}>
                                                {howToUse.whatToExpectBullets.map((s, i) => (
                                                    <li key={i} style={{ marginBottom: '0.4rem' }}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                            {howToUse.tutorialLinks?.length > 0 && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 0.65rem' }}>Tutorials &amp; official resources</h4>
                                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.9rem', lineHeight: 1.55 }}>
                                        {howToUse.tutorialLinks.map((link, idx) => (
                                            <li key={idx} style={{ marginBottom: '0.5rem' }}>
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                                                    {link.label} ↗
                                                </a>
                                                {link.hint ? <span style={{ color: 'var(--color-text-muted)' }}> — {link.hint}</span> : null}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {howToUse.videoLinks?.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 0.65rem' }}>Videos &amp; search shortcuts</h4>
                                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.9rem', lineHeight: 1.55 }}>
                                        {howToUse.videoLinks.map((v, idx) => (
                                            <li key={idx} style={{ marginBottom: '0.45rem' }}>
                                                <a href={v.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                                                    {v.label} ↗
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginTop: '0.75rem', fontStyle: 'italic' }}>{howToUse.disclaimer}</p>
                        </div>
                    )}

                    {activeTab === 'safety' && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Safety &amp; what to know</h3>
                            {!productHasMeaningfulSafety(product) && (
                                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.55 }}>
                                    No safety data available yet for this product.
                                </p>
                            )}
                            <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 0.65rem' }}>Sources &amp; summarized detail</h4>
                            {productHasMeaningfulSafety(product) && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                        <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>FDA Regulatory Status</h4>
                                        <p>{product.safety?.fdaStatus || 'N/A'}</p>
                                    </div>
                                    <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                        <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Materials & Components</h4>
                                        <p style={{ whiteSpace: 'pre-line' }}>{getMaterialsAndComponentsText(product)}</p>
                                    </div>
                                    <div style={{ gridColumn: 'span 2', background: product.safety?.recalls?.includes('⚠️') ? '#F1F5F9' : '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                        <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Safety Alerts & Recalls</h4>
                                        <p style={{ marginBottom: hasRecallConcern(product) ? '0.85rem' : 0 }}>{product.safety?.recalls || 'No active recalls.'}</p>
                                        {fdaRecallLoading && (
                                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                                                Checking FDA recall database...
                                            </p>
                                        )}
                                        {fdaRecallData && !fdaRecallLoading && (
                                            <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: fdaRecallData.hasRecalls ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${fdaRecallData.hasRecalls ? '#FECACA' : '#BBF7D0'}` }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: fdaRecallData.hasRecalls ? '#DC2626' : '#166534', marginBottom: '0.35rem' }}>
                                                    {fdaRecallData.hasRecalls ? '⚠️ FDA Recall Records Found' : '✓ No FDA Recalls Found'}
                                                </div>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                                    {fdaRecallData.hasRecalls
                                                        ? `${fdaRecallData.recalls.length} recall record(s) found in OpenFDA. Review carefully before purchasing.`
                                                        : 'No recall records found in OpenFDA at time of check.'}
                                                </p>
                                                {fdaRecallData.hasRecalls && fdaRecallData.recalls.map((r, i) => (
                                                    <div key={i} style={{ marginTop: '0.5rem', fontSize: '0.76rem', color: '#DC2626', lineHeight: 1.4 }}>
                                                        <strong>{r.date}</strong> — {r.reason || r.description}
                                                    </div>
                                                ))}
                                                <a href="https://www.accessdata.fda.gov/scripts/enforcement/enforce_rpt-Product-Tabs.cfm" target="_blank" rel="noopener noreferrer"
                                                    style={{ fontSize: '0.72rem', color: 'var(--color-primary)', display: 'inline-block', marginTop: '0.35rem' }}>
                                                    Check full FDA enforcement database →
                                                </a>
                                            </div>
                                        )}
                                        {hasRecallConcern(product) && (
                                            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', fontSize: '0.88rem', lineHeight: 1.55 }}>
                                                <p style={{ margin: '0 0 0.5rem', fontWeight: '600', color: 'var(--color-text-main)' }}>FDA MedWatch</p>
                                                <p style={{ margin: '0 0 0.5rem', color: 'var(--color-text-muted)' }}>
                                                    Serious problems with drugs, devices, or other products can be reported to the FDA through MedWatch.
                                                </p>
                                                <a href={MEDWATCH_URL} target="_blank" rel="noopener noreferrer" style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                                                    Report or learn more at FDA MedWatch ↗
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ gridColumn: 'span 2', background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #EAB308' }}>
                                        <h4 style={{ fontSize: '0.8rem', color: '#854D0E', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Potential Side Effects</h4>
                                        <p style={{ fontSize: '0.9rem' }}>{product.safety?.sideEffects || 'In rare cases, consult with a healthcare professional before use. Side effects for this product are typically minimal but vary by individual.'}</p>
                                    </div>
                                    <div style={{ gridColumn: 'span 2', background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #EF4444' }}>
                                        <h4 style={{ fontSize: '0.8rem', color: '#991B1B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Community Consensus & Watch-outs</h4>
                                        <p style={{ fontSize: '0.9rem' }}>{product.safety?.opinionAlerts || 'Generally positive reception. Ayna monitors community forums for emerging concerns about reliability or quality changes.'}</p>
                                    </div>
                                    {isDigital && product.privacy && (
                                        <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                                            <h4 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Privacy Policy Highlights</h4>
                                            <div style={{ display: 'grid', gap: '1rem' }}>
                                                <p><strong>Storage:</strong> {product.privacy.dataStorage}</p>
                                                <p><strong>Data Sharing:</strong> {product.privacy.sellsData}</p>
                                                <p><strong>Compliance:</strong> {product.privacy.hipaa}</p>
                                                <p style={{ fontStyle: 'italic', background: 'var(--color-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>{product.privacy.keyPolicy}</p>
                                            </div>
                                        </div>
                                    )}
                            </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'doctor' && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Clinician opinions</h3>
                            {condensed?.clinicalInsight && (
                                <div style={purpleInsightBoxStyle}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#7E22CE', marginBottom: '0.65rem' }}>Insight</h4>
                                    <div style={{ fontSize: '0.95rem', color: '#581C87', margin: 0 }}>
                                        {renderInsightBullets(condensed.clinicalInsight)}
                                    </div>
                                    <p style={{ fontSize: '0.72rem', color: '#7E22CE', margin: '0.75rem 0 0', fontWeight: '600' }}>
                                        For learning only—not a substitute for your clinician.
                                    </p>
                                </div>
                            )}
                            {!condensed?.clinicalInsight && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0 0 1rem', lineHeight: 1.5 }}>
                                    For learning only—not a substitute for your clinician.
                                </p>
                            )}
                            {(product.clinicianOpinionSource === 'independent') && String(product.clinicianAttribution || '').trim().length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        background: '#DCFCE7',
                                        color: '#166534',
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: 'var(--radius-pill)',
                                        fontSize: '0.75rem',
                                        fontWeight: '700'
                                    }}>
                                        Independent clinician verified
                                    </span>
                                </div>
                            )}
                            {!((product.clinicianOpinionSource === 'independent') && String(product.clinicianAttribution || '').trim().length > 0) && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        background: '#FEF3C7',
                                        color: '#92400E',
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: 'var(--radius-pill)',
                                        fontSize: '0.75rem',
                                        fontWeight: '700'
                                    }}>
                                        No independent clinician opinion yet
                                    </span>
                                </div>
                            )}
                            {((product.doctorOpinion && !suppressDoctorDuplicateInList) || product.clinicianAttribution) && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Summarized info (our database)</h4>
                                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--color-text-main)' }}>
                                        {product.doctorOpinion && !suppressDoctorDuplicateInList && (
                                            <li style={{ marginBottom: '0.5rem' }}>
                                                <strong>Curated summary:</strong> {product.doctorOpinion}
                                            </li>
                                        )}
                                        {product.clinicianAttribution && (
                                            <li>
                                                <strong>Attribution:</strong> {product.clinicianAttribution}
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                            <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '1.25rem 0 0.5rem' }}>Sources</h4>
                            {renderAiReferenceCards(aiInsights?.clinicianLinks, 'MedlinePlus search shortcuts (government patient education)', true)}
                            {renderVerificationLinks(
                                product.verificationLinks?.doctor,
                                null,
                                'Sources & citations',
                                'doctor',
                                product,
                                { suppressDoctorEmptyBanner: true }
                            )}
                        </div>
                    )}

                    {activeTab === 'science' && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Scientific literature</h3>
                            {!condensed?.scienceInsight && !productHasScienceSignals(product, aiInsights) && (
                                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.55 }}>
                                    No peer-reviewed literature indexed yet for this product.
                                </p>
                            )}
                            {condensed?.scienceInsight && (
                                <div style={purpleInsightBoxStyle}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#7E22CE', marginBottom: '0.65rem' }}>Insight</h4>
                                    <div style={{ fontSize: '0.95rem', color: '#581C87', margin: 0 }}>
                                        {renderInsightBullets(condensed.scienceInsight)}
                                    </div>
                                </div>
                            )}
                            {pubmedLoading && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
                                    Fetching PubMed literature...
                                </p>
                            )}
                            {pubmedArticles.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>
                                        Related PubMed Articles
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {pubmedArticles.map((article) => (
                                            <div key={article.pmid} style={{ padding: '0.75rem', background: 'var(--color-surface-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                                <a href={article.url} target="_blank" rel="noopener noreferrer"
                                                    style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-primary)', textDecoration: 'none', lineHeight: 1.4, display: 'block', marginBottom: '0.25rem' }}>
                                                    {article.title}
                                                </a>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                                                    {[article.authors, article.journal, article.year ? `(${article.year})` : ''].filter(Boolean).join(' · ')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '1.25rem 0 0.5rem' }}>Sources</h4>
                            {renderAiReferenceCards(aiInsights?.literatureLinks, 'PubMed search shortcuts', true)}
                            {renderVerificationLinks(
                                product.verificationLinks?.scientific,
                                null,
                                'Peer-reviewed & clinical sources',
                                'science',
                                product,
                                { suppressAiSummary: true }
                            )}
                        </div>
                    )}

                    {activeTab === 'social' && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Community Experience & Social Proof</h3>
                            {!condensed?.socialInsight && !productHasCommunitySignals(product, aiInsights) && (
                                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.55 }}>
                                    No community reviews yet.
                                </p>
                            )}
                            {condensed?.socialInsight && (
                                <div style={purpleInsightBoxStyle}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#7E22CE', marginBottom: '0.65rem' }}>Insight</h4>
                                    <div style={{ fontSize: '0.95rem', color: '#581C87', margin: 0 }}>
                                        {renderInsightBullets(condensed.socialInsight)}
                                    </div>
                                </div>
                            )}
                            {product.incentivizedReviewSites && product.incentivizedReviewSites.length > 0 && (
                                <div
                                    style={{
                                        marginBottom: '1rem',
                                        padding: '0.65rem 0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: '#FFF7ED',
                                        border: '1px solid #FFEDD5',
                                        fontSize: '0.82rem',
                                        color: '#9A3412',
                                    }}
                                >
                                    <strong>Platforms flagged as potentially incentivized:</strong>{' '}
                                    {product.incentivizedReviewSites.map((s, i) => (
                                        <span key={i}>
                                            {i > 0 && '; '}
                                            {s.site}
                                            {s.source ? ` (${s.source})` : ''}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '1.25rem 0 0.5rem' }}>Sources</h4>
                            {aiInsights?.communityLinks?.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    {renderSocialLinks(
                                        {
                                            links: aiInsights.communityLinks.map((c) => ({
                                                url: c.url,
                                                text: c.text,
                                                summary: c.summary || '',
                                                platform: c.platform || 'other',
                                            })),
                                        },
                                        null,
                                        { suppressAiSummary: true }
                                    )}
                                </div>
                            )}
                            {renderSocialLinks(product.verificationLinks?.community, null, { suppressAiSummary: true })}
                        </div>
                    )}

                    {activeTab === 'ayna-reviews' && (
                        <div className="animate-fade-in">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Ayna Reviews</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                                Anonymous reviews from Ayna users. Your rating and review help others make informed decisions.
                            </p>

                            {isInEcosystem && onRate && (
                                <div style={{ marginBottom: '2rem', padding: '1.25rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>Rate this product</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>You have this in your ecosystem. How would you rate it?</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => onRate(product, star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', fontSize: '1.5rem',
                                                    color: (hoverRating || 0) >= star ? '#EAB308' : 'var(--color-border)'
                                                }}
                                                title={`${star} star${star > 1 ? 's' : ''}`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Your rating helps Ayna compute the overall product rating.</p>
                                </div>
                            )}

                            <div style={{ marginBottom: '2rem', padding: '1.25rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>Write an anonymous review</h4>
                                <textarea
                                    value={reviewInput}
                                    onChange={(e) => setReviewInput(e.target.value)}
                                    placeholder="Share your experience with this product..."
                                    rows={3}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.9rem', resize: 'vertical', marginBottom: '0.75rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (reviewInput.trim() && onReview) {
                                            onReview(product, reviewInput.trim());
                                            setReviewInput('');
                                        }
                                    }}
                                    disabled={!reviewInput.trim() || !onReview}
                                    className="btn btn-primary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                >
                                    Post review
                                </button>
                            </div>

                            <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>
                                Community reviews {aynaReviewCount > 0 && `(${aynaReviewCount})`}
                            </h4>
                            {aynaReviewCount === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    No Ayna reviews yet. Be the first to share your experience!
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {(aynaData.reviews || []).map((r, idx) => (
                                        <div key={idx} style={{ padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--color-text-main)' }}>{r.text}</p>
                                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                Anonymous · {r.date ? new Date(r.date).toLocaleDateString() : ''}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
                            <AynaInsight>Ask Ayna anything about this product. Answers are for education only and are not medical advice; always consult your clinician for personalized care.</AynaInsight>
                            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} style={{
                                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        background: msg.role === 'user' ? 'var(--color-primary)' : 'white',
                                        color: msg.role === 'user' ? 'white' : 'var(--color-text-main)',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '1rem',
                                        borderBottomRightRadius: msg.role === 'user' ? 0 : '1rem',
                                        borderBottomLeftRadius: msg.role === 'assistant' ? 0 : '1rem',
                                        maxWidth: '80%',
                                        boxShadow: 'var(--shadow-sm)',
                                        border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none'
                                    }}>
                                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>{msg.text}</p>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div style={{ alignSelf: 'flex-start', background: 'white', padding: '0.75rem 1rem', borderRadius: '1rem', borderBottomLeftRadius: 0, border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                        Ayna is thinking...
                                    </div>
                                )}
                            </div>
                            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder={`Ask about ${product.name}...`}
                                    style={{ flexGrow: 1, padding: '0.8rem 1rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-border)', outline: 'none' }}
                                />
                                <button type="submit" disabled={isTyping} className="btn btn-primary" style={{ padding: '0 1.5rem', borderRadius: 'var(--radius-pill)' }}>
                                    Send
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

