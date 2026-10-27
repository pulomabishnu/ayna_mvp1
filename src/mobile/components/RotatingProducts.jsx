import { HEART_PATH } from '../utils/heart.js';
import { useRef, useState } from 'react';
import ProductImage from './ProductImage.jsx';
import { getProductById } from '../../data/products.js';

// Welcome-page feature reel. Four "now playing"-style cards, one per thing
// ayna does, each a full colour block with one big graphic. Numbers here are
// illustrative UI (labelled as a preview), not anyone's real data.
// Manual, not auto-advancing (walkthrough P1-18): the brand ribbon below is
// the screen's one moving loop (design-direction "Motion"), and auto-rotating
// carousels move content away before people finish reading it (Nielsen Norman
// Group, "Auto-forwarding carousels"; W3C APG carousel pattern). Tap the card,
// swipe it, or use the dots.
const FEATURES = [
  { key: 'ecosystem', label: 'Your ecosystem', tone: 'butter' },
  { key: 'match', label: 'Your match', tone: 'pink' },
  { key: 'ask', label: 'Ask ayna', tone: 'mint' },
  { key: 'discover', label: 'Discover', tone: 'peri' },
];

// Real catalog products on white tiles (the one place white appears), so the
// rows read as shelves, not empty colour squares.
const SHELF_PICKS = [['Period', 'pink', 'p-saalt-cup'], ['Pelvic care', 'mint', 'p-elvie-trainer'], ['Sleep', 'peri', 'p-magnumsolace-nighttime-magnesium-cream']];
function Thumb({ id }) {
  const product = getProductById(id);
  if (!product) return null;
  return <ProductImage product={product} src={product.image || product.imageUrl} alt="" style={{ objectFit: 'contain' }} />;
}

function EcosystemArt() {
  return <div className="ay-reel-eco">
    {SHELF_PICKS.map(([name, tone, id], i) => (
      <div key={name} className="ay-reel-track" style={{ '--i': i }}>
        <span className={`ay-reel-cover is-${tone} has-photo`}><Thumb id={id} /></span>
        <span className="ay-reel-tracktext"><strong>{name}</strong>{getProductById(id)?.name && <small>{getProductById(id).name}</small>}</span>
        <span className="ay-reel-eq" aria-hidden="true"><i /><i /><i /></span>
      </div>
    ))}
  </div>;
}

function MatchArt() {
  return <div className="ay-reel-match">
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle className="edge" cx="60" cy="60" r="48" />
      <circle className="track" cx="60" cy="60" r="48" />
      <circle className="fill" cx="60" cy="60" r="48" />
    </svg>
    <div className="ay-reel-score is-word"><span>your</span><strong>match</strong></div>
    <div className="ay-reel-tags"><span>Fit</span><span>Evidence</span><span>Reviews</span></div>
  </div>;
}

function AskArt() {
  return <div className="ay-reel-ask">
    <p className="q">What helps with cramps?</p>
    <p className="a"><span className="ay-reel-dots" aria-hidden="true"><i /><i /><i /></span><span className="txt">Here’s what fits your profile, and why.</span></p>
  </div>;
}

function DiscoverArt() {
  return <div className="ay-reel-deck">
    <span className="c1" /><span className="c2" /><span className="c3"><div className="ay-reel-deck__photo"><Thumb id="p-thermacare" /></div><svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART_PATH} /></svg></span>
  </div>;
}

const ART = { ecosystem: EcosystemArt, match: MatchArt, ask: AskArt, discover: DiscoverArt };

export default function RotatingProducts() {
  const [index, setIndex] = useState(0);
  const touchX = useRef(null);
  const go = (n) => setIndex(((n % FEATURES.length) + FEATURES.length) % FEATURES.length);
  const feature = FEATURES[index];
  const Art = ART[feature.key];

  return <div className={`ay-reel is-${feature.tone}`} role="group" aria-roledescription="carousel" aria-label="What ayna does"
    onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }}
    onTouchEnd={(e) => { const start = touchX.current; touchX.current = null; if (start == null) return; const dx = (e.changedTouches[0]?.clientX ?? start) - start; if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1)); }}>
    <div className="ay-reel-head"><span aria-live="polite">{feature.label}</span><span>{String(index + 1).padStart(2, '0')}/04</span></div>
    <button className="ay-reel-next" type="button" aria-label={`Next: ${FEATURES[(index + 1) % FEATURES.length].label}`} onClick={() => go(index + 1)} />
    <div className="ay-reel-stage" key={feature.key}><Art /></div>
    <div className="ay-reel-foot">
      <div className="ay-reel-progress is-dots" role="group" aria-label="Choose a feature">{FEATURES.map((item, step) => <button key={item.key} type="button" aria-current={step === index ? 'true' : undefined} aria-label={`${item.label}, ${step + 1} of ${FEATURES.length}`} className={step === index ? 'is-now' : ''} onClick={() => go(step)}><i /></button>)}</div>
    </div>
  </div>;
}
