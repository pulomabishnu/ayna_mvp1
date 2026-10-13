import React from 'react';
import posthog from 'posthog-js';
import { useEscapeToClose } from '../utils/useEscapeToClose';
import {
  RESA_BLURB,
  RESA_FEATURES,
  RESA_SITE_URL,
  RESA_WAITLIST_CTA,
  RESA_WAITLIST_NOTE,
  RESA_WAITLIST_URL,
} from '../data/resaPartnership';

/**
 * Opened from the Rèsa chip in My Ecosystem's "Sync wearable & app data"
 * panel. Rèsa is pre-launch, so there is nothing to sync yet; this explains
 * the partnership and links to the tracked waitlist. Same overlay shell as
 * SubscriptionPaywallModal.
 */
export default function ResaPartnershipModal({ onClose }) {
  useEscapeToClose(true, onClose);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(28,25,23,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resa-partnership-title"
        onClick={(e) => e.stopPropagation()}
        className="resa-modal"
      >
        <button type="button" onClick={onClose} aria-label="Close" className="resa-modal__close">
          ✕
        </button>

        <div className="resa-modal__tag">ayna Partner · Pre-launch · Coming soon</div>
        <img className="resa-modal__logo" src="/brands/resa.png" alt="Rèsa" />
        <h2 id="resa-partnership-title" className="resa-modal__title">
          ayna × Rèsa
        </h2>
        <p className="resa-modal__lede">
          We&apos;re partnering with Rèsa to bring their data into your ayna wearable dashboard once both are live.
          Syncing isn&apos;t available yet. Rèsa is still pre-launch.
        </p>
        <p className="resa-modal__body">{RESA_BLURB}</p>
        <ul className="resa-modal__features">
          {RESA_FEATURES.map((f) => <li key={f}>{f}</li>)}
        </ul>
        <p className="resa-modal__note">{RESA_WAITLIST_NOTE}</p>

        <div className="resa-modal__actions">
          <a
            className="resa-modal__cta"
            href={RESA_WAITLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('resa_waitlist_clicked', { source: 'ecosystem_sync_modal' })}
          >
            {RESA_WAITLIST_CTA} →
          </a>
          <a className="resa-modal__secondary" href={RESA_SITE_URL} target="_blank" rel="noopener noreferrer">
            Learn more at resa-labs.com
          </a>
        </div>
      </div>
    </div>
  );
}
