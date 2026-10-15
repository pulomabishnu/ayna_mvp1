import React from 'react';
import { fmtDate } from './fmtDate';

/**
 * Product details: one closed drawer holding everything that is reference
 * rather than decision: what it is, who it's for (all of it), how to use,
 * ingredients once, materials, size and price facts, where to buy, and an
 * index of every source. Nothing here repeats the sections above it.
 */
const noDash = (t) => String(t || '').replace(/\s*—\s*/g, ', ').replace(/^,\s*/, '').trim();
const meaningful = (v) => { const t = String(v || '').trim(); return t && !/^(n\/?a|none|not applicable|unknown|various|varies)\.?$/i.test(t) ? t : ''; };
const flat = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export default function ProductDetails({ product, glance, extraRows = [], safety = null }) {
  if (!product || !glance) return null;
  const what = glance.what || {};
  const who = glance.who || { items: [], helps: [] };
  const how = product.howToUse?.steps?.length ? product.howToUse : null;
  const ingredients = noDash(meaningful(product.ingredients));
  const materialsRaw = noDash(meaningful(product.safety?.materials));
  const ingredientNames = (product.ingredientScience || []).map((i) => flat(i?.name)).filter(Boolean);
  const repeatsIngredients = ingredientNames.length > 1 && ingredientNames.filter((n) => flat(materialsRaw).includes(n.slice(0, 8))).length >= 2;
  const materials = materialsRaw && !repeatsIngredients && !flat(ingredients).includes(flat(materialsRaw)) && !flat(materialsRaw).includes(flat(ingredients) || '~') ? materialsRaw : '';
  const facts = (glance.facts || []).filter((f) => !f.unknown && !['inside', 'fda'].includes(f.id));
  const sources = glance.sources || [];
  return (
    <section className="ay-pd" aria-label="Product details">
      <details className="ay-pd__drawer" id="ay-more-details">
        <summary><h2>Product details</h2><span className="ay-pd__chev" aria-hidden="true">+</span></summary>
        <div className="ay-pd__body">
          {safety}
          {what.text && <div className="ay-pd__block"><h3>What it is</h3><p>{what.text}</p>{what.detail && <p>{what.detail}</p>}</div>}
          {(who.items.length > 0 || who.helps.length > 0) && <div className="ay-pd__block"><h3>Who it’s for</h3>
            {who.items.length > 0 ? <ul>{who.items.map((t) => <li key={t}>{t}</li>)}</ul> : <p>{who.helps.join(', ')}</p>}
          </div>}
          {how && <div className="ay-pd__block"><h3>How to use</h3>{how.intro && <p>{noDash(how.intro)}</p>}<ol>{how.steps.map((st) => <li key={st}>{noDash(st)}</li>)}</ol></div>}
          {ingredients && <div className="ay-pd__block"><h3>{product.type === 'digital' ? 'What’s included' : 'Ingredients'}</h3><p className="ay-pd__pre">{ingredients}</p></div>}
          {materials && <div className="ay-pd__block"><h3>Materials and packaging</h3><p>{materials}</p></div>}
          {(facts.length > 0 || extraRows.length > 0) && <div className="ay-pd__block"><h3>Size, price and where to buy</h3>
            <dl className="ay-pd__rows">
              {facts.map((f) => <div key={f.id}><dt>{f.label}</dt><dd>{f.value}{f.note ? <small>{fmtDate(f.note)}</small> : null}</dd></div>)}
              {extraRows.filter((r) => r && r.value).map((r) => <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}
            </dl>
          </div>}
          {sources.length > 0 && <details className="ay-pd__sources"><summary>All sources ({sources.length})</summary>
            <ol>{sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a> <small>{[s.publisher, s.year].filter(Boolean).join(' · ')}</small></li>)}</ol>
          </details>}
        </div>
      </details>
    </section>
  );
}
