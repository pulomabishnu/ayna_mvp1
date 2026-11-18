import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeToClose } from '../../utils/useEscapeToClose';
import { useFocusTrap } from '../../utils/useFocusTrap';
import { LEGAL_LINKS } from '../../utils/signupConsent.js';
import './privacy-plain.css';

/*
 * Nov 17 (focus group: Isabel left before making an account, Elizabeth and Jackie asked where their data goes;
 * Puloma and Ameera: "plain English, a layout like Verily"). How ayna treats her data, in five short blocks.
 *
 * Every sentence matches how ayna actually works (checked Nov 17):
 * - Encrypted in transit and on our servers: HTTPS everywhere; Supabase encrypts all customer data at rest
 *   (AES-256) and in transit (TLS) (supabase.com/security).
 * - Linked to her account, not anonymous: account-linked rows, protected by row-level security so one account
 *   can only read its own records (Privacy Policy section 8).
 * - Never sold (Privacy Policy section 6, Consumer Health Data Notice).
 * - AI only when she uses an AI feature, named providers (sign-up consent, Privacy Policy section 5).
 * - Brands: no identity or health details; at most totals such as Buy clicks per product per day, counted
 *   without who clicked (Consumer Health Data Notice section 5).
 * - Optional analytics off until she opts in and never include quiz answers or health details (Privacy Policy).
 * - Disconnect, delete health data, download, delete account: Profile > Settings & privacy (all built).
 */

const I = {
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="3" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
  hand: <><path d="M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.7-7 10-7 10Z" /></>,
  toggle: <><rect x="3.5" y="7.5" width="17" height="9" rx="4.5" /><circle cx="16" cy="12" r="2.6" /></>,
  list: <><path d="M9 7h10M9 12h10M9 17h10" /><circle cx="5" cy="7" r="1" /><circle cx="5" cy="12" r="1" /><circle cx="5" cy="17" r="1" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>,
};
const Icon = ({ name }) => <span className="ay-pp__ic" aria-hidden="true"><svg viewBox="0 0 24 24">{I[name]}</svg></span>;

const PRIVACY_BLOCKS = [
  { id: 'collect', icon: 'list', title: 'What we collect, and why', body: 'Your email, so your matches and routine are saved and follow you to any device. The quiz answers, symptoms and medicines you choose to add, so ayna can match products to you and check them for safety. Nothing else is required.' },
  { id: 'protect', icon: 'lock', title: 'How it’s protected', body: 'Everything is encrypted in transit and on our servers. Your health details are linked to your account, not anonymous, so they’re locked to you: other people using ayna can never see them. We never sell them.' },
  { id: 'connect', icon: 'link', title: 'Apple Health, Oura and AI', body: 'Apple Health and Oura connect only if you turn them on, and ayna only reads what you allow, for your trends and matches. When you use Ask ayna or another AI feature, a short piece of relevant info goes to an outside AI provider (OpenAI, Anthropic or Google Gemini) to write your answer. Only then.' },
  { id: 'brands', icon: 'eye', title: 'What brands see', body: 'Never your name, email or health details. At most, ayna shares totals with brands, like how many times a product was clicked, never who clicked it. Optional app analytics stay off until you say yes, and never include your answers.' },
  { id: 'control', icon: 'toggle', title: 'You’re in control', body: 'In Profile › Settings & privacy you can disconnect Apple Health or Oura, delete the health data ayna has, download a copy of your data, or delete your account.' },
];

/** The short version for sign-in: three lines and a way to read more. */
export function PrivacyPromise({ onMore }) {
  return (
    <section className="ay-pp-card" aria-labelledby="ay-pp-card-h">
      <h2 id="ay-pp-card-h" className="ay-pp-card__h">Your data is private</h2>
      <ul className="ay-pp-card__list">
        <li><Icon name="lock" /><span><b>Never sold.</b> Encrypted in transit and on our servers.</span></li>
        <li><Icon name="hand" /><span><b>Only what you choose.</b> Your email saves your matches. Health details are only what you add.</span></li>
        <li><Icon name="toggle" /><span><b>You’re in control.</b> Disconnect apps or delete your account anytime.</span></li>
      </ul>
      {onMore && <button type="button" className="ay-pp-card__more" onClick={onMore}>How ayna protects your data</button>}
    </section>
  );
}

/** The five blocks and the full policies (Privacy & data, and the sheet below). */
export function PrivacyPlainBlocks({ headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  return (
    <div className="ay-pp">
      <ul className="ay-pp__blocks">
        {PRIVACY_BLOCKS.map((b) => <li key={b.id} className={`ay-pp__block is-${b.id}`}><Icon name={b.icon} /><div><H className="ay-pp__t">{b.title}</H><p>{b.body}</p></div></li>)}
      </ul>
      <p className="ay-pp__links">The full details: {LEGAL_LINKS.slice(0, 2).map((l, i) => <span key={l.href}>{i > 0 && ' and '}<a href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a></span>)}.</p>
    </div>
  );
}

/** Full-screen sheet over the app (keeps light/dark by living inside the app root). */
export function PrivacyPlainSheet({ onClose }) {
  const [host, setHost] = useState(null);
  useEscapeToClose(true, onClose);
  const trap = useFocusTrap(Boolean(host));
  // The app root keeps light/dark; found from where the sheet is mounted.
  if (!host) return <span hidden ref={(el) => { if (el) setHost(el.closest('.ayna-mobile, .app-container') || document.body); }} />;
  return createPortal(
    <div className="ay-pp-sheet" onClick={onClose}>
      <section ref={trap} tabIndex={-1} className="ay-pp-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="ay-pp-sheet-h" onClick={(e) => e.stopPropagation()}>
        <header className="ay-pp-sheet__head">
          <h2 id="ay-pp-sheet-h">How ayna protects your data</h2>
          <button type="button" className="ay-pp-sheet__x" onClick={onClose} aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </header>
        <PrivacyPlainBlocks headingLevel={3} />
        <button type="button" className="ay-pp-sheet__done" onClick={onClose}>Got it</button>
      </section>
    </div>,
    host,
  );
}
