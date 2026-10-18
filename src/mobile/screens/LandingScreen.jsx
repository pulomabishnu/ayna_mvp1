import SlideToStart from '../components/SlideToStart.jsx';
import { PARTNER_BRANDS } from '../../utils/partnerBrands';
import '../landing.css';

// Same photographs, stamp and brand ticker as the website hero (the brand
// blueprint), laid out for a phone: photos up top, the ask at thumb height.
const HERO = [
  { src: '/landing/tub-girls.webp', pos: '50% 35%' },
  { src: '/landing/robe-kiss.webp', pos: '50% 30%' },
  { src: '/landing/bed-selfie.webp', pos: '50% 40%' },
];

export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna }) {
  const names = PARTNER_BRANDS.map((b) => b.name);
  return <main className="ay-land">
    <section className="ay-land-hero" aria-labelledby="ay-land-title">
      <div className="ay-land-photos" aria-hidden="true">
        {HERO.map((p, i) => <img key={p.src} src={p.src} alt="" style={{ objectPosition: p.pos }} {...(i === 0 ? { fetchPriority: 'high' } : {})} />)}
      </div>
      <header className="ay-land-top">
        <span className="ay-land-mark">ayna</span>
        <button type="button" onClick={onAlreadyHaveAccount}>Sign in</button>
      </header>
      <div className="ay-land-stamp" aria-hidden="true">
        <svg viewBox="0 0 200 200"><defs><path id="ay-land-stamp-path" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" /></defs>
          <text><textPath href="#ay-land-stamp-path" textLength="455" lengthAdjust="spacing">MATCHED TO YOU {'★'} MATCHED TO YOU {'★'}</textPath></text></svg>
        <span>you</span>
      </div>
      <div className="ay-land-copy">
        <h1 id="ay-land-title">Build your <em>ecosystem.</em></h1>
        <p>Health products matched to your body.</p>
      </div>
    </section>
    <div className="ay-land-ticker" aria-hidden="true">
      <div className="ay-land-ticker-track">
        {[0, 1].map((k) => <ul key={k}>{names.map((n) => <li key={n}>{n}<span>{'★'}</span></li>)}</ul>)}
      </div>
    </div>
    <section className="ay-land-actions" aria-label="Get started">
      <SlideToStart onComplete={onStartQuiz} />
      <div className="ay-land-links"><button type="button" onClick={onBrowse}>Just browsing</button><button type="button" onClick={onAboutAyna}>About us</button></div>
    </section>
  </main>;
}
