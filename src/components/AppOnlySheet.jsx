import { useEffect, useRef } from 'react';
import './app-only-sheet.css';

// The ayna iPhone beta (TestFlight public link); same QR as ProLock.
export const AYNA_APP_URL = 'https://testflight.apple.com/join/f3C9PypD';

/**
 * Something that only works in the ayna app, opened on the website
 * (founder, Oct 29: "connect your wearables ... has to say to download the
 * app for that"). Apple Health and Health Connect live on the phone, so the
 * website never pretends to connect them.
 *
 * pro: she already has ayna Pro (no Pro button; an upload link instead).
 */
export default function AppOnlySheet({ open, onClose, pro = false, onGetPro, onUpload }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="ay-apponly" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <section className="ay-apponly__card" role="dialog" aria-modal="true" aria-labelledby="ay-apponly-t">
        <button ref={closeRef} type="button" className="ay-apponly__x" aria-label="Close" onClick={onClose}>×</button>
        <p className="ay-apponly__k">In the ayna app</p>
        <h2 id="ay-apponly-t" className="ay-apponly__t">Connect your health data on your phone</h2>
        <p className="ay-apponly__line">Apple Health, Health Connect and Oura connect from the ayna app. Download it, sign in, and connect there.{pro ? '' : ' Connecting is part of ayna Pro.'}</p>
        <div className="ay-apponly__qr">
          <a href={AYNA_APP_URL} target="_blank" rel="noopener noreferrer" aria-label="Download the ayna app">
            <img src="/images/testflight-qr.svg" alt="QR code to download the ayna app" width="112" height="112" />
          </a>
          <p>Scan with your iPhone camera.</p>
        </div>
        <div className="ay-apponly__actions">
          <a className="ay-apponly__cta" href={AYNA_APP_URL} target="_blank" rel="noopener noreferrer">Download the app</a>
          {!pro && onGetPro && <button type="button" className="ay-apponly__ghost" onClick={onGetPro}>Get ayna Pro</button>}
          {pro && onUpload && <button type="button" className="ay-apponly__quiet" onClick={onUpload}>Upload a file instead</button>}
        </div>
      </section>
    </div>
  );
}
