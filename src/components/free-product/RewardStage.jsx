import { useCallback, useEffect, useRef, useState } from 'react';
import ProductTileImage from '../ProductTileImage';
import { CATEGORY_LABELS } from '../../data/products';
import { claimProduct, spinForProduct, track } from '../../utils/campaignClient';
import { useEscapeToClose } from '../../utils/useEscapeToClose';

const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const categoryLabel = (c) => CATEGORY_LABELS[c] || String(c || '').replace(/-/g, ' ');

const SPIN_ERRORS = {
  empty: "Every free product is spoken for right now.",
  not_eligible: "Looks like something changed. Head back and check your progress.",
  already_claimed: "You've already claimed your free product.",
  rate_limited: 'Easy there. Give it a few seconds and spin again.',
  network: "Couldn't reach ayna. Check your connection and spin again.",
};

/** Five tone cards that shuffle while the server picks. Purely decorative. */
function Deck({ shuffling }) {
  return (
    <div className={`ayfp-deck${shuffling ? ' is-shuffling' : ''}`} aria-hidden="true">
      {['butter', 'pink', 'peri', 'mint', 'paper'].map((t, i) => (
        <span key={t} className={`ayfp-deck__card tone-${t}`} style={{ '--i': i }}>
          <i /><i />
        </span>
      ))}
    </div>
  );
}

