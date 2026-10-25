import MatchPill from '../../components/MatchPill.jsx';
import { buyModel } from '../../components/pdp/buyModel.js';
import { leavingLine } from '../../utils/leavingAyna.js';
import { ADD_TO_ROUTINE, IN_ROUTINE } from '../../utils/routineCopy.js';
import { HEART_PATH } from '../utils/heart.js';
import { holdLine } from '../../utils/matchState.js';
import { trackApp } from '../utils/appAnalytics.js';

// Shared by the product sheet and the Rundown's product cards. No stylesheet
// here (the Rundown is shared with the website); the app's look is in
// src/mobile/ayna-home.css.

/** Her match in one row: the % with its why, a safety hold (never a %), or nothing without a profile. */
export function SheetMatch({ state }) {
  if (!state || state.kind === 'none') return null;
  if (state.kind === 'held') {
    return <div className="ay-psheet__hold" role="note"><b>{state.label}</b><span>{holdLine(state)}</span></div>;
  }
  return <div className="ay-psheet__match" data-tour="psheet-match"><MatchPill percent={state.percent} size="sm" />{state.why && <span>{state.why}</span>}</div>;
}

/** Buy (the existing buy link, with "You're leaving ayna"), Save, Add to my routine. One tap each. */
export function ProductQuickActions({ product, saved, onToggleSaved, inRoutine, onAddToRoutine, placement = 'product_sheet', compact = false, big = false, buy = null }) {
  // The sheet passes the product page's one buy model (pdp/buyModel): same link and "Buy at Amazon · $30" label everywhere.
  const model = buy || buyModel(product);
  const buyUrl = model?.url || null;
  const label = big && model?.label ? model.label : product?.category === 'telehealth' ? 'Book' : product?.type === 'digital' ? 'Get the app' : 'Buy';
  return (
    <div className={`ay-pquick${compact ? ' is-compact' : ''}`} data-tour="quick-actions">
      <div className={`ay-pquick__row${big ? ' ayv-actions' : ''}`}>
        {buyUrl && <a className={`ay-pquick__buy${big ? ' ayv-buy' : ''}`} href={buyUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackApp('product_buy_now_clicked', { productId: product?.id, category: product?.category, placement })}>{label}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens the seller’s site)</span></a>}
        {onToggleSaved && <button type="button" className={`ay-pquick__save${saved ? ' is-on' : ''}`} aria-pressed={saved} onClick={() => onToggleSaved(product)} aria-label={saved ? `Saved. Remove ${product?.name} from Saved` : `Save ${product?.name}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={HEART_PATH} /></svg>
          <span>{saved ? 'Saved' : 'Save'}</span>
        </button>}
        {onAddToRoutine && <button type="button" className={`ay-pquick__eco${inRoutine ? ' is-on' : ''}`} aria-pressed={inRoutine} onClick={() => onAddToRoutine(product)}>{inRoutine ? IN_ROUTINE : ADD_TO_ROUTINE}</button>}
      </div>
      {buyUrl && <p className={`ay-pquick__leave${big ? ' ayv-fine' : ''}`}>{big && model?.checked && `${model.checked}. `}{leavingLine(buyUrl, model?.retailer, big ? model?.verb || 'buy' : label === 'Book' ? 'book' : label === 'Get the app' ? 'get it' : 'buy')}</p>}
    </div>
  );
}

