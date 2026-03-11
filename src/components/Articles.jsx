import React, { useState } from 'react';
import Disclaimer from './Disclaimer';

const ARTICLES = [
  {
    id: 'intimate-wash',
    title: 'Intimate Washes: What Clinicians Say',
    source: 'UpToDate, ACOG',
    tags: ['Gynecology', 'Vulvovaginal health'],
    teaser: 'Why the vagina is self-cleaning, when to use (or skip) cleansers, and what OB-GYNs recommend for external care.',
    body: (
      <>
        <p>The vagina is self-cleaning and maintains its own pH and bacterial balance. Douching is not recommended by major medical organizations and can increase the risk of bacterial vaginosis, yeast infection, and pelvic inflammatory disease. For the vulva (the external skin), warm water alone is often sufficient for daily hygiene.</p>
        <p>If you choose to use a cleanser—for example after exercise or for personal preference—clinicians advise selecting one that is fragrance-free, pH-balanced (around 3.5–4.5 for the vulvar area), and labeled for external use only. Avoid anything that goes inside the vagina, as well as scented soaps, body washes with strong surfactants, and vaginal deodorants or sprays.</p>
        <p><strong>Key guidelines (from UpToDate and ACOG):</strong></p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
          <li>Avoid douching, scented soaps, and vaginal deodorants.</li>
          <li>Cleanse the vulva gently with warm water or an unfragranced, mild soap substitute.</li>
          <li>If you have recurrent irritation or infection, discuss your routine with a clinician; sometimes less is more.</li>
        </ul>
        <p><strong>Reputable sources:</strong></p>
        <ul style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.acog.org/womens-health/faqs/vulvovaginal-health" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ACOG – Vulvovaginal Health</a></li>
          <li><a href="https://www.uptodate.com/contents/bacterial-vaginosis-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Bacterial vaginosis (patient education)</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'heavy-bleeding',
    title: 'Heavy Menstrual Bleeding: When to See a Clinician',
    source: 'UpToDate, ACOG, CDC',
    tags: ['Menstrual health', 'Clinical guidance'],
    teaser: 'What counts as heavy bleeding, possible causes, when to seek care, and how it’s evaluated and treated.',
    body: (
      <>
        <p>Heavy menstrual bleeding (menorrhagia) is common and can significantly affect quality of life, work, and relationships. It may also signal underlying conditions such as fibroids, polyps, bleeding disorders, hormonal imbalances, or thyroid issues. How it’s treated depends on the cause, your age, and whether you plan to have children.</p>
        <p>There’s no single definition of “heavy,” but clinicians often use practical signs: needing to change pads or tampons every 1–2 hours, passing large clots, bleeding longer than 7 days, or having symptoms of anemia (fatigue, dizziness, pale skin, shortness of breath). If any of these describe you, or if your period has changed suddenly, it’s worth seeing a clinician. They can run tests (e.g., blood count, thyroid, imaging) and recommend options ranging from hormonal birth control or tranexamic acid to procedures like an IUD or surgery, depending on the cause.</p>
        <p><strong>When to seek care:</strong> Soaking through pads or tampons every 1–2 hours, bleeding longer than 7 days, or symptoms of anemia. Only a clinician can diagnose the cause and recommend a safe, effective treatment plan.</p>
        <p><strong>Reputable sources:</strong></p>
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
    title: 'Menopause & Perimenopause: Evidence-Based Overview',
    source: 'North American Menopause Society, UpToDate',
    tags: ['Menopause', 'Hormone therapy'],
    teaser: 'What perimenopause and menopause are, common symptoms, and how hormone therapy and lifestyle changes can help.',
    body: (
      <>
        <p>Perimenopause is the transition period before menopause, often lasting several years, when hormone levels fluctuate and periods may become irregular. Menopause is defined as 12 consecutive months without a period and marks the end of ovarian function. Symptoms during this time can include hot flashes, night sweats, sleep problems, mood changes, vaginal dryness, and changes in skin or hair. Severity and duration vary widely.</p>
        <p>Management options include lifestyle changes (e.g., cooling strategies, sleep hygiene, exercise) and, when appropriate, hormone therapy (HT). HT can be very effective for vasomotor symptoms and vaginal dryness. Benefits and risks depend on your age, health history, and how soon after menopause you start; for many healthy people under 60 or within 10 years of menopause, benefits often outweigh risks when used at the lowest effective dose. Decisions should be made with a clinician who can review your personal and family history.</p>
        <p><strong>Reputable sources:</strong></p>
        <ul style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.menopause.org/for-women/menopause-faqs-women-s-midlife-health" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>NAMS – Menopause FAQs</a></li>
          <li><a href="https://www.uptodate.com/contents/menopausal-hormone-therapy-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – Menopausal hormone therapy (patient education)</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'uti-prevention',
    title: 'UTI Prevention: What the Evidence Shows',
    source: 'UpToDate, NIH',
    tags: ['Urinary health', 'Prevention'],
    teaser: 'Evidence-backed ways to reduce UTI risk and when to see a clinician for recurrent infections.',
    body: (
      <>
        <p>Recurrent urinary tract infections (UTIs) are common, especially in women. Evidence-supported prevention strategies include drinking adequate fluids, urinating after intercourse, and—when recommended by a clinician—prophylactic low-dose antibiotics or topical estrogen for postmenopausal people (to support vaginal and urethral tissue). Cranberry products are sometimes used; evidence on effectiveness is mixed, and they are not a substitute for medical evaluation if you have frequent UTIs.</p>
        <p>If you have recurrent UTIs (e.g., several per year), it’s important to see a clinician. They can rule out structural or other causes and tailor a prevention or treatment plan, which might include behavioral changes, short-course antibiotics, or post-coital prophylaxis. Self-treating repeatedly without evaluation can mask other conditions or lead to resistance.</p>
        <p><strong>Reputable sources:</strong></p>
        <ul style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
          <li><a href="https://www.uptodate.com/contents/urinary-tract-infections-in-adults-beyond-the-basics" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>UpToDate – UTIs in adults (patient education)</a></li>
          <li><a href="https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-infection-uti-in-adults" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>NIDDK – Bladder infection (UTI) in adults</a></li>
        </ul>
      </>
    ),
  },
];

export default function Articles() {
  const [selectedId, setSelectedId] = useState(null);
  const selected = ARTICLES.find((a) => a.id === selectedId);

  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Health Articles Library</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
          We use ACOG (including <a href="https://www.acog.org/wellwomanchart" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>well-woman care at every life stage</a>) and UpToDate when available as our baseline; articles also draw on CDC, NAMS, and similar clinician resources. Click a headline to read the full article. Always discuss your care with your own clinician.
        </p>
        <Disclaimer compact showSources style={{ marginTop: '1.5rem', textAlign: 'left', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }} />
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
          <div style={{ lineHeight: '1.85', fontSize: '1.05rem', color: 'var(--color-text-main)' }}>
            {selected.body}
          </div>
          <Disclaimer compact style={{ marginTop: '1.5rem' }} />
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
