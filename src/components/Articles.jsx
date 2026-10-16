import React, { useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import SuggestBox from './SuggestBox';
import SmartSearchInput from './search/SmartSearchInput.jsx';
import SearchAssist from './search/SearchAssist.jsx';
import { searchArticles } from '../utils/search/index.js';
import '../styles/audit-library.css';
import '../styles/verify-content.css';
import { ALL_PRODUCTS, getPersonalizedProductIds } from '../data/products';
import { inferTagsFromHealthProfile } from '../utils/healthDataProfile';
import { RELEASED_STARTUPS } from '../data/startups';
import { buildLibrary } from '../mobile/utils/personalReads.js';

/** Article id → topic-specific tags. Products must have at least one of these to appear under the article. No broad tags (e.g. discomfort), only tags that match the article heading. */
import { ARTICLE_TOPIC_TAGS, FRUSTRATION_TO_TAG } from '../data/readPicks.js';
export { ARTICLE_TOPIC_TAGS };

/** Optional: article id → filter fn. Further narrows products to match article heading (e.g. intimate wash = only wash/cleanser products). */
const ARTICLE_PRODUCT_TYPE_FILTER = {
  'intimate-wash': (item) => {
    const text = `${item.name || ''} ${item.summary || ''} ${item.description || ''} ${item.tagline || ''}`.toLowerCase();
    return /\b(wash|cleanser|cleans|foaming|soap)\b/.test(text);
  },
};

/** Alias for getRecommendedArticles / getArticlesByProfileRelevance (they use focus for scoring). */
const ARTICLE_FOCUS_TAGS = ARTICLE_TOPIC_TAGS;

/** Quiz frustrations → tags (align with products.js). */

function getProductUrl(p) {
  const raw = p.whereToBuy && p.whereToBuy[0];
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return 'https://' + s.replace(/^www\./i, '');
}

/** Telehealth platforms that match this article's topic (tags or healthFunctions). Products must have topic-specific tags matching the article heading. */
function getRelevantTelehealth(articleId) {
  // Prefer the article's condition tags (same ones its products use); only
  // fall back to the broad topic tags for reads without a product spec.
  const spec = ARTICLE_PRODUCTS[articleId];
  const topicTags = spec ? (spec.tags || []) : (ARTICLE_TOPIC_TAGS[articleId] || []);
  if (spec && topicTags.length === 0) return [];
  const typeFilter = ARTICLE_PRODUCT_TYPE_FILTER[articleId];
  let fromProducts = (ALL_PRODUCTS || [])
    .filter((p) => p.category === 'telehealth')
    .filter((p) => {
      if (topicTags.length === 0) return true;
      const tags = new Set([...(p.tags || []), ...(p.healthFunctions || []), ...(p.category ? [p.category] : [])]);
      return topicTags.some((t) => tags.has(t));
    });
  let fromStartups = (RELEASED_STARTUPS || [])
    .filter((s) => s.category === 'telehealth')
    .filter((s) => {
      if (topicTags.length === 0) return true;
      const tags = new Set([...(s.tags || []), ...(s.healthFunctions || []), ...(s.category ? [s.category] : [])]);
      return topicTags.some((t) => tags.has(t));
    });
  if (typeFilter) {
    fromProducts = fromProducts.filter((p) => typeFilter({ ...p, summary: p.summary, description: p.summary, tagline: '' }));
    fromStartups = fromStartups.filter((s) => typeFilter({ ...s, summary: s.description || s.tagline, description: s.description, tagline: s.tagline }));
  }
  // Dedupe by name so the same platform (e.g. Tia in products + startups) appears once; prefer product entry.
  const byName = new Map();
  [...fromProducts, ...fromStartups].forEach((item) => {
    const key = (item.name || '').trim().toLowerCase();
    if (!key || byName.has(key)) return;
    byName.set(key, item);
  });
  return Array.from(byName.values());
}


/**
 * Products shown under an article (website). Matched on the article's
 * condition, not on broad tags: `ids` are hand-picked items the article
 * itself talks about (id → why it's relevant), `tags` are condition tags
 * in priority order, `categories` optionally narrows tag matches.
 * Capped at MAX_ARTICLE_PRODUCTS.
 */
const MAX_ARTICLE_PRODUCTS = 6;
const TAG_REASON = {
  'vaginal-health': 'Vaginal health',
  'heavy-flow': 'Heavy flow',
  anemia: 'Iron',
  menopause: 'Menopause',
  perimenopause: 'Perimenopause',
  uti: 'UTI',
  'uti-prevention': 'UTI',
  'cramp-relief': 'Cramp relief',
  cramps: 'Cramps',
  pcos: 'PCOS',
  irregular: 'Cycle tracking',
  'pelvic-floor': 'Pelvic floor',
  incontinence: 'Bladder leaks',
  endometriosis: 'Endometriosis',
  pms: 'PMS',
  'mental-health': 'Mood support',
  fibroids: 'Fibroids',
  contraception: 'Contraception',
};
const ARTICLE_PRODUCTS = {
  'intimate-wash': { tags: ['vaginal-health'], categories: ['intimate-care'], reason: 'External wash' },
  'heavy-bleeding': { tags: ['heavy-flow', 'anemia'] },
  'menopause-basics': { tags: ['menopause', 'perimenopause'], categories: ['menopause', 'telehealth', 'supplement', 'tracker', 'intimate-care', 'sleep'] },
  'uti-prevention': { tags: ['uti', 'uti-prevention'], exclude: ['p-boric-acid'] },
  'yeast-infection-basics': {
    ids: { 'p-winx-vaginal-health-test-treat': 'pH test', 'p-probiotics-women': 'Vaginal flora', 'p-winx-vaginal-probiotic': 'Vaginal flora' },
  },
  'period-pain-when-to-seek-care': { tags: ['cramp-relief', 'cramps'] },
  'pcos-basics': { tags: ['pcos', 'irregular'] },
  'pelvic-floor-dysfunction': { ids: { 'p-intimate-rose': 'Dilators' }, tags: ['pelvic-floor', 'incontinence'] },
  'endometriosis-basics': { tags: ['endometriosis', 'cramp-relief'] },
  'bacterial-vaginosis': {
    ids: {
      'p-winx-vaginal-health-test-treat': 'pH test',
      'p-boric-acid': 'Boric acid',
      'p-neycher-odor-be-gone': 'Boric acid',
      'p-queen-v-pop': 'Boric acid',
      'p-probiotics-women': 'Probiotic',
      'p-winx-vaginal-probiotic': 'Probiotic',
    },
  },
  pmdd: { tags: ['pms', 'mental-health'] },
  fibroids: { tags: ['fibroids', 'anemia', 'heavy-flow'] },
  'iron-deficiency-anemia': { tags: ['anemia', 'heavy-flow'] },
  'ovarian-cysts': { tags: ['cramp-relief'], reason: 'Pain relief' },
  'hormonal-birth-control': { tags: ['contraception'] },
};

/** Up to 6 products for this article, each with a short "why". Profile matches go first within the same rank. */
function getArticleProducts(articleId, quizResults = null, healthProfile = null) {
  const spec = ARTICLE_PRODUCTS[articleId];
  if (!spec) return [];
  const typeFilter = ARTICLE_PRODUCT_TYPE_FILTER[articleId];
  const exclude = new Set(spec.exclude || []);
  const idList = Object.keys(spec.ids || {});
  const tags = spec.tags || [];
  let boost = new Set();
  try { boost = new Set(getPersonalizedProductIds(quizResults || {}, healthProfile)); } catch { /* no profile */ }

  const ranked = [];
  (ALL_PRODUCTS || []).forEach((p, order) => {
    if (!p || exclude.has(p.id)) return;
    const idRank = idList.indexOf(p.id);
    if (idRank >= 0) {
      ranked.push({ product: p, why: spec.ids[p.id], rank: idRank, order });
      return;
    }
    if (!tags.length) return;
    if (spec.categories && !spec.categories.includes(p.category)) return;
    if (typeFilter && !typeFilter({ ...p, description: p.summary, tagline: '' })) return;
    const own = new Set([...(p.tags || []), ...(p.healthFunctions || [])]);
    const tagRank = tags.findIndex((t) => own.has(t));
    if (tagRank < 0) return;
    ranked.push({ product: p, why: spec.reason || TAG_REASON[tags[tagRank]] || '', rank: idList.length + tagRank, order });
  });
  ranked.sort((a, b) => a.rank - b.rank || (boost.has(b.product.id) - boost.has(a.product.id)) || a.order - b.order);
  return ranked.slice(0, MAX_ARTICLE_PRODUCTS);
}

// What to know before the product row, so it never contradicts the read above it.
const ROW_NOTES = {
  'intimate-wash': 'Most people don’t need a wash. If you use one, choose fragrance-free and outside use only.',
  'yeast-infection-basics': 'The usual first step is an over-the-counter antifungal from a pharmacy. The products below are tests and support, not treatment.',
  'bacterial-vaginosis': 'BV is treated with a prescription. The products below are tests and support, not treatment.',
  'iron-deficiency-anemia': 'Check your iron levels with a blood test before you start a supplement.',
  'uti-prevention': 'Evidence for these is mixed. Each card shows what research is linked.',
  'ovarian-cysts': 'Most cysts need no treatment. Sudden, severe pain needs care right away.',
  fibroids: 'Fibroids are diagnosed and treated by a clinician. These help with heavy bleeding in the meantime.',
  'heavy-bleeding': 'Products can make heavy periods easier to manage. They don’t treat the cause, so check in with a clinician too.',
  'pcos-basics': 'PCOS care is led by a clinician. These are tracking and support tools, not treatment.',
  'menopause-basics': 'Talk to a clinician first about treatment options. The rest is support for common symptoms.',
};
const CARE_FIRST = new Set(['menopause-basics', 'pmdd', 'endometriosis-basics', 'fibroids', 'pcos-basics']);
// Menopause rows keep to products made for it (no $2,000 mattress or gym creatine next to it).
const MENOPAUSE_RE = /menopaus|perimenopaus|hot[- ]?flash|night sweat|vaginal dryness/i;

function ArticleProducts({ articleId, quizResults, healthProfile, onOpenProduct }) {
  const items = useMemo(() => {
    let list = getArticleProducts(articleId, quizResults, healthProfile);
    const care = (x) => x.product.category === 'telehealth' || x.product.type === 'digital';
    // One product per brand in a row.
    const seen = new Set();
    list = list.filter((x) => { const b = String(x.product.brand || String(x.product.name).split(/\s+/).slice(0, 2).join(' ')).toLowerCase().trim(); if (seen.has(b)) return false; seen.add(b); return true; });
    if (articleId === 'menopause-basics') list = list.filter((x) => care(x) || MENOPAUSE_RE.test(`${x.product.name} ${(x.product.tags || []).join(' ')} ${(x.product.healthFunctions || []).join(' ')} ${x.product.summary || ''}`));
    // Care before supplements where the read is about clinical care.
    if (CARE_FIRST.has(articleId)) list = [...list].sort((a, b) => Number(care(b)) - Number(care(a)));
    if (articleId === 'iron-deficiency-anemia') list = [...list].sort((a, b) => Number(/\biron\b/i.test(b.product.name)) - Number(/\biron\b/i.test(a.product.name)));
    // Washes: only fragrance-free, outside-use options under a read that says most people don't need one.
    if (articleId === 'intimate-wash') list = list.filter((x) => /fragrance[- ]?free|unscented/i.test(`${x.product.name} ${(x.product.tags || []).join(' ')} ${x.product.summary || ''}`));
    return list.map((x) => {
      if (articleId === 'hormonal-birth-control' && /natural cycles/i.test(x.product.name)) return { ...x, why: 'Non-hormonal alternative' };
      if (articleId === 'pcos-basics' && /proov/i.test(x.product.name)) return { ...x, why: 'For PCOS when trying to conceive' };
      return x;
    });
  }, [articleId, quizResults, healthProfile]);
  const note = ROW_NOTES[articleId];
  const rowRef = React.useRef(null);
  const [edge, setEdge] = React.useState({ start: true, end: true });
  React.useEffect(() => {
    const el = rowRef.current;
    if (!el) return undefined;
    const read = () => setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    read();
    el.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => { el.removeEventListener('scroll', read); window.removeEventListener('resize', read); };
  }, [items.length]);
  if (items.length === 0) return note ? <section className="ay-lib-products"><p className="ay-lib-products__note">{note}</p></section> : null;
  const page = (dir) => { const el = rowRef.current; if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' }); };
  return (
    <section className="ay-lib-products" aria-labelledby="ay-lib-products-h">
      <div className="ay-lib-products__head">
        <h3 id="ay-lib-products-h">Products for this topic</h3>
        <p className="ay-lib-products__disc">Products, not medical advice. Some links earn ayna a commission. It never changes what we show.</p>
        <div className="ay-lib-products__nav">
          <button type="button" onClick={() => page(-1)} disabled={edge.start} aria-label="Previous products">←</button>
          <button type="button" onClick={() => page(1)} disabled={edge.end} aria-label="More products">→</button>
        </div>
      </div>
      {note && <p className="ay-lib-products__note">{note}</p>}
      <div className="ay-lib-products__grid" ref={rowRef}>
        {items.map(({ product, why }) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpen={onOpenProduct}
            labels={why ? <span className="ay-lib-why">{why}</span> : null}
          />
        ))}
      </div>
    </section>
  );
}

const Chevron = () => (
  <svg className="ay-lib-row__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
);

function CareRow({ title, children, open = false }) {
  return (
    <details className="ay-lib-row" open={open}>
      <summary><span>{title}</span><Chevron /></summary>
      <div className="ay-lib-row__body">{children}</div>
    </details>
  );
}

const ExtLink = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
);

