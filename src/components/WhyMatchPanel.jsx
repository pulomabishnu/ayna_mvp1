import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { getProductMatchDetailsForProduct } from '../data/products.js';
import WhyFit from './match/WhyFit.jsx';
import { whyFitTitle, WHY_FIT_FINE } from './match/whyFitText.js';
import '../styles/match-ui.css';

// "See why" side panel on the website (Nov 5 redesign: src/components/match/WhyFit.jsx).
export default function WhyMatchPanel({ product, quizResults, healthProfile = null, matchOpts, onClose, onUpdateHealth }) {
  const title = whyFitTitle(getProductMatchDetailsForProduct(product, quizResults, healthProfile, matchOpts));
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(<div className="ay-why-backdrop" onClick={onClose}>
    <aside className="ay-why ay-w2" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
      <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Close">×</button></header>
      <WhyFit product={product} quizResults={quizResults} healthProfile={healthProfile} matchOpts={matchOpts} onUpdateHealth={onUpdateHealth} />
      <p className="ay-w2-fine">{WHY_FIT_FINE} <a href="/how-it-works">How we match</a></p>
    </aside>
  </div>, document.body);
}
