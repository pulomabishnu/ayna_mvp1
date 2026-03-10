import React from 'react';
import Disclaimer from './Disclaimer';

const ARTICLES = [
  {
    id: 'intimate-wash',
    title: 'Intimate Washes: What Clinicians Say',
    source: 'UpToDate, ACOG',
    tags: ['Gynecology', 'Vulvovaginal health'],
    body: (
      <>
        <p>The vagina is self-cleaning; douching is not recommended and can increase risk of bacterial vaginosis and yeast infection. For the vulva (external skin), warm water alone is often sufficient. If you use a cleanser, choose one that is fragrance-free and pH-balanced for external use only.</p>
        <p><strong>Key guidelines (from UpToDate and ACOG):</strong></p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
          <li>Avoid douching, scented soaps, and vaginal deodorants.</li>
          <li>Cleanse the vulva gently with warm water or an unfragranced, mild soap substitute.</li>
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
    source: 'UpToDate, CDC',
    tags: ['Menstrual health', 'Clinical guidance'],
    body: (
      <>
        <p>Heavy menstrual bleeding (menorrhagia) can affect quality of life and may signal conditions such as fibroids, bleeding disorders, or hormonal issues. Treatment depends on cause, age, and family plans.</p>
        <p><strong>When to seek care:</strong> Soaking through pads/tampons every 1–2 hours, bleeding longer than 7 days, or symptoms of anemia (fatigue, dizziness). Only a clinician can diagnose and recommend treatment.</p>
        <p><strong>Reputable sources:</strong></p>
        <ul style={{ paddingLeft: '1.5rem', listStyle: 'none' }}>
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
    body: (
      <>
        <p>Perimenopause is the transition before menopause; menopause is defined as 12 months without a period. Symptoms can include hot flashes, sleep changes, mood changes, and vaginal dryness. Management options include lifestyle changes and, when appropriate, hormone therapy (HT). HT benefits and risks depend on age, health, and symptoms—decisions should be made with a clinician.</p>
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
    body: (
      <>
        <p>Recurrent urinary tract infections (UTIs) are common. Evidence-supported strategies include adequate fluid intake, urinating after intercourse, and in some cases prophylactic antibiotics or topical estrogen (for postmenopausal people). Cranberry products are sometimes used; evidence is mixed. Always consult a clinician for recurrent UTIs—they can rule out other causes and recommend a safe plan.</p>
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
  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Health Articles Library</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
          Evidence-based women’s health information from UpToDate, ACOG, CDC, NAMS, and similar clinician resources. Always discuss your care with your own clinician.
        </p>
        <Disclaimer compact style={{ marginTop: '1.5rem', textAlign: 'left', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }} />
      </div>

      {ARTICLES.map((art) => (
        <article
          key={art.id}
          style={{
            background: 'var(--color-surface-soft)',
            padding: '2.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '2rem'
          }}
        >
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>{art.title}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '0.2rem 0.6rem', background: 'var(--color-secondary-fade)', color: 'var(--color-primary)', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
              Sources: {art.source}
            </span>
            {art.tags.map((t) => (
              <span key={t} style={{ padding: '0.2rem 0.6rem', background: 'var(--color-surface-soft)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: '1rem', fontSize: '0.8rem' }}>
                {t}
              </span>
            ))}
          </div>
          <div style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--color-text-main)' }}>
            {art.body}
          </div>
          <Disclaimer compact style={{ marginTop: '1.5rem' }} />
        </article>
      ))}
    </section>
  );
}