function TelehealthSuggestions({ articleId, onOpenProduct }) {
  // Planned Parenthood already has its own row; don't list it twice.
  const platforms = useMemo(() => getRelevantTelehealth(articleId).filter((t) => !/planned parenthood/i.test(t.name || '')), [articleId]);

  return (
    <section className="ay-lib-care" aria-labelledby="ay-lib-care-h">
      <h2 id="ay-lib-care-h" className="ay-lib-care__h">Can&apos;t reach your doctor?</h2>

      <CareRow title="Nurse line (insurer)" open>
        <p>Many plans offer a 24/7 nurse line for symptom guidance and when to seek care. Check your insurance card or member portal for the number.</p>
      </CareRow>

      <CareRow title="Planned Parenthood (in-person & telehealth)">
        <p>In-person health centers and telehealth for reproductive and sexual health; sliding-scale and low-cost options.</p>
        <ul>
          <li><ExtLink href="https://www.plannedparenthood.org/health-center">Find a health center</ExtLink></li>
          <li><ExtLink href="https://www.plannedparenthood.org/get-care">Get care (telehealth & in-person)</ExtLink></li>
        </ul>
      </CareRow>

      <CareRow title="Find clinics near you (by zip)">
        <p>Search for low-cost and sliding-scale health centers by zip code.</p>
        <ul>
          <li><ExtLink href="https://findahealthcenter.hrsa.gov/">HRSA health centers by zip</ExtLink></li>
        </ul>
      </CareRow>

      {platforms.length > 0 && (
        <CareRow title="Telehealth for this topic">
          <ul>
            {platforms.map((t) => {
              const displaySummary = t.summary || t.description || t.tagline;
              return (
                <li key={t.id}>
                  {onOpenProduct ? (
                    <button type="button" className="ay-lib-row__link" onClick={() => onOpenProduct(t)}>{t.name}</button>
                  ) : (
                    <strong>{t.name}</strong>
                  )}
                  {displaySummary && <span className="ay-lib-row__sub">{displaySummary}</span>}
                </li>
              );
            })}
          </ul>
        </CareRow>
      )}
    </section>
  );
}

