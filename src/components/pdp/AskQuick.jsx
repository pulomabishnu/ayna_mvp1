import { productAskStarters } from '../../utils/productAsk.js';
import './askquick.css';

/**
 * Ask ayna, right in the buy panel (founder, Nov 11: "you can't see the Ask ayna buttons right away").
 * Three starter questions as small pills; each opens Ask with the question about this product.
 */
export default function AskQuick({ name, hasProfile = false, percent = null, onAsk, withName = true }) {
  if (!onAsk) return null;
  const qs = productAskStarters({ hasProfile, percent });
  return (
    <div className="ay-askquick" role="group" aria-label="Ask ayna about this product">
      <span className="ay-askquick__h"><span className="ay-askquick__orb" aria-hidden="true" />Ask ayna</span>
      <span className="ay-askquick__row">
        {qs.map((q) => <button key={q} type="button" onClick={() => onAsk(withName ? `About ${name}: ${q}` : q)}>{q}</button>)}
      </span>
    </div>
  );
}
