import { getProductMatchDetailsForProduct } from '../../data/products.js';
import LegalFooter from '../components/LegalFooter.jsx';
import WhyFit from '../../components/match/WhyFit.jsx';
import { whyFitTitle, WHY_FIT_FINE } from '../../components/match/whyFitText.js';
import '../match.css';
import '../eco-needs.css';
import '../../styles/match-ui.css';

// "See why" in the app: the same body as the website panel (Nov 5 redesign,
// founder: short bullets, graphic, no over-explaining, deeper factors on Pro).
export default function WhyMatchScreen({ product, quizAnswers, matchOpts, onBack, onUpdateHealth, onFixSafety = null }) {
  const details = getProductMatchDetailsForProduct(product, quizAnswers, null, matchOpts);
  const title = whyFitTitle(details);
  return (
    <main className="ayna-match-page ay-w2-page">
      <header className="ayna-detail-header ay-match-head">
        <button type="button" aria-label="Back to product" onClick={onBack}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
        </button>
        <h1>{title}</h1>
      </header>
      <div className="ayna-match-scroll ay-w2">
        <WhyFit product={product} quizResults={quizAnswers} matchOpts={matchOpts} onUpdateHealth={onUpdateHealth} onFixSafety={onFixSafety} />
        <p className="ay-w2-fine">{WHY_FIT_FINE} <a href="/how-it-works">How we match</a></p>
        <LegalFooter />
      </div>
    </main>
  );
}