function ConfirmDialog({ product, busy, onConfirm, onCancel }) {
  const ref = useRef(null);
  const confirmRef = useRef(null);
  useEscapeToClose(!busy, onCancel);
  useEffect(() => {
    const prev = document.activeElement;
    confirmRef.current?.focus();
    return () => { try { prev?.focus?.(); } catch { /* gone */ } };
  }, []);
  const trap = (e) => {
    if (e.key !== 'Tab') return;
    const els = ref.current?.querySelectorAll('button:not([disabled])');
    if (!els?.length) return;
    const first = els[0]; const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  return (
    <div className="ay-newacct ayfp-confirm" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div ref={ref} className="ay-newacct__card" role="alertdialog" aria-modal="true" aria-labelledby="ayfp-confirm-title" aria-describedby="ayfp-confirm-desc" onKeyDown={trap}>
        <span className="ay-newacct__mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.5l2.4 5 5.4.6-4 3.7 1.1 5.4L12 15.5l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z" /></svg></span>
        <h2 id="ayfp-confirm-title">claim {product.name}?</h2>
        <p id="ayfp-confirm-desc">Once you claim this product, your reward is locked in and you won't be able to spin for another one.</p>
        <button ref={confirmRef} type="button" className="ay-newacct__primary" onClick={onConfirm} disabled={busy} aria-busy={busy || undefined}>
          {busy ? 'Claiming…' : 'yes, claim it'}
        </button>
        <button type="button" className="ay-newacct__quiet" onClick={onCancel} disabled={busy}>keep spinning</button>
      </div>
    </div>
  );
}

export default function RewardStage({ status, onClaimed, onBack, onStatusRefresh }) {
  const [phase, setPhase] = useState('intro'); // intro | spinning | result | empty
  const [spin, setSpin] = useState(null); // { spinId, rewardId, product, spinCount }
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const live = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => { track('reward_experience_opened'); headingRef.current?.focus(); }, []);

  const doSpin = useCallback(async () => {
    const previous = spin?.product?.id || null;
    setNotice('');
    setPhase('spinning');
    const reduce = prefersReducedMotion();
    const [r] = await Promise.all([spinForProduct(), wait(reduce ? 0 : 1400)]);
    if (r.status !== 'ok') {
      if (r.error === 'empty' || r.status === 'empty') { setPhase('empty'); onStatusRefresh?.(); return; }
      if (r.error === 'already_claimed') { onStatusRefresh?.(); return; }
      setNotice(SPIN_ERRORS[r.error] || "Something went wrong. Spin again.");
      setPhase(spin ? 'result' : 'intro');
      return;
    }
    setSpin(r);
    setPhase('result');
    if (previous) track('reward_respin', { previous_product_id: previous });
    track('reward_spin', { spin_count: r.spinCount });
    track('reward_product_shown', { product_id: r.product?.id, reward_id: r.rewardId, spin_count: r.spinCount });
  }, [spin, onStatusRefresh]);

  const confirmClaim = async () => {
    if (!spin || claiming) return;
    setClaiming(true);
    track('reward_claim_attempted', { product_id: spin.product?.id });
    const r = await claimProduct({ rewardId: spin.rewardId, spinId: spin.spinId });
    setClaiming(false);
    if (r.status === 'claimed' || (r.status === 'already_claimed' && r.claim)) {
      setConfirming(false);
      if (r.status === 'claimed') track('reward_claimed', { product_id: r.productId, spins_before_claim: r.spinsBeforeClaim });
      onClaimed(r.claim);
      return;
    }
    setConfirming(false);
    if (r.error === 'out_of_stock') {
      track('reward_claim_failed_inventory', { product_id: spin.product?.id });
      setNotice("That one was just claimed. Spin again and we'll find you another.");
      setSpin(null);
      setPhase('intro');
      onStatusRefresh?.();
    } else if (r.error === 'stale_spin') {
      setNotice('That spin timed out. Spin again to pick up where you left off.');
      setSpin(null);
      setPhase('intro');
    } else if (r.error === 'network') {
      setNotice("Couldn't reach ayna, so nothing was claimed yet. Your spin is still here. Try claiming again.");
    } else if (r.error === 'not_eligible') {
      setNotice('Looks like something changed. Head back and check your progress.');
    } else {
      setNotice('Something went wrong. Nothing was claimed. Try again.');
    }
  };

  useEffect(() => {
    if (phase === 'result' && spin && live.current) {
      live.current.textContent = `Your spin landed on ${spin.product.name}${spin.product.brand ? ` by ${spin.product.brand}` : ''}.`;
    }
  }, [phase, spin]);

  const product = spin?.product;
  const empty = phase === 'empty' || (!status.inventoryAvailable && !spin);

  return (
    <section className="wyou ayfp ayfp-stage" aria-labelledby="ayfp-stage-title">
      <button type="button" className="ayfp-back" onClick={onBack}><span aria-hidden="true">←</span> back to your progress</button>
      <header className="ayfp-stage__head">
        <h1 id="ayfp-stage-title" ref={headingRef} tabIndex={-1}>{empty ? 'the shelf is empty right now' : 'spin for something you\'ll actually want'}</h1>
        {!empty && <p className="wyou-muted">Not for you? Spin again, as many times as you like. Claiming is final.</p>}
      </header>
      <div ref={live} className="ayfp-sr" aria-live="polite" />

      {empty ? (
        <div className="wyou-card ayfp-empty">
          <p>Every free product has been claimed for now. You're still unlocked: when we add more, you can spin right away from this page.</p>
          <button type="button" className="wyou-btn is-ghost" onClick={onBack}>back to your progress</button>
        </div>
      ) : (
        <div className={`ayfp-reveal is-${phase}`}>
          {(phase === 'intro' || phase === 'spinning') && (
            <div className="ayfp-reveal__deck">
              <Deck shuffling={phase === 'spinning'} />
              <button type="button" className="wyou-btn ayfp-spin-btn" onClick={doSpin} disabled={phase === 'spinning'} aria-busy={phase === 'spinning' || undefined}>
                {phase === 'spinning' ? 'Picking…' : 'spin'}
              </button>
            </div>
          )}

          {phase === 'result' && product && (
            <article className="ayfp-result" aria-labelledby="ayfp-result-name">
              <div className="ayfp-result__img">
                <ProductTileImage product={product} alt={`${product.name}${product.brand ? ` by ${product.brand}` : ''}`} loading="eager" />
              </div>
              <div className="ayfp-result__body">
                <div className="ayfp-result__meta">
                  {product.brand && <span className="ayfp-result__brand">{product.brand}</span>}
                  {product.category && <span className="ayfp-chip">{categoryLabel(product.category)}</span>}
                </div>
                <h2 id="ayfp-result-name">{product.name}</h2>
                {product.summary && <p className="ayfp-result__summary">{product.summary}</p>}
                <div className="ayfp-result__actions">
                  <button type="button" className="wyou-btn" onClick={() => setConfirming(true)}>claim this</button>
                  <button type="button" className="wyou-btn is-ghost" onClick={doSpin}>spin again</button>
                </div>
                <small className="ayfp-small">Spin {spin.spinCount}</small>
              </div>
            </article>
          )}
        </div>
      )}

      {notice && <p className="ayfp-msg ayfp-stage__notice" role="alert">{notice}</p>}
      {confirming && product && (
        <ConfirmDialog product={product} busy={claiming} onConfirm={confirmClaim} onCancel={() => setConfirming(false)} />
      )}
    </section>
  );
}
