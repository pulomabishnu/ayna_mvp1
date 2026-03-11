import React, { useMemo, useState } from 'react';
import Disclaimer from './Disclaimer';
import { ALL_PRODUCTS } from '../data/products';
import { RELEASED_STARTUPS } from '../data/startups';

/** Article id → product-style tags/healthFunctions for matching relevant telehealth platforms */
const ARTICLE_FOCUS_TAGS = {
  'intimate-wash': ['vaginal-health', 'discomfort', 'intimate-care'],
  'heavy-bleeding': ['heavy-flow', 'cramps', 'discomfort'],
  'menopause-basics': ['menopause', 'discomfort'],
  'uti-prevention': ['uti'],
  'yeast-infection-basics': ['vaginal-health', 'discomfort'],
  'period-pain-when-to-seek-care': ['cramps', 'discomfort', 'heavy-flow'],
};

function getProductUrl(p) {
  const raw = p.whereToBuy && p.whereToBuy[0];
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return 'https://' + s.replace(/^www\./i, '');
}

/** Telehealth platforms that match this article's focus (tags or healthFunctions). Returns full product/startup objects for opening in product card. Deduped by name. */
function getRelevantTelehealth(articleId) {
  const focus = ARTICLE_FOCUS_TAGS[articleId] || [];
  const fromProducts = (ALL_PRODUCTS || [])
    .filter((p) => p.category === 'telehealth')
    .filter((p) => {
      if (focus.length === 0) return true;
      const tags = new Set([...(p.tags || []), ...(p.healthFunctions || [])]);
      return focus.some((t) => tags.has(t));
    });
  const fromStartups = (RELEASED_STARTUPS || [])
    .filter((s) => s.category === 'telehealth')
    .filter((s) => {
      if (focus.length === 0) return true;
      const tags = new Set([...(s.tags || []), ...(s.healthFunctions || [])]);
      return focus.some((t) => tags.has(t));
    });
  // Dedupe by name so the same platform (e.g. Tia in products + startups) appears once; prefer product entry.
  const byName = new Map();
  [...fromProducts, ...fromStartups].forEach((item) => {
    const key = (item.name || '').trim().toLowerCase();
    if (!key || byName.has(key)) return;
    byName.set(key, item);
  });
  return Array.from(byName.values());
}

const dropdownSummaryStyle = {
  padding: '0.5rem 0',
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--color-text-main)',
  cursor: 'pointer',
  listStyle: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
};
const dropdownDetailStyle = {
  paddingLeft: '0.5rem',
  paddingBottom: '0.75rem',
  fontSize: '0.95rem',
  color: 'var(--color-text-main)',
  lineHeight: 1.6,
};

