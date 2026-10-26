import { PARTNER_BRANDS } from '../../utils/partnerBrands';
import { getProductById } from '../../data/products.js';
import { Band, Shout, Marquee, Plate } from '../../components/ui/ay';
import '../landing.css';
import '../loop-a-app.css';
import '../uq-app-landing.css';
import FinishQuizCard from '../../components/FinishQuizCard.jsx';
import '../../styles/onboarding.css';

// First run: Get my matches goes straight to question 1 and her first matches
// show with no account; an account is asked for only to save (landing audit
// v3, section 12: time to first value). Explore first stays one tap away.
//
// Uniqueness pass (Oct 26): three colour blocks, the same moves as the website.
// Espresso band: the one Shout and three real catalog products shown big on
// their plates (the lead one on a pink tile). Pink band: the partner marquee,
// the screen's one motion (still under reduced motion). Butter band: the one
// action. The feature reel moved out: products first, UI after the quiz.
const PICKS = [['Period', 'p-saalt-cup'], ['Pelvic care', 'p-elvie-trainer'], ['Sleep', 'p-magnumsolace-nighttime-magnesium-cream']];

function Pick({ need, id, lead = false }) {
  const p = getProductById(id);
  if (!p) return null;
  return <figure className={`ay-uql-pick${lead ? ' is-lead' : ''}`}>
    <Plate src={p.image || p.imageUrl} alt={lead ? '' : `${p.brand ? `${p.brand} ` : ''}${p.name}`} sticker={need} />
    {lead && <figcaption><span>{p.brand}</span>{p.name}</figcaption>}
  </figure>;
}

export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna, quizDraft = null, onResumeQuiz, onStartOverQuiz }) {
  const names = PARTNER_BRANDS.map((b) => b.name);
  const [lead, ...rest] = PICKS;
  return <main className="ay-land ay-uql">
    <Band tone="ink" className="ay-uql-hero" aria-labelledby="ay-land-title">
      <header className="ay-land-top">
        <span className="ay-land-mark">ayna</span>
        <button type="button" onClick={onAlreadyHaveAccount}>Sign in</button>
      </header>
      <Shout id="ay-land-title" className="ay-uql-shout">Find what fits <span>your body.</span></Shout>
      <p className="ay-uql-lead">Women’s health products matched to you, with the evidence beside each one.</p>
      <div className="ay-uql-picks">
        <Pick need={lead[0]} id={lead[1]} lead />
        <div className="ay-uql-pair">{rest.map(([need, id]) => <Pick key={id} need={need} id={id} />)}</div>
      </div>
    </Band>
    <section className="ay-uql-brands" aria-label="Partner brands">
      <Marquee items={names} tone="pink" />
    </section>
    <section className="ay-land-actions" aria-label="Start ayna">
      {quizDraft && onResumeQuiz
        ? <FinishQuizCard progress={quizDraft} onContinue={onResumeQuiz} onStartOver={onStartOverQuiz} className="ay-land-finish" />
        : <>
          <button type="button" className="ay-land-start" onClick={onStartQuiz}>Get my matches<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
          <p className="ay-land-start-note">A few short questions, then your Today.</p>
        </>}
      <div className="ay-land-links"><button type="button" onClick={onBrowse}>Explore first</button><button type="button" onClick={onAboutAyna}>About us</button></div>
    </section>
  </main>;
}
