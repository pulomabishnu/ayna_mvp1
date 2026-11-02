import React, { useCallback, useMemo, useRef, useState } from 'react';
import { RewardView, ResultCard } from './FreeProductPage';
import { adminAction, newIdempotencyKey, prefersReducedMotion } from './campaignClient';

/**
 * Team-only test of the real spinner (/admin/campaign → Test the spinner).
 *
 * Same screen people see once they've earned it, same prize pool (the gift box
 * sheet), same 3 spins. Nothing is saved: each spin asks the server for a
 * random prize (api/campaign-admin `test_spin`) without recording it, and
 * "claiming" never takes a unit. No analytics.
 */
const newId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : newIdempotencyKey());

export default function TestSpinner({ user, maxSpins, pool, onClose }) {
  const [spins, setSpins] = useState([]); // [{ spinId, product }], oldest first
  const [claimed, setClaimed] = useState(null);
  const [round, setRound] = useState(0);
  const spinsRef = useRef(spins);

  const statusFor = useCallback((list) => {
    const left = Math.max(0, maxSpins - list.length);
    return {
      campaign: { maxSpins },
      pool,
      inventoryAvailable: pool.length > 0,
      spins: list.length,
      spinsLeft: left,
      canSpin: left > 0 && pool.length > 0,
      landed: [...list].reverse().map((s) => ({ ...s, available: true })),
      lastSpin: null,
      claim: null,
    };
  }, [maxSpins, pool]);

  const status = useMemo(() => statusFor(spins), [spins, statusFor]);

  const client = useMemo(() => ({
    async spin() {
      const list = spinsRef.current;
      const exclude = list.map((s) => s.product.rewardProductId).filter(Boolean);
      const res = await adminAction({ action: 'test_spin', exclude });
      const next = [...list, { spinId: newId(), product: res.product }];
      spinsRef.current = next;
      setSpins(next);
      return { spinId: next[next.length - 1].spinId, product: res.product, spinNumber: next.length, spinsLeft: Math.max(0, maxSpins - next.length) };
    },
    async claim(spinId) {
      const hit = spinsRef.current.find((s) => s.spinId === spinId);
      return { claim: { product: hit?.product, test: true } };
    },
    newIdempotencyKey,
    prefersReducedMotion,
    track() {},
    trackOnce() {},
  }), [maxSpins]);

  const onRefresh = useCallback(async () => statusFor(spinsRef.current), [statusFor]);
  const setStatus = useCallback((fn) => {
    const next = typeof fn === 'function' ? fn(statusFor(spinsRef.current)) : fn;
    if (next?.claim) setClaimed(next.claim);
  }, [statusFor]);

  const restart = () => { spinsRef.current = []; setSpins([]); setClaimed(null); setRound((r) => r + 1); };

  return (
    <div className="fp fp-testspin">
      <div className="fp-notice tone-soft" role="status">
        <div><b>Test mode.</b> This is the real spinner and the real prize pool, but nothing is saved and nothing is used up.</div>
        <div className="fp-actions">
          <button type="button" className="fp-btn" onClick={restart}>Start over</button>
          <button type="button" className="fp-btn is-ghost" onClick={onClose}>Close test</button>
        </div>
      </div>
      {!pool.length && <p className="fp-sub">Nothing can be won right now. Check the sheet has rows with show = yes, then press Sync now.</p>}
      {pool.length > 0 && (claimed ? (
        <div className="fp-reward">
          <ResultCard product={claimed.product} />
          <p className="fp-sub">Test claim after {spins.length} spin{spins.length === 1 ? '' : 's'}. In the real flow they'd now enter their shipping address. Nothing was saved.</p>
          <button type="button" className="fp-btn is-ink" onClick={restart}>Test again</button>
        </div>
      ) : (
        <RewardView key={round} status={status} user={user || { id: 'test' }} onRefresh={onRefresh} onBack={onClose} toast={null} setStatus={setStatus} client={client} />
      ))}
    </div>
  );
}