function TelehealthSuggestions({ articleId, onOpenProduct }) {
  const platforms = useMemo(() => getRelevantTelehealth(articleId), [articleId]);

  return (
    <div
      style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--color-text-main)', fontWeight: '600' }}>
        Can&apos;t reach your doctor?
      </h3>

      <details style={{ marginBottom: '0.25rem' }}>
        <summary style={dropdownSummaryStyle}>
          Nurse line (insurer)
        </summary>
        <div style={dropdownDetailStyle}>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            Many plans offer a 24/7 nurse line for symptom guidance and when to seek care. Check your insurance card or member portal for the number.
          </p>
        </div>
      </details>

      <details style={{ marginBottom: '0.25rem' }}>
        <summary style={dropdownSummaryStyle}>
          Planned Parenthood (in-person & telehealth)
        </summary>
        <div style={dropdownDetailStyle}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            In-person health centers and telehealth for reproductive and sexual health; sliding-scale and low-cost options.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '0.35rem' }}>
              <a href="https://www.plannedparenthood.org/health-center" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Find a health center (in-person)</a>
            </li>
            <li>
              <a href="https://www.plannedparenthood.org/get-care" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Get care (telehealth & in-person)</a>
            </li>
          </ul>
        </div>
      </details>

      <details style={{ marginBottom: '0.25rem' }}>
        <summary style={dropdownSummaryStyle}>
          Find clinics near you (by zip)
        </summary>
        <div style={dropdownDetailStyle}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            Search for low-cost and sliding-scale health centers by zip code.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '0.35rem' }}>
              <a href="https://www.plannedparenthood.org/health-center" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Planned Parenthood — enter zip to find locations</a>
            </li>
            <li>
              <a href="https://findahealthcenter.hrsa.gov/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>HRSA — Federally qualified health centers by zip</a>
            </li>
          </ul>
        </div>
      </details>

      <details style={{ marginBottom: '0.25rem' }}>
        <summary style={dropdownSummaryStyle}>
          Telehealth / digital
        </summary>
        <div style={dropdownDetailStyle}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            Relevant telehealth options for this topic. {onOpenProduct ? 'Click a name to open the product card.' : ''}
          </p>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <a href="https://www.plannedparenthood.org/get-care" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Planned Parenthood — get care (telehealth & in-person)</a>
          </p>
          {platforms.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>No other telehealth platforms match this topic. See &quot;Find clinics near you&quot; above for more options.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {platforms.map((t) => {
                const displayPrice = t.price || t.stage;
                const displaySummary = t.summary || t.description || t.tagline;
                return (
                  <li key={t.id} style={{ marginBottom: '0.6rem' }}>
                    {onOpenProduct ? (
                      <button
                        type="button"
                        onClick={() => onOpenProduct(t)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: 'var(--color-primary)',
                          fontWeight: 600,
                          fontSize: 'inherit',
                          textAlign: 'left',
                          textDecoration: 'underline',
                        }}
                      >
                        {t.name}
                      </button>
                    ) : (
                      <strong>{t.name}</strong>
                    )}
                    {displayPrice && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}> — {displayPrice}</span>}
                    {displaySummary && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', display: 'block', marginTop: '0.15rem' }}>{displaySummary}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </details>
    </div>
  );
}

const ARTICLES = [
  {
    id: 'intimate-wash',
    title: 'Intimate Washes',
    source: 'UpToDate, ACOG, CDC',
    tags: ['Gynecology', 'Vulvovaginal health'],
    teaser: 'Why the vagina is self-cleaning, when to use (or skip) cleansers, and what OB-GYNs recommend for external care.',
    body: (
      <>
        <p>The vagina is self-cleaning and maintains its own pH and bacterial balance. Douching is not recommended by major medical organizations and can increase the risk of bacterial vaginosis, yeast infection, and pelvic inflammatory disease. For the vulva (the external skin), warm water alone is often sufficient for daily hygiene.</p>
        <p>If you choose to use a cleanser—for example after exercise or for personal preference—clinicians advise selecting one that is fragrance-free, pH-balanced (around 3.5–4.5 for the vulvar area), and labeled for external use only. Avoid anything that goes inside the vagina, as well as scented soaps, body washes with strong surfactants, and vaginal deodorants or sprays.</p>
        <p><strong>Key guidelines (from UpToDate, ACOG, and CDC):</strong></p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
          <li>Avoid douching, scented soaps, and vaginal deodorants.</li>
          <li>Cleanse the vulva gently with warm water or an unfragranced, mild soap substitute.</li>
          <li>If you have recurrent irritation or infection, discuss your routine with a clinician; sometimes less is more.</li>
        </ul>
        <p><strong>Sources:</strong></p>
        <ul style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/vulvovaginal-health" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Vulvovaginal Health</a></li>
          <li><a href="https://www.uptodate.com/contents/bacterial-vaginosis-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Bacterial vaginosis (patient education)</a></li>
          <li><a href="https://www.cdc.gov/std/bv/default.htm" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>CDC – Bacterial vaginosis</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'heavy-bleeding',
    title: 'Heavy Menstrual Bleeding',
    source: 'UpToDate, ACOG, CDC',
    tags: ['Menstrual health', 'Clinical guidance'],
    teaser: 'What counts as heavy bleeding, possible causes, when to seek care, and how it’s evaluated and treated.',
    body: (
      <>
        <p>Heavy menstrual bleeding (menorrhagia) is common and can significantly affect quality of life, work, and relationships. It may also signal underlying conditions such as fibroids, polyps, bleeding disorders, hormonal imbalances, or thyroid issues. How it’s treated depends on the cause, your age, and whether you plan to have children.</p>
        <p>There’s no single definition of “heavy,” but clinicians often use practical signs: needing to change pads or tampons every 1–2 hours, passing large clots, bleeding longer than 7 days, or having symptoms of anemia (fatigue, dizziness, pale skin, shortness of breath). If any of these describe you, or if your period has changed suddenly, it’s worth seeing a clinician. They can run tests (e.g., blood count, thyroid, imaging) and recommend options ranging from hormonal birth control or tranexamic acid to procedures like an IUD or surgery, depending on the cause.</p>
        <p><strong>When to seek care:</strong> Soaking through pads or tampons every 1–2 hours, bleeding longer than 7 days, or symptoms of anemia. Only a clinician can diagnose the cause and recommend a safe, effective treatment plan.</p>
        <p><strong>Sources:</strong></p>
        <ul style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/heavy-menstrual-bleeding" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Heavy Menstrual Bleeding</a></li>
          <li><a href="https://www.uptodate.com/contents/abnormal-uterine-bleeding-in-adults-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Abnormal uterine bleeding (patient education)</a></li>
          <li><a href="https://www.cdc.gov/ncbddd/blooddisorders/women/menorrhagia.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>CDC – Heavy menstrual bleeding</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'menopause-basics',
    title: 'Menopause & Perimenopause',
    source: 'NAMS, UpToDate, ACOG',
    tags: ['Menopause', 'Hormone therapy'],
    teaser: 'What perimenopause and menopause are, common symptoms, and how hormone therapy and lifestyle changes can help.',
    body: (
      <>
        <p>Perimenopause is the transition period before menopause, often lasting several years, when hormone levels fluctuate and periods may become irregular. Menopause is defined as 12 consecutive months without a period and marks the end of ovarian function. Symptoms during this time can include hot flashes, night sweats, sleep problems, mood changes, vaginal dryness, and changes in skin or hair. Severity and duration vary widely.</p>
        <p>Management options include lifestyle changes (e.g., cooling strategies, sleep hygiene, exercise) and, when appropriate, hormone therapy (HT). HT can be very effective for vasomotor symptoms and vaginal dryness. Benefits and risks depend on your age, health history, and how soon after menopause you start; for many healthy people under 60 or within 10 years of menopause, benefits often outweigh risks when used at the lowest effective dose. Decisions should be made with a clinician who can review your personal and family history.</p>
        <p><strong>Sources:</strong></p>
        <ul style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.menopause.org/for-women/menopause-faqs-women-s-midlife-health" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>NAMS – Menopause FAQs</a></li>
          <li><a href="https://www.uptodate.com/contents/menopausal-hormone-therapy-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Menopausal hormone therapy (patient education)</a></li>
          <li><a href="https://www.acog.org/womens-health/faqs/the-menopause-years" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – The menopause years</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'uti-prevention',
    title: 'UTI Prevention',
    source: 'UpToDate, NIH',
    tags: ['Urinary health', 'Prevention'],
    teaser: 'Evidence-backed ways to reduce UTI risk and when to see a clinician for recurrent infections.',
    body: (
      <>
        <p>Recurrent urinary tract infections (UTIs) are common, especially in women. Evidence-supported prevention strategies include drinking adequate fluids, urinating after intercourse, and—when recommended by a clinician—prophylactic low-dose antibiotics or topical estrogen for postmenopausal people (to support vaginal and urethral tissue). Cranberry products are sometimes used; evidence on effectiveness is mixed, and they are not a substitute for medical evaluation if you have frequent UTIs.</p>
        <p>If you have recurrent UTIs (e.g., several per year), it’s important to see a clinician. They can rule out structural or other causes and tailor a prevention or treatment plan, which might include behavioral changes, short-course antibiotics, or post-coital prophylaxis. Self-treating repeatedly without evaluation can mask other conditions or lead to resistance.</p>
        <p><strong>Sources:</strong></p>
        <ul style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.uptodate.com/contents/urinary-tract-infections-in-adults-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – UTIs in adults (patient education)</a></li>
          <li><a href="https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-infection-uti-in-adults" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>NIDDK/NIH – Bladder infection (UTI) in adults</a></li>
          <li><a href="https://www.cdc.gov/antibiotic-use/uti.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>CDC – Urinary tract infection</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'yeast-infection-basics',
    title: 'Yeast Infection Basics',
    source: 'UpToDate, CDC, ACOG',
    tags: ['Vulvovaginal health', 'Infections'],
    teaser: 'What causes yeast infections, how to recognize them, when to treat at home vs. see a clinician, and how to prevent recurrence.',
    body: (
      <>
        <p>Vulvovaginal candidiasis (yeast infection) is common and is usually caused by the fungus <em>Candida albicans</em>. Symptoms often include itching, burning, redness, and a thick white discharge. Many people can recognize recurring yeast infections and use an over-the-counter antifungal (e.g., clotrimazole, miconazole) with success, but it’s important not to self-diagnose if you’re unsure—other conditions (like bacterial vaginosis or sexually transmitted infections) can look similar and need different treatment.</p>
        <p>See a clinician if this is your first time with these symptoms, if OTC treatment hasn’t helped after a few days, if you have severe symptoms, or if infections keep coming back. Recurrent yeast infections may need a longer course of treatment or maintenance therapy. Avoiding unnecessary antibiotics, wearing breathable underwear, and limiting douches and scented products can help reduce the risk of recurrence.</p>
        <p><strong>Sources:</strong></p>
        <ul style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.uptodate.com/contents/candidiasis-vulvovaginal-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Vulvovaginal candidiasis (patient education)</a></li>
          <li><a href="https://www.cdc.gov/fungal/diseases/candidiasis/genital/index.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>CDC – Genital / vulvovaginal candidiasis</a></li>
          <li><a href="https://www.acog.org/womens-health/faqs/vulvovaginal-health" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Vulvovaginal health</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'period-pain-when-to-seek-care',
    title: 'Period Pain: When to Seek Care',
    source: 'ACOG, UpToDate',
    tags: ['Menstrual health', 'Pain'],
    teaser: 'Normal cramps vs. signs that something else may be going on, and what treatments and workups clinicians may suggest.',
    body: (
      <>
        <p>Mild to moderate menstrual cramps are common and often improve with over-the-counter pain relievers (e.g., ibuprofen, naproxen), heat, and exercise. For some people, period pain is severe enough to affect daily life—this is sometimes called dysmenorrhea and can be primary (no underlying condition) or secondary (due to conditions such as endometriosis, fibroids, or adenomyosis).</p>
        <p>It’s worth seeing a clinician if your cramps are severe, suddenly worse than usual, or don’t respond to OTC options; if you have heavy bleeding, pain between periods, or pain with sex; or if you’re missing school or work regularly because of period symptoms. A clinician can help rule out other causes and suggest treatments such as hormonal birth control, prescription pain relievers, or further evaluation (e.g., ultrasound) if needed.</p>
        <p><strong>Sources:</strong></p>
        <ul style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Dysmenorrhea (painful periods)</a></li>
          <li><a href="https://www.uptodate.com/contents/dysmenorrhea-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Dysmenorrhea (patient education)</a></li>
        </ul>
      </>
    ),
  },
];

/** Quiz frustrations → tags used in ARTICLE_FOCUS_TAGS (align with products.js mapping). */
const FRUSTRATION_TO_TAG = {
  'Heavy flow': 'heavy-flow',
  'Painful cramps': 'cramps',
  'Irregular cycles': 'irregular',
  'Recurrent UTIs': 'uti',
  'Menopause symptoms': 'menopause',
  'General discomfort': 'discomfort',
  'Pelvic pain': 'pelvic-floor',
  'Endometriosis': 'endometriosis',
};

/** Return articles relevant to quiz answers (for recommendations page). */
export function getRecommendedArticles(quizAnswers) {
  if (!quizAnswers?.frustrations?.length) {
    return ARTICLES.slice(0, 3);
  }
  const userTags = new Set(
    (quizAnswers.frustrations || [])
      .map((f) => FRUSTRATION_TO_TAG[f])
      .filter(Boolean)
  );
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

export { ARTICLES };

export default function Articles({ initialArticleId, onOpenProduct }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = ARTICLES.find((a) => a.id === selectedId);

  React.useEffect(() => {
    if (initialArticleId && ARTICLES.some((a) => a.id === initialArticleId)) {
      setSelectedId(initialArticleId);
    }
  }, [initialArticleId]);

  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Health Articles Library</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
          Click a headline to read the full article. Always discuss your care with your own clinician.
        </p>
        <Disclaimer compact style={{ marginTop: '1.5rem', textAlign: 'left', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }} />
      </div>

      {selected ? (
        <article
          style={{
            background: 'var(--color-surface-soft)',
            padding: '2.5rem 2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '1.5rem',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            ← Back to articles
          </button>
          <h2 style={{ fontSize: '1.85rem', marginBottom: '0.75rem', color: 'var(--color-text-main)', lineHeight: 1.3 }}>{selected.title}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '0.25rem 0.65rem', background: 'var(--color-secondary-fade)', color: 'var(--color-primary)', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: '600' }}>
              Sources: {selected.source}
            </span>
            {selected.tags.map((t) => (
              <span key={t} style={{ padding: '0.25rem 0.65rem', background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: '1rem', fontSize: '0.8rem' }}>
                {t}
              </span>
            ))}
          </div>
          <div className="article-body" style={{ lineHeight: '1.85', fontSize: '1.05rem', color: 'var(--color-text-main)' }}>
            {selected.body}
          </div>
          <Disclaimer compact style={{ marginTop: '1.5rem' }} />

          <TelehealthSuggestions articleId={selected.id} onOpenProduct={onOpenProduct} />
        </article>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {ARTICLES.map((art) => (
            <li key={art.id}>
              <button
                type="button"
                onClick={() => setSelectedId(art.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'var(--color-surface-soft)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '0.75rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--color-text-main)', fontWeight: '600' }}>{art.title}</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>{art.teaser}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '600' }}>{art.source}</span>
                  {art.tags.map((t) => (
                    <span key={t} style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>· {t}</span>
                  ))}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
