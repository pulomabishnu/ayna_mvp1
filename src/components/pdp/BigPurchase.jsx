import { parsePrice } from '../../matching/productProfile.js';
import { evidenceLevel } from './evidenceLevel.js';

/**
 * Focus group, Nov 9 (Olga: "for $400 or $500 I want to make sure it's worth it"):
 * on a one-time purchase of $150 or more, the things to weigh before buying, all from
 * what ayna already has on file (nothing invented): the evidence level, cheaper
 * options that fit her, and one tap to compare or ask.
 */
export const BIG_PURCHASE_AT = 150;

export function bigPurchasePrice(product) {
  const p = parsePrice(product?.price);
  if (!Number.isFinite(p.amount) || p.recurring || p.is_free) return null;
  return p.amount >= BIG_PURCHASE_AT ? p.amount : null;
}

export default function BigPurchase({ product, cheaper = [], pctFor, onOpenProduct, onCompare, onAsk }) {
  const amount = bigPurchasePrice(product);
  if (!amount) return null;
  let ev = null;
  try { ev = evidenceLevel(product); } catch { ev = null; }
  const evidence = ev?.word ? `${ev.word}${ev.need ? ` for ${ev.need}` : ''}.` : '';
  // Nothing on file to weigh: no box at all (never a claim there is no research).
  if (!evidence && !cheaper.length) return null;
  return (
    <section className="ay-bigbuy" aria-labelledby="ay-bigbuy-h">
      <h2 id="ay-bigbuy-h">Before you spend ${Math.round(amount).toLocaleString()}</h2>
      <ul className="ay-bigbuy__facts">
        {evidence && <li><b>The research</b><span>{evidence}</span></li>}
        {cheaper.length > 0 && <li><b>Cheaper options that fit you</b>
          <span className="ay-bigbuy__alts">{cheaper.map((p) => {
            const pct = pctFor?.(p);
            return <button key={p.id} type="button" onClick={() => onOpenProduct?.(p)}>{p.name}<small>{[p.price, pct != null ? `${pct}% match` : null].filter(Boolean).join(' · ')}</small></button>;
          })}</span>
        </li>}
      </ul>
      <div className="ay-bigbuy__acts">
        {onCompare && <button type="button" onClick={onCompare}>Compare</button>}
        {onAsk && <button type="button" onClick={onAsk}>Ask ayna if it’s worth it</button>}
      </div>
    </section>
  );
}