const ARTICLES = [
  {
    id: 'intimate-wash',
    image: '/articles/intimate-wash.webp',
    title: 'Intimate Washes',
    source: 'UpToDate, ACOG, CDC',
    tags: ['Gynecology', 'Vulvovaginal health'],
    teaser: 'Why the vagina is self-cleaning, when to use (or skip) cleansers, and what OB-GYNs recommend for external care.',
    body: (
      <>
        <p>The vagina is self-cleaning and maintains its own pH and bacterial balance. Douching is not recommended by major medical organizations and can increase the risk of bacterial vaginosis, yeast infection, and pelvic inflammatory disease. For the vulva (the external skin), warm water alone is often sufficient for daily hygiene.</p>
        <p>If you choose to use a cleanser, for example after exercise or for personal preference, clinicians advise selecting one that is fragrance-free, pH-balanced (around 3.5–4.5 for the vulvar area), and labeled for external use only. Avoid anything that goes inside the vagina, as well as scented soaps, body washes with strong surfactants, and vaginal deodorants or sprays.</p>
        <p><strong>Key guidelines (from UpToDate, ACOG, and CDC):</strong></p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
          <li>Avoid douching, scented soaps, and vaginal deodorants.</li>
          <li>Cleanse the vulva gently with warm water or an unfragranced, mild soap substitute.</li>
          <li>If you have recurrent irritation or infection, discuss your routine with a clinician; sometimes less is more.</li>
        </ul>
        <p><strong>When to seek care:</strong> Itching, burning, a change in discharge or smell, sores, or pain don’t need a wash; they need a check. See a clinician, since these can be signs of an infection such as BV, yeast or an STI.</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/vulvovaginal-health" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Vulvovaginal Health</a></li>
          <li><a href="https://www.uptodate.com/contents/bacterial-vaginosis-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Bacterial vaginosis (patient education)</a></li>
          <li><a href="https://www.cdc.gov/std/bv/default.htm" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>CDC – Bacterial vaginosis</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'heavy-bleeding',
    image: '/articles/heavy-bleeding.webp',
    title: 'Heavy Menstrual Bleeding',
    source: 'UpToDate, ACOG, CDC',
    tags: ['Menstrual health', 'Clinical guidance'],
    teaser: 'What counts as heavy bleeding, possible causes, when to seek care, and how it’s evaluated and treated.',
    body: (
      <>
        <p>Heavy menstrual bleeding (menorrhagia) is common and can significantly affect quality of life, work, and relationships. It may also signal underlying conditions such as fibroids, polyps, bleeding disorders, hormonal imbalances, or thyroid issues. How it’s treated depends on the cause, your age, and whether you plan to have children.</p>
        <p>There’s no single definition of heavy flow, but clinicians often use practical signs: needing to change pads or tampons every 1–2 hours, passing large clots, bleeding longer than 7 days, or having symptoms of anemia (fatigue, dizziness, pale skin, shortness of breath). If any of these describe you, or if your period has changed suddenly, it’s worth seeing a clinician. They can run tests (e.g., blood count, thyroid, imaging) and recommend options ranging from hormonal birth control or tranexamic acid to procedures like an IUD or surgery, depending on the cause.</p>
        <p><strong>When to seek care:</strong> Soaking through pads or tampons every 1–2 hours, bleeding longer than 7 days, or symptoms of anemia. Only a clinician can diagnose the cause and recommend a safe, effective treatment plan.</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/heavy-menstrual-bleeding" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Heavy Menstrual Bleeding</a></li>
          <li><a href="https://www.uptodate.com/contents/abnormal-uterine-bleeding-in-adults-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Abnormal uterine bleeding (patient education)</a></li>
          <li><a href="https://www.cdc.gov/ncbddd/blooddisorders/women/menorrhagia.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>CDC – Heavy menstrual bleeding</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'menopause-basics',
    image: '/articles/menopause-basics.webp',
    title: 'Menopause & Perimenopause',
    source: 'NAMS, UpToDate, ACOG',
    tags: ['Menopause', 'Hormone therapy'],
    teaser: 'What perimenopause and menopause are, common symptoms, and how hormone therapy and lifestyle changes can help.',
    body: (
      <>
        <p>Perimenopause is the transition period before menopause, often lasting several years, when hormone levels fluctuate and periods may become irregular. Menopause is defined as 12 consecutive months without a period and marks the end of ovarian function. Symptoms during this time can include hot flashes, night sweats, sleep problems, mood changes, vaginal dryness, and changes in skin or hair. Severity and duration vary widely.</p>
        <p>Management options include lifestyle changes (e.g., cooling strategies, sleep hygiene, exercise) and, when appropriate, hormone therapy (HT). HT can be very effective for vasomotor symptoms and vaginal dryness. Benefits and risks depend on your age, health history, and how soon after menopause you start; for many healthy people under 60 or within 10 years of menopause, benefits often outweigh risks when used at the lowest effective dose. Decisions should be made with a clinician who can review your personal and family history.</p>
        <p><strong>When to seek care:</strong> Any bleeding after your periods have stopped for 12 months should always be checked. Also see a clinician if hot flashes, sleep problems or mood changes are getting in the way of daily life.</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.menopause.org/for-women/menopause-faqs-women-s-midlife-health" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>NAMS – Menopause FAQs</a></li>
          <li><a href="https://www.uptodate.com/contents/menopausal-hormone-therapy-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Menopausal hormone therapy (patient education)</a></li>
          <li><a href="https://www.acog.org/womens-health/faqs/the-menopause-years" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – The menopause years</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'uti-prevention',
    image: '/articles/uti-prevention.webp',
    title: 'UTI Prevention',
    source: 'UpToDate, NIH, CDC',
    tags: ['Urinary health', 'Prevention'],
    teaser: 'Evidence-backed ways to reduce UTI risk and when to see a clinician for recurrent infections.',
    body: (
      <>
        <p>Recurrent urinary tract infections (UTIs) are common, especially in women. Evidence-supported prevention strategies include drinking adequate fluids, urinating after intercourse, and. When recommended by a clinician. Prophylactic low-dose antibiotics or topical estrogen for postmenopausal people (to support vaginal and urethral tissue). Cranberry products are sometimes used; evidence on effectiveness is mixed, and they are not a substitute for medical evaluation if you have frequent UTIs.</p>
        <p>If you have recurrent UTIs (e.g., several per year), it’s important to see a clinician. They can rule out structural or other causes and tailor a prevention or treatment plan, which might include behavioral changes, short-course antibiotics, or post-coital prophylaxis. Self-treating repeatedly without evaluation can mask other conditions or lead to resistance.</p>
        <p><strong>When to seek care:</strong> Get care promptly for fever, chills, back or side pain, nausea or vomiting, blood in your urine, if you’re pregnant, or if symptoms don’t improve within a day or two. These can mean a kidney infection.</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.uptodate.com/contents/urinary-tract-infections-in-adults-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – UTIs in adults (patient education)</a></li>
          <li><a href="https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-infection-uti-in-adults" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>NIDDK/NIH – Bladder infection (UTI) in adults</a></li>
          <li><a href="https://www.cdc.gov/antibiotic-use/uti.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>CDC – Urinary tract infection</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'yeast-infection-basics',
    image: '/articles/yeast-infection-basics.webp',
    title: 'Yeast Infection Basics',
    source: 'UpToDate, CDC, ACOG',
    tags: ['Vulvovaginal health', 'Infections'],
    teaser: 'What causes yeast infections, how to recognize them, when to treat at home vs. see a clinician, and how to prevent recurrence.',
    body: (
      <>
        <p>Vulvovaginal candidiasis (yeast infection) is common and is usually caused by the fungus <em>Candida albicans</em>. Symptoms often include itching, burning, redness, and a thick white discharge. Many people can recognize recurring yeast infections and use an over-the-counter antifungal (e.g., clotrimazole, miconazole) with success, but it’s important not to self-diagnose if you’re unsure. Other conditions (like bacterial vaginosis or sexually transmitted infections) can look similar and need different treatment.</p>
        <p>See a clinician if this is your first time with these symptoms, if OTC treatment hasn’t helped after a few days, if you have severe symptoms, or if infections keep coming back. Recurrent yeast infections may need a longer course of treatment or maintenance therapy. Avoiding unnecessary antibiotics, wearing breathable underwear, and limiting douches and scented products can help reduce the risk of recurrence.</p>
        <p><strong>When to seek care:</strong> See a clinician if it’s your first time, you’re pregnant, you get four or more infections a year, symptoms are severe, or they don’t clear after an over-the-counter treatment. Other infections can look similar.</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.uptodate.com/contents/candidiasis-vulvovaginal-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Vulvovaginal candidiasis (patient education)</a></li>
          <li><a href="https://www.cdc.gov/fungal/diseases/candidiasis/genital/index.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>CDC – Genital / vulvovaginal candidiasis</a></li>
          <li><a href="https://www.acog.org/womens-health/faqs/vulvovaginal-health" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Vulvovaginal health</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'period-pain-when-to-seek-care',
    image: '/articles/period-pain-when-to-seek-care.webp',
    title: 'Period Pain: When to Seek Care',
    source: 'ACOG, UpToDate, Mayo Clinic',
    tags: ['Menstrual health', 'Pain'],
    teaser: 'Normal cramps vs. signs that something else may be going on, and what treatments and workups clinicians may suggest.',
    body: (
      <>
        <p>Mild to moderate menstrual cramps are common and often improve with over-the-counter pain relievers (e.g., ibuprofen, naproxen), heat, and exercise. For some people, period pain is severe enough to affect daily life. This is sometimes called dysmenorrhea and can be primary (no underlying condition) or secondary (due to conditions such as endometriosis, fibroids, or adenomyosis).</p>
        <p>It’s worth seeing a clinician if your cramps are severe, suddenly worse than usual, or don’t respond to OTC options; if you have heavy bleeding, pain between periods, or pain with sex; or if you’re missing school or work regularly because of period symptoms. A clinician can help rule out other causes and suggest treatments such as hormonal birth control, prescription pain relievers, or further evaluation (e.g., ultrasound) if needed.</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Dysmenorrhea (painful periods)</a></li>
          <li><a href="https://www.uptodate.com/contents/dysmenorrhea-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Dysmenorrhea (patient education)</a></li>
          <li><a href="https://www.mayoclinic.org/diseases-conditions/menstrual-cramps/symptoms-causes/syc-20374938" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Mayo Clinic – Menstrual cramps</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'pcos-basics',
    image: '/articles/pcos-basics.webp',
    title: 'PCOS: What It Is and How It\'s Managed',
    source: 'ACOG, Endocrine Society, UpToDate',
    tags: ['Hormones', 'Reproductive health'],
    teaser: 'Polycystic ovary syndrome explained. Diagnosis, symptoms, and evidence-based treatment options including lifestyle and medication.',
    body: (
      <>
        <p>Polycystic ovary syndrome (PCOS) is a common hormonal condition that affects how the ovaries work. Diagnosis is based on criteria that may include irregular or absent periods, high androgen levels (e.g., excess hair growth, acne), and/or polycystic-appearing ovaries on ultrasound. Not everyone has all features; a clinician makes the diagnosis and rules out other conditions (e.g., thyroid, prolactin).</p>
        <p>Management depends on your goals and symptoms. Options may include cycle regulation, support for insulin resistance, and treatment for acne or excess hair.</p>
        <p>Lifestyle changes such as balanced eating and regular movement can support metabolic health. If you are trying to conceive, a clinician may discuss ovulation induction or other fertility treatment.</p>
        <p><strong>When to seek care:</strong> Irregular periods, unexplained weight changes, severe acne or excess hair, or difficulty conceiving. Early diagnosis and treatment can reduce long-term risks (e.g., diabetes, cardiovascular).</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/polycystic-ovary-syndrome-pcos" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Polycystic ovary syndrome (PCOS)</a></li>
          <li><a href="https://www.endocrine.org/patient-engagement/endocrine-library/pcos" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Endocrine Society – PCOS</a></li>
          <li><a href="https://www.uptodate.com/contents/polycystic-ovary-syndrome-pcos-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – PCOS (patient education)</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'pelvic-floor-dysfunction',
    image: '/articles/pelvic-floor-dysfunction.webp',
    title: 'Pelvic Floor Dysfunction',
    source: 'ACOG, UpToDate, APTA',
    tags: ['Pelvic health', 'Physical therapy'],
    teaser: 'What the pelvic floor does, common symptoms of dysfunction, and how pelvic floor physical therapy and at-home tools can help.',
    body: (
      <>
        <p>The pelvic floor is a group of muscles and tissues that support the bladder, uterus, vagina, and rectum. Dysfunction can mean these muscles are too tight (holding tension, pain with sex or insertion, constipation), too weak (leaking with cough or exercise, pelvic pressure), or uncoordinated. Causes can include childbirth, surgery, chronic straining, or prolonged sitting.</p>
        <p>Pelvic floor physical therapy (PFPT) is the mainstay of treatment: a specially trained PT evaluates and treats with internal and external techniques, exercises, and lifestyle guidance. At-home tools. Such as dilators, pelvic wands, or biofeedback devices. Are often used as part of a prescribed plan. It's important not to self-treat with devices if you have pain or unexplained symptoms; a clinician or pelvic PT can tailor a safe plan.</p>
        <p><strong>When to seek care:</strong> Leaking urine or stool, pain with sex or tampon use, persistent pelvic pain, pressure or bulging, or difficulty emptying. Early evaluation can prevent worsening and improve quality of life.</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/pelvic-floor-disorders" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Pelvic floor disorders</a></li>
          <li><a href="https://www.uptodate.com/contents/pelvic-floor-muscle-training-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Pelvic floor muscle training (patient education)</a></li>
          <li><a href="https://www.apta.org/your-practice/patient-populations/womens-health/pelvic-floor" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>APTA – Pelvic floor</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'endometriosis-basics',
    image: '/articles/endometriosis-basics.webp',
    title: 'Endometriosis: Symptoms, Diagnosis, and Care',
    source: 'ACOG, EndoFound, UpToDate',
    tags: ['Chronic pain', 'Reproductive health'],
    teaser: 'What endometriosis is, how it\'s diagnosed, and treatment options. From pain management to surgery and fertility support.',
    body: (
      <>
        <p>Endometriosis is a condition where tissue similar to the uterine lining grows outside the uterus (e.g., on the ovaries, pelvic lining, bowel). It can cause painful periods, chronic pelvic pain, pain with sex, and sometimes bowel or bladder symptoms. In some people it also affects fertility. Diagnosis can be suspected by history and exam; imaging (ultrasound, sometimes MRI) or laparoscopy may be used to confirm.</p>
        <p>Treatment depends on your symptoms and goals. Options include pain management (NSAIDs, hormonal birth control, or other hormone-suppressing medications), pelvic floor physical therapy for pain and muscle tension, and surgery to remove or ablate lesions when appropriate. There is no cure, but symptoms can be managed. If you're trying to conceive, a specialist can discuss fertility-preserving or assisted-reproduction options.</p>
        <p><strong>When to seek care:</strong> Severe period or pelvic pain, pain with sex, heavy bleeding, or difficulty conceiving. Early diagnosis can help you get effective treatment and avoid unnecessary delay.</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/endometriosis" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Endometriosis</a></li>
          <li><a href="https://www.endofound.org/endometriosis" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Endometriosis Foundation of America – Endometriosis</a></li>
          <li><a href="https://www.uptodate.com/contents/endometriosis-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Endometriosis (patient education)</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'bacterial-vaginosis',
    image: '/articles/bacterial-vaginosis.webp',
    title: 'Bacterial Vaginosis (BV)',
    source: 'CDC, ACOG, UpToDate',
    tags: ['Vaginal health', 'Infections'],
    teaser: 'What causes BV, how it differs from a yeast infection, treatment options, and why it tends to recur.',
    body: (
      <>
        <p>Bacterial vaginosis (BV) is the most common vaginal condition in people of reproductive age. It occurs when the balance of bacteria in the vagina is disrupted. The protective <em>Lactobacillus</em> bacteria decrease while other bacteria overgrow. BV is not an STI, but having it can increase susceptibility to STIs. Symptoms include a thin, grayish-white discharge with a fishy odor, especially after sex. Many people have no symptoms at all.</p>
        <p>BV is treated with antibiotics (metronidazole or clindamycin, oral or vaginal). Recurrence is common. Up to 50% within a year. Strategies that may help reduce recurrence include using condoms consistently, avoiding douching, and in some cases using boric acid suppositories or probiotic regimens (discuss with your clinician first). If BV keeps coming back, a clinician can assess whether suppressive therapy is appropriate.</p>
        <p><strong>When to seek care:</strong> Unusual discharge, odor, or irritation. Especially if symptoms don't improve with OTC treatments or keep coming back. BV during pregnancy needs treatment to reduce risk of complications.</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.cdc.gov/std/bv/default.htm" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>CDC – Bacterial vaginosis</a></li>
          <li><a href="https://www.acog.org/womens-health/faqs/vulvovaginal-health" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Vulvovaginal health</a></li>
          <li><a href="https://www.uptodate.com/contents/bacterial-vaginosis-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Bacterial vaginosis (patient education)</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'pmdd',
    image: '/articles/pmdd.webp',
    title: 'PMDD: Premenstrual Dysphoric Disorder',
    source: 'ACOG, IAPMD, UpToDate',
    tags: ['Mental health', 'Hormonal health'],
    teaser: 'How PMDD differs from PMS, what causes it, and evidence-based treatments including SSRIs, hormonal options, and lifestyle support.',
    body: (
      <>
        <p>Premenstrual dysphoric disorder (PMDD) is a severe, cyclical mood disorder linked to hormonal fluctuations in the luteal phase (the week or two before a period). Unlike PMS, PMDD significantly impairs daily functioning. Symptoms may include intense mood swings, irritability or anger, depression, anxiety, hopelessness, fatigue, difficulty concentrating, and physical symptoms. Symptoms typically resolve within a few days of menstruation starting.</p>
        <p>PMDD is a recognized medical condition and is treatable. First-line treatments include SSRIs (e.g., fluoxetine, sertraline), which can be taken daily or only during the luteal phase. Hormonal approaches. Such as combined oral contraceptives or GnRH agonists. Are also used in some cases. Lifestyle strategies (regular exercise, sleep hygiene, stress management, and dietary changes) can support but usually don't replace medical treatment for moderate-to-severe PMDD. A clinician can help confirm the diagnosis (often using a symptom diary over 2 cycles) and recommend a treatment plan.</p>
        <p><strong>When to seek care:</strong> If premenstrual mood symptoms are severe enough to affect relationships, work, or daily life. Especially if you've ever had thoughts of self-harm. PMDD is underdiagnosed; you deserve support.</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/premenstrual-syndrome" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Premenstrual syndrome (PMS)</a></li>
          <li><a href="https://iapmd.org/about-pmdd" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>IAPMD – About PMDD</a></li>
          <li><a href="https://www.uptodate.com/contents/premenstrual-syndrome-and-premenstrual-dysphoric-disorder-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – PMS and PMDD (patient education)</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'fibroids',
    image: '/articles/fibroids.webp',
    title: 'Uterine Fibroids',
    source: 'ACOG, NIH, UpToDate',
    tags: ['Chronic conditions', 'Menstrual health'],
    teaser: 'What fibroids are, why they cause heavy bleeding and pain, and the range of treatment options from watchful waiting to surgery.',
    body: (
      <>
        <p>Uterine fibroids are noncancerous growths in or on the uterus. They are very common. Up to 80% of people with a uterus develop fibroids by age 50, though many never cause symptoms. When symptoms occur, they can include heavy or prolonged periods, pelvic pressure or pain, frequent urination, and in some cases difficulty conceiving. Fibroids vary in size, number, and location, all of which affect symptoms and treatment options.</p>
        <p>Treatment depends on symptom severity, fibroid characteristics, and your reproductive goals. Options range from watchful waiting (for small, asymptomatic fibroids) to medications that temporarily shrink fibroids or reduce bleeding, to minimally invasive procedures (e.g., uterine fibroid embolization, focused ultrasound) and surgery (myomectomy to preserve the uterus, or hysterectomy). If heavy bleeding is causing anemia, iron supplementation and managing blood loss are also important parts of care.</p>
        <p><strong>When to seek care:</strong> Heavy periods soaking through products, pelvic pain or pressure, unusually large or rapidly changing abdomen, or difficulty conceiving. Fibroids are highly treatable when caught early.</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/uterine-fibroids" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Uterine fibroids</a></li>
          <li><a href="https://www.nichd.nih.gov/health/topics/uterine" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>NIH/NICHD – Uterine fibroids</a></li>
          <li><a href="https://www.uptodate.com/contents/uterine-fibroids-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Uterine fibroids (patient education)</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'iron-deficiency-anemia',
    image: '/articles/iron-deficiency-anemia.webp',
    title: 'Iron Deficiency & Anemia from Heavy Periods',
    source: 'ACOG, NIH, UpToDate',
    tags: ['Menstrual health', 'Nutrition'],
    teaser: 'How heavy periods deplete iron, symptoms to watch for, and how to address deficiency through diet, supplements, and treating the root cause.',
    body: (
      <>
        <p>Heavy menstrual bleeding is one of the most common causes of iron deficiency and iron deficiency anemia in people who menstruate. Iron is lost with blood, and if monthly losses consistently exceed dietary intake, iron stores become depleted. Early iron deficiency may cause fatigue, brain fog, difficulty concentrating, and feeling cold. Even before anemia develops. Anemia (low red blood cells) adds shortness of breath, dizziness, rapid heart rate, and pale skin to those symptoms.</p>
        <p>Treatment involves addressing both the iron deficiency and, where possible, reducing the underlying blood loss. Oral iron supplements (ferrous sulfate, ferrous gluconate, or ferric) taken on alternating days or with vitamin C to improve absorption are commonly recommended. IV iron infusion may be used for severe deficiency or poor oral tolerance. Dietary iron from red meat, leafy greens, legumes, and fortified foods can help maintain levels but often isn't enough on its own to correct established deficiency. Treating the cause of heavy bleeding (e.g., fibroids, hormonal imbalance) is equally important.</p>
        <p><strong>When to seek care:</strong> Persistent fatigue, shortness of breath, or dizziness. Particularly if you have heavy periods. A simple blood test can diagnose deficiency before it becomes anemia.</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/heavy-menstrual-bleeding" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Heavy menstrual bleeding</a></li>
          <li><a href="https://www.nhlbi.nih.gov/health/anemia/iron-deficiency-anemia" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>NIH/NHLBI – Iron deficiency anemia</a></li>
          <li><a href="https://www.uptodate.com/contents/iron-deficiency-anemia-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Iron deficiency anemia (patient education)</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'ovarian-cysts',
    image: '/articles/ovarian-cysts.webp',
    title: 'Ovarian Cysts',
    source: 'ACOG, Mayo Clinic, UpToDate',
    tags: ['Reproductive health', 'Pelvic health'],
    teaser: 'Most ovarian cysts are harmless and resolve on their own. Here\'s how to tell when monitoring is enough and when to seek care.',
    body: (
      <>
        <p>Ovarian cysts are fluid-filled sacs that develop on or within an ovary. Most are functional cysts. They form as a normal part of the menstrual cycle (e.g., a follicle that doesn't release an egg, or a corpus luteum that fills with fluid) and resolve on their own within a few cycles without treatment. They're often found incidentally on ultrasound and cause no symptoms.</p>
        <p>When symptoms occur they can include pelvic aching or fullness, bloating, or pain with sex. A ruptured cyst can cause sudden, sharp pelvic pain. Ovarian torsion (twisting) is a medical emergency with sudden severe pain, nausea, and vomiting. Most simple cysts in premenopausal people are benign and managed with watchful waiting and repeat imaging. Complex cysts, cysts in postmenopausal people, or those causing symptoms may need further evaluation or surgical removal. Cysts associated with PCOS or endometriosis (endometriomas) are managed differently based on the underlying condition.</p>
        <p><strong>When to seek care:</strong> Sudden severe pelvic pain, pain with fever or vomiting (emergency), persistent or worsening pelvic pain, or any new cyst found after menopause.</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/ovarian-cysts" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Ovarian cysts</a></li>
          <li><a href="https://www.mayoclinic.org/diseases-conditions/ovarian-cysts/symptoms-causes/syc-20353405" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Mayo Clinic – Ovarian cysts</a></li>
          <li><a href="https://www.uptodate.com/contents/ovarian-cysts-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Ovarian cysts (patient education)</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'hormonal-birth-control',
    image: '/articles/hormonal-birth-control.webp',
    title: 'Hormonal Birth Control: Types, Benefits & Side Effects',
    source: 'ACOG, Planned Parenthood, UpToDate',
    tags: ['Contraception', 'Hormonal health'],
    teaser: 'A plain-language guide to pills, patches, rings, shots, implants, and hormonal IUDs. How they work, what side effects to expect, and how to choose.',
    body: (
      <>
        <p>Hormonal contraceptives work primarily by preventing ovulation, thickening cervical mucus, or thinning the uterine lining. They come in many forms: combined estrogen-progestin methods (pill, patch, ring) and progestin-only methods (mini-pill, shot/Depo-Provera, hormonal IUD, implant). Effectiveness ranges from 91–99%+ with typical or perfect use. All require a prescription or clinical insertion.</p>
        <p>Beyond contraception, hormonal methods are widely used to manage period pain, heavy bleeding, endometriosis, PCOS, acne, and PMDD. Side effects vary by method and person. Common ones include nausea, spotting, mood changes, and breast tenderness, most of which improve within a few months. Serious risks (e.g., blood clots with estrogen-containing methods) are rare but relevant for people who smoke, have certain migraines, or have a history of clotting. There is no single "best" method. The right choice depends on your health history, side effect tolerance, convenience needs, and whether you want a period.</p>
        <p><strong>When to seek care:</strong> To discuss which method is right for you, if you're experiencing side effects that affect your quality of life, or if you want to switch methods. Don't stop hormonal contraception abruptly without a plan.</p>
        <p><strong>Sources:</strong></p>
        <ul className="ay-lib-sources" style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/hormonal-birth-control" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Hormonal birth control</a></li>
          <li><a href="https://www.plannedparenthood.org/learn/birth-control" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Planned Parenthood – Birth control options</a></li>
          <li><a href="https://www.uptodate.com/contents/hormonal-methods-of-birth-control-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Hormonal birth control (patient education)</a></li>
        </ul>
      </>
    ),
  },
];

/** Return articles relevant to quiz answers (for recommendations page). */
export function getRecommendedArticles(quizAnswers, healthProfile = null) {
  const userTags = new Set([
    ...(quizAnswers?.frustrations || []).map((f) => FRUSTRATION_TO_TAG[f]).filter(Boolean),
    ...inferTagsFromHealthProfile(healthProfile),
  ]);

  const prefs = Array.isArray(quizAnswers?.preference)
    ? quizAnswers.preference
    : (quizAnswers?.preference ? [quizAnswers.preference] : []);
  if (prefs.includes('Privacy & data security')) userTags.add('privacy');

  if (userTags.size === 0) {
    return ARTICLES.slice(0, 3);
  }
  const scored = ARTICLES.map((art) => {
    const focus = ARTICLE_FOCUS_TAGS[art.id] || [];
    const score = focus.filter((t) => userTags.has(t)).length;
    return { article: art, score };
  });
  const withScore = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.article);
  const rest = scored.filter((s) => s.score === 0).map((s) => s.article);
  const out = [...withScore, ...rest];
  return out.slice(0, 5);
}

/** All articles sorted by relevance to health profile (for Articles page filter). */
export function getArticlesByProfileRelevance(quizAnswers, healthProfile = null) {
  const userTags = new Set([
    ...(quizAnswers?.frustrations || []).map((f) => FRUSTRATION_TO_TAG[f]).filter(Boolean),
    ...inferTagsFromHealthProfile(healthProfile),
  ]);
  const prefs = Array.isArray(quizAnswers?.preference)
    ? quizAnswers.preference
    : (quizAnswers?.preference ? [quizAnswers.preference] : []);
  if (prefs.includes('Privacy & data security')) userTags.add('privacy');
  if (userTags.size === 0) return [];
  const scored = ARTICLES.map((art) => {
    const focus = ARTICLE_FOCUS_TAGS[art.id] || [];
    const score = focus.filter((t) => userTags.has(t)).length;
    return { article: art, score };
  });
  const withScore = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.article);
  const rest = scored.filter((s) => s.score === 0).map((s) => s.article);
  return [...withScore, ...rest];
}

export { ARTICLES };

/**
 * Website covers: every read gets a typographic cover (short topic word on a
 * token pastel) so the shelves stay in one palette. Website-only: the app
 * keeps its own art via ARTICLES.image. Add an id here only for art drawn in
 * the ayna palette and style.
 */
const KEEP_ILLUSTRATION = new Set();
import TopicCover from './v3/TopicCover.jsx';

function ArticleCover({ art, large = false }) {
  if (art.image && KEEP_ILLUSTRATION.has(art.id)) {
    return <img className={large ? 'ay-web-lib-article__img' : 'ay-web-lib-card__img'} src={art.image} alt="" loading={large ? undefined : 'lazy'} />;
  }
  if (large) return null;
  return <TopicCover id={art.id} title={art.title} />;
}

/* Bold lead-ins ("When to seek care:") become real H2 subheadings, so the
   read can be skimmed and screen readers get structure. */
function withHeadings(body) {
  const kids = React.isValidElement(body) ? React.Children.toArray(body.props.children) : [];
  if (!kids.length) return body;
  const out = [];
  kids.forEach((el, i) => {
    if (React.isValidElement(el) && el.type === 'p') {
      const parts = React.Children.toArray(el.props.children);
      const lead = parts[0];
      if (React.isValidElement(lead) && lead.type === 'strong') {
        const text = React.Children.toArray(lead.props.children).join('').trim();
        if (/:$/.test(text) && text.length < 70) {
          const label = text.replace(/:$/, '').replace(/\s*\(from [^)]*\)\s*$/i, '');
          out.push(<h2 key={`h-${i}`} className="ay-lib-h2">{label}</h2>);
          const rest = parts.slice(1);
          const hasText = rest.some((r) => (typeof r === 'string' ? r.trim() : true));
          if (hasText) out.push(<p key={`p-${i}`}>{rest.map((r) => (typeof r === 'string' ? r.replace(/^\s+/, '') : r))}</p>);
          return;
        }
      }
    }
    out.push(el);
  });
  return <>{out}</>;
}

function renderArticleCard(art, setSelectedId, progress = 0) {
  // A real link: open in a new tab, copy the address, see where it goes.
  return (
    <a href={`/library/${art.id}`} className="ay-web-lib-card ay-lib-card" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; e.preventDefault(); setSelectedId(art.id); }}>
      <span className="ay3-clip__mast" aria-hidden="true"><span>ayna library</span><span>{minutesFor(art)} min</span></span>
      <ArticleCover art={art} />
      <h3>{art.title}</h3>
      <p>{art.teaser}</p>
      <span className="ay-lib-card__foot" data-min={minutesFor(art) > 3 ? `${minutesFor(art)} min read ·` : undefined}>
        <span className="ay-lib-card__tags">
          <span className="ay-lib-tag">{sectionOf(art.id)?.label || 'Health'}</span>
        </span>
        <span className="ay-lib-card__src">{art.source}</span>
        <ReadState value={progress} />
      </span>
    </a>
  );
}

// One taxonomy: every read lives in exactly one section, and the read's own
// header, the filter chips and "Next in …" all use it.
const ARTICLE_CATEGORIES = [
  { id: 'menstrual', label: 'Menstrual Health', articleIds: ['heavy-bleeding', 'period-pain-when-to-seek-care', 'fibroids', 'iron-deficiency-anemia'] },
  { id: 'hormonal', label: 'Hormonal Health', articleIds: ['pcos-basics', 'menopause-basics', 'pmdd', 'hormonal-birth-control'] },
  { id: 'chronic', label: 'Chronic & Pelvic Conditions', articleIds: ['endometriosis-basics', 'pelvic-floor-dysfunction', 'ovarian-cysts'] },
  { id: 'vaginal-urinary', label: 'Vaginal & Urinary Health', articleIds: ['intimate-wash', 'uti-prevention', 'yeast-infection-basics', 'bacterial-vaginosis'] },
];
const sectionOf = (id) => ARTICLE_CATEGORIES.find((c) => c.articleIds.includes(id)) || null;
// Next read: the next one in the same section, looping (never a funnel to one page).
function nextInSection(id) {
  const sec = sectionOf(id);
  if (!sec || sec.articleIds.length < 2) return null;
  const i = sec.articleIds.indexOf(id);
  const nextId = sec.articleIds[(i + 1) % sec.articleIds.length];
  const article = ARTICLES.find((x) => x.id === nextId);
  return article ? { article, label: `Next in ${sec.label}` } : null;
}


const READ_PROGRESS_KEY = 'ayna_read_progress_v1';
// Reading history is kept per account, so after logout (or on a shared
// computer) nobody sees which topics the last person read about. The old
// shared key is handed to the first account that signs in on this browser.
function progressKey(userId) { return `${READ_PROGRESS_KEY}:${userId || 'guest'}`; }
function loadReadProgress(userId) {
  try {
    const own = localStorage.getItem(progressKey(userId));
    if (own) return JSON.parse(own) || {};
    if (userId) {
      const legacy = localStorage.getItem(READ_PROGRESS_KEY);
      if (legacy) {
        localStorage.setItem(progressKey(userId), legacy);
        localStorage.removeItem(READ_PROGRESS_KEY);
        return JSON.parse(legacy) || {};
      }
    }
    return {};
  } catch { return {}; }
}
// A read counts as finished only after real reading: most of the body
// scrolled AND some time on the page (not a quick scroll to the bottom).
const FINISH_MIN_MS = 45000;

/** One progress style everywhere: mint fill on an ink outline + label. Unread reads get a small "New" tag instead of an empty bar. */
function ProgressBar({ value = 0, className = '' }) {
  return <i className={`ay-lib-bar ${className}`.trim()} aria-hidden="true"><b style={{ width: `${Math.round(Math.min(1, value) * 100)}%` }} /></i>;
}

function ReadState({ value = 0 }) {
  // Unread reads show nothing (a "New" tag on every read meant nothing).
  if (!(value > 0)) return null;
  const done = value >= 1;
  return <span className="ay-lib-state">
    <ProgressBar value={value} />
    <small>{done ? 'Finished' : `${Math.round(value * 100)}% read`}</small>
  </span>;
}

// Read time from the article's real words (about 220 a minute), never a fixed number.
function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return ` ${node} `;
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (React.isValidElement(node)) return textOf(node.props.children);
  return '';
}
const MINUTES = new Map();
function minutesFor(article) {
  if (!article) return 1;
  if (!MINUTES.has(article.id)) {
    const words = textOf(article.body).split(/\s+/).filter(Boolean).length;
    MINUTES.set(article.id, Math.max(1, Math.round(words / 220)));
  }
  return MINUTES.get(article.id);
}

const validId = (id) => (id && ARTICLES.some((a) => a.id === id) ? id : null);

/**
 * Website Library.
 * - `initialArticleId`: open this read (an ARTICLES `id`, e.g. 'bacterial-vaginosis').
 *   Changing it later opens that read, or closes the open one when it becomes null.
 * - `onArticleChange(idOrNull)`: called whenever the open read changes (not on mount).
 */
export default function Articles({ initialArticleId, onOpenProduct, quizResults, healthProfile = null, onArticleChange, userId = null, onAsk = null }) {
  const [selectedId, setSelectedId] = useState(() => validId(initialArticleId));
  // A broken read link says so (it used to quietly show the whole list at the wrong address).
  const missingRead = Boolean(initialArticleId) && !validId(initialArticleId) && !selectedId;
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [progress, setProgress] = useState(() => loadReadProgress(userId));
  React.useEffect(() => { setProgress(loadReadProgress(userId)); }, [userId]);
  const selected = ARTICLES.find((a) => a.id === selectedId);
  // Opening a read un-crumples the page; closing crumples it back before the
  // shelf returns. Reduced motion skips the delay.
  const [closing, setClosing] = useState(false);
  const closeRead = () => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // No crumple animation: reads open and close straight away (Pass 7 audit).
    void reduce; void setClosing;
    setSelectedId(null);
  };

  // Same personalised shelves as the app's Library: reads matched to the
  // quiz answers first, then each topic with no repeats.
  // Same four sections signed in or out (only "For you" is added for members).
  const rows = useMemo(() => ARTICLE_CATEGORIES.map((c) => ({ id: c.id, label: c.label, items: c.articleIds.map((id) => ARTICLES.find((a) => a.id === id)).filter(Boolean) })), []);
  const { forYou, hasProfile } = useMemo(() => {
    const lib = buildLibrary(ARTICLES, quizResults);
    if (lib.forYou.length) return lib;
    // Older website profiles: fall back to the website's own relevance ranking.
    const legacy = getArticlesByProfileRelevance(quizResults || {}, healthProfile);
    const legacyHas = !!(quizResults?.frustrations?.length) || inferTagsFromHealthProfile(healthProfile).length > 0;
    return legacyHas ? { ...lib, forYou: legacy.slice(0, 6), hasProfile: true } : lib;
  }, [quizResults, healthProfile]);

  const progressOf = (a) => progress[a.id] || 0;
  const finished = ARTICLES.filter((a) => progressOf(a) >= 1).length;
  const keepReading = ARTICLES.filter((a) => progressOf(a) > 0 && progressOf(a) < 1);
  const topics = [['all', 'All'], ...(hasProfile && forYou.length ? [['foryou', 'For you']] : []), ...rows.map((r) => [r.id, r.label])];

  // Follow the prop when it changes after mount (e.g. URL /library/:slug, back button).
  const firstProp = React.useRef(true);
  React.useEffect(() => {
    if (firstProp.current) { firstProp.current = false; return; }
    setSelectedId(validId(initialArticleId));
  }, [initialArticleId]);

  // Tell the parent whenever the open read changes.
  const changeCb = React.useRef(onArticleChange);
  React.useEffect(() => { changeCb.current = onArticleChange; }, [onArticleChange]);
  const lastReported = React.useRef(selectedId);
  React.useEffect(() => {
    if (lastReported.current === selectedId) return;
    lastReported.current = selectedId;
    changeCb.current?.(selectedId);
  }, [selectedId]);

  const record = React.useCallback((id, value) => setProgress((prev) => {
    const v = Math.round(Math.min(1, value) * 20) / 20;
    if (!id || (prev[id] || 0) >= v) return prev;
    const next = { ...prev, [id]: v };
    try { localStorage.setItem(progressKey(userId), JSON.stringify(next)); } catch { /* storage blocked */ }
    return next;
  }), [userId]);

  // Reading progress: how far you've scrolled through the article body,
  // starting from 0 at the top (not how much happens to fit on screen).
  const bodyRef = React.useRef(null);
  const [scrolled, setScrolled] = useState(0);
  React.useEffect(() => {
    if (!selected) return undefined;
    try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch { window.scrollTo(0, 0); }
    setScrolled(0);
    // Only count scrolling the reader does (wheel, touch, keys, scrollbar),
    // so opening a read never jumps straight to "39% read" or "Finished".
    let engaged = false;
    const openedAt = Date.now();
    let maxValue = 0;
    const finishTimer = window.setTimeout(() => { if (maxValue >= 0.6) record(selected.id, 1); }, FINISH_MIN_MS);
    const onScroll = () => {
      const el = bodyRef.current;
      if (!el || !engaged) return;
      const bottom = el.getBoundingClientRect().bottom + window.scrollY;
      const total = bottom - window.innerHeight;
      const value = total <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / total));
      setScrolled(value);
      // Past 60% for 45 seconds counts as finished; before that, cap below 100%.
      maxValue = Math.max(maxValue, value);
      const longEnough = Date.now() - openedAt >= FINISH_MIN_MS;
      const counted = value >= 0.6 && longEnough ? 1 : Math.min(value, 0.95);
      if (value > 0.02) record(selected.id, counted);
    };
    const engage = () => { engaged = true; };
    const engageEvents = ['wheel', 'touchmove', 'keydown', 'pointerdown'];
    engageEvents.forEach((t) => window.addEventListener(t, engage, { passive: true }));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(finishTimer);
      engageEvents.forEach((t) => window.removeEventListener(t, engage));
      window.removeEventListener('scroll', onScroll);
    };
  }, [selected, record]);

  // Sticky read bar sits right under the sticky site header (if there is one).
  const statusRef = React.useRef(null);
  React.useEffect(() => {
    if (!selected) return undefined;
    const nav = document.querySelector('.app-nav-wrap');
    const el = statusRef.current;
    if (!el) return undefined;
    const apply = () => {
      const pos = nav ? getComputedStyle(nav).position : '';
      const h = nav && (pos === 'sticky' || pos === 'fixed') ? Math.round(nav.getBoundingClientRect().height) : 0;
      el.style.setProperty('--ay-lib-sticky-top', `${h}px`);
    };
    apply();
    if (!nav || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(apply);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [selected]);

  const [barSmall, setBarSmall] = React.useState(false);
  React.useEffect(() => {
    const on = () => setBarSmall(window.scrollY > 320);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const open = (id) => setSelectedId(id);
  const card = (a) => <li key={a.id}>{renderArticleCard(a, open, progressOf(a))}</li>;
  const shelf = (id, label, items) => items.length > 0 && <div key={id} id={`lib-${id}`} className="ay-web-lib-cat ay-wiki-sec">
    <h2><span>{label}</span>{id === 'keep' && finished > 0
      ? <span className="ay-lib-total is-inline" aria-label={`${finished} of ${ARTICLES.length} finished`}><span>{finished}/{ARTICLES.length} read</span><ProgressBar value={finished / ARTICLES.length} /></span>
      : <small>{items.length} read{items.length === 1 ? '' : 's'}</small>}</h2>
    <ul className="ay-web-lib-grid ay-lib-shelf">{items.map(card)}</ul>
  </div>;

  if (selected) {
    const next = nextInSection(selected.id);
    const done = progressOf(selected) >= 1;
    const label = done ? 'Finished' : scrolled > 0.02 ? `${Math.round(scrolled * 100)}% read` : `${minutesFor(selected)} min read`;
    return (
      <section className="container animate-fade-in-up ay-web-library ay-lib-reading">
        {/* A thin reading line under the header, not a second sticky bar. */}
        <div className="ay-lib-line" ref={statusRef} role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((done ? 1 : scrolled) * 100)} aria-valuetext={label}>
          <span style={{ width: `${Math.round((done ? 1 : scrolled) * 100)}%` }} />
        </div>
        <button type="button" className="ay-lib-backlink" onClick={closeRead}><span aria-hidden="true">←</span> Library</button>
        <article key={selected.id} className={`ay-web-lib-article ay3-paper${closing ? ' is-crumpling' : ''}`}>
          <h1 className="ay-article-title">{selected.title}</h1>
          <div className="ay-lib-article__tags">
            <span className="ay-lib-tag">{sectionOf(selected.id)?.label || 'Health'}</span>
          </div>
          {/* Category once (the tag above), sources once in full at the end; this line jumps there. */}
          <button type="button" className="ay-lib-article__src ay-lib-article__srclink" onClick={() => bodyRef.current?.querySelector('.ay-lib-sources')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Sources: {selected.source} <span aria-hidden="true">↓</span></button>
          <ArticleCover art={selected} large />
          <div className="article-body" ref={bodyRef}>
            {withHeadings(selected.body)}
          </div>

          <TelehealthSuggestions articleId={selected.id} onOpenProduct={onOpenProduct} />
          {next && <button type="button" className="ay-web-next-read" onClick={() => open(next.article.id)}>
            <small>{next.label}</small><strong>{next.article.title}</strong><span aria-hidden="true">→</span>
          </button>}
        </article>
        {/* Shopping sits outside the medical read, labelled as products. */}
        <div className="ay-lib-products-wrap">
          <ArticleProducts articleId={selected.id} quizResults={quizResults} healthProfile={healthProfile} onOpenProduct={onOpenProduct} />
        </div>
        <aside className={`ay3-infobox${closing ? ' is-crumpling' : ''}`} aria-label="About this read">
                    {(() => {
            const related = ARTICLES.filter((a) => a.id !== selected.id && (a.tags || []).some((t) => (selected.tags || []).includes(t))).slice(0, 4);
            return related.length > 0 && (
              <div className="ay3-infobox__rel">
                <p className="ay3-libside__title">Related reads</p>
                <ul>{related.map((a) => <li key={a.id}><button type="button" onClick={() => open(a.id)}>{a.title}</button></li>)}</ul>
              </div>
            );
          })()}
        </aside>
      </section>
    );
  }

  const q = query.trim().toLowerCase();
  let body;
  const inTopic = (a) => topic === 'all' || (topic === 'foryou' ? forYou.some((f) => f.id === a.id) : (rows.find((r) => r.id === topic)?.items || []).some((x) => x.id === a.id));
  const shown = q.length >= 2 ? searchArticles(query, ARTICLES).filter(inTopic) : null;
  if (q.length >= 2) {
    const results = shown;
    body = results.length ? <ul className="ay-web-lib-grid">{results.map(card)}</ul> : (
      <div className="ay-lib-zero" role="status">
        <p className="ay-lib-zero__h">Nothing for “{query.trim()}” yet.</p>
        <p>Try a topic:</p>
        <div className="ay-lib-zero__chips">{rows.slice(0, 3).map((r) => <button type="button" key={r.id} onClick={() => { setQuery(''); setTopic(r.id); }}>{r.label}</button>)}</div>
        <div className="ay-lib-zero__actions">
          {onAsk && <button type="button" className="ay-lib-zero__ask" onClick={() => onAsk(query.trim())}>Ask ayna about {query.trim()}</button>}
          <button type="button" className="ay-lib-zero__req" onClick={() => document.querySelector('.ay-web-lib-suggest')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Request a read</button>
        </div>
      </div>
    );
  } else if (topic !== 'all') {
    const items = topic === 'foryou' ? forYou : (rows.find((r) => r.id === topic)?.items || []);
    body = <ul className="ay-web-lib-grid">{items.map(card)}</ul>;
  } else {
    body = <>
      {shelf('keep', 'Keep reading', keepReading)}
      {hasProfile ? <>{shelf('foryou', 'Top 3 for you', forYou.slice(0, 3))}{(() => {
        // Say why these are "for you", in her words from the quiz.
        const said = [...new Set([...(quizResults?.fullHealthIntake?.supportSelections || []), ...(quizResults?.frustrations || [])].map((x) => String(x).trim()).filter(Boolean))].slice(0, 3);
        return said.length && forYou.length ? <p className="ay-lib-foryou-why">Based on what you told us: {said.map((x) => x.toLowerCase()).join(', ')}.</p> : null;
      })()}{forYou.length > 3 && <p className="ay-lib-more-row"><button type="button" className="ay-lib-more" onClick={() => setTopic('foryou')}>All {forYou.length} for you</button>{ARTICLES.length > forYou.length && <small>The other {ARTICLES.length - forYou.length} cover topics you didn&apos;t pick. They&apos;re in the sections below.</small>}</p>}</> : <a className="ay-lib-personalize" href="/quiz">See my matches <span aria-hidden="true">→</span></a>}
      {rows.map((r) => shelf(r.id, r.label, r.items))}
    </>;
  }

  return (
    <section className="container animate-fade-in-up ay-web-library is-wiki">
      {missingRead && (
        <div className="ay-lib-404" role="alert">
          <p className="ay-lib-404__code">404</p>
          <h2>We couldn’t find that read.</h2>
          <p>It may have moved, or the link may be wrong.</p>
          <a href="/library" className="ay-lib-404__btn" onClick={(e) => { e.preventDefault(); onArticleChange?.(null); }}>See all reads</a>
        </div>
      )}
      <header className="ay-wiki-top">
        <div className="ay-wiki-top__text">
          <p className="ay3-kicker">The ayna library</p>
          <h1 className="ay3-title">Short reads, <em>real sources.</em></h1>
          <p className="ay-wiki-top__sub">Plain-language reads on women&apos;s health, each one checked against clinical sources.</p>
        </div>
      </header>
      <div className={`ay-wiki-bar${barSmall ? ' is-small' : ''}`}>
        <label className="ay-web-lib-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <SmartSearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try: heavy periods or PCOS" aria-label="Search reads" />
        </label>
        {<div className="ay-web-lib-filter ay-lib-chips" role="group" aria-label="Topics">
          {topics.map(([id, label]) => <button type="button" key={id} className={topic === id ? 'is-on' : ''} aria-pressed={topic === id} onClick={() => setTopic(id)}>{label}</button>)}
        </div>}
      </div>
      {q.length >= 2 && <SearchAssist query={query} resultCount={searchArticles(query, ARTICLES).length} onUse={setQuery} />}
      <div className="ay3-libgrid">
        <aside className="ay3-libside" aria-label="Library index">
          <nav className="ay3-libside__box">
            <p className="ay3-libside__title">A to Z</p>
            <ul className="ay3-az">
              {[...(shown || ARTICLES.filter(inTopic))].sort((a, b) => a.title.localeCompare(b.title)).map((a, i, arr) => {
                const letter = a.title[0].toUpperCase();
                const first = i === 0 || arr[i - 1].title[0].toUpperCase() !== letter;
                return (
                  <li key={a.id} data-letter={first ? letter : undefined}>
                    <button type="button" onClick={() => open(a.id)}>{a.title}</button>
                    {progressOf(a) >= 1 && <span className="ay3-az__done" aria-label="Finished">✓</span>}
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
        <div className="ay3-libmain">
      {body}
        </div>
      </div>
      <SuggestBox mode="read" context="library" className="ay-web-lib-suggest" />
    </section>
  );
}
