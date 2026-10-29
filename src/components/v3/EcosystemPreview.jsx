import React, { useMemo } from 'react';
import ProductTileImage, { ProductImageFallback, resolveCatalogProductImage } from '../ProductTileImage';
import '../../styles/you-hub.css';

/* Your ecosystem for someone who is not signed in: the page itself, so she can
   see what it is before being asked for anything. The shelves are real Shop
   products, labelled as an example (not blurred: the checklist bans ghost
   data and blur), beside one clear way in. */
const SAMPLE_SHELVES = [
  { key: 'period', label: 'Period', cats: ['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'period-care'] },
  { key: 'intimate', label: 'Intimate care', cats: ['intimate-care'] },
  { key: 'pain', label: 'Pain and recovery', cats: ['cramp-relief'] },
];

function pick(products, cats, n) {
  const out = [];
  for (const p of products) {
    if (cats.includes(String(p.category || '')) && resolveCatalogProductImage(p)) out.push(p);
    if (out.length >= n) break;
  }
  return out;
}

export default function EcosystemPreview({ products = [], onBuild, onSignIn, matches = [], onSave, onOpenProduct, onBrowse }) {
  const shelves = useMemo(() => {
    const used = new Set();
    return SAMPLE_SHELVES.map((s) => {
      const items = pick(products.filter((p) => !used.has(p.id)), s.cats, 5);
      items.forEach((p) => used.add(p.id));
      return { ...s, items };
    }).filter((s) => s.items.length > 0);
  }, [products]);

  // Just finished the quiz without an account: show her matches, never a lock.
  if (matches.length) {
    return (
      <section className="ay-ecoprev is-mine" aria-labelledby="ay-ecoprev-title">
        <header className="ay-ecoprev__head">
          <h1 id="ay-ecoprev-title" className="ay-ecoprev__title">Your products</h1>
          <p className="ay-ecoprev__lede">{matches.length} picks from your answers. Tap one to see why it fits.</p>
        </header>
        <div className="ay-ecoprev__save" role="note">
          <p>Save them with a free account so they’re here next time. Your answers stay on this device until you do.</p>
          <div>
            <button type="button" className="ay-ecoprev__primary" onClick={onSave}>Save my matches</button>
            {onBrowse && <button type="button" className="ay-ecoprev__secondary" onClick={onBrowse}>Browse products by best match</button>}
          </div>
        </div>
        <ul className="ay-ecoprev__mine">
          {matches.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onOpenProduct && onOpenProduct(p)}>
                <span className="ay-ecoprev__mineimg"><ProductTileImage product={p} alt="" letterNode={<ProductImageFallback product={p} />} /></span>
                <span className="ay-ecoprev__minename">{p.brand && !String(p.name || '').startsWith(p.brand) ? <small>{p.brand}</small> : null}{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="ay-ecoprev" aria-labelledby="ay-ecoprev-title">
      <header className="ay-ecoprev__head">
        <h1 id="ay-ecoprev-title" className="ay-ecoprev__title">Build your health ecosystem</h1>
        <p className="ay-ecoprev__lede">Keep your concerns, matches, saved products and health insights connected in one place.</p>
      </header>

      <ol className="ay-ecoprev__steps">
        <li><b>Tell us about you.</b> A short quiz about your needs, your non-negotiables and your budget.</li>
        <li><b>See your shelves.</b> Your matches, grouped by need, each with a match % and the reason why.</li>
        <li><b>Fill the gaps.</b> Needs with nothing on them yet get their best picks.</li>
      </ol>

      <div className="ay-ecoprev__stage is-honest">
        <div className="ay-ecoprev__shelves">
          <p className="ay-ecoprev__note">An example from the Shop, not your matches.</p>
          {shelves.map((s) => (
            <div key={s.key} className="ay-ecoprev__shelf">
              <p className="ay-ecoprev__shelfname">{s.label}</p>
              <ul className="ay-ecoprev__row">
                {s.items.map((p) => (
                  <li key={p.id} className="ay-ecoprev__tile">
                    <ProductTileImage product={p} alt="" letterNode={<ProductImageFallback />} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="ay-ecoprev__lock" role="group" aria-label="Take the quiz to see your ecosystem">
          <span className="ay-ecoprev__lockicon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          </span>
          <h2 className="ay-ecoprev__locktitle">Your shelves are waiting</h2>
          <p className="ay-ecoprev__locktext">Build your ecosystem to fill these with products picked for you.</p>
          <button type="button" className="ay-ecoprev__primary" onClick={onBuild}>Build mine</button>
          <button type="button" className="ay-ecoprev__secondary" onClick={onSignIn}>I already have one. Sign in</button>
        </div>
      </div>
    </section>
  );
}
