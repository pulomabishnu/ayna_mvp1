import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ProAccess from './ProAccess.jsx';
import { getSupabaseClient } from '../utils/supabaseClient.js';

export default function SubscriptionPaywallModal({ onClose }) {
  const card = useRef(null);
  const [user, setUser] = useState(null);
  useEffect(() => {
    let live = true;
    const client = getSupabaseClient();
    client?.auth.getSession().then(({ data }) => { if (live) setUser(data.session?.user || null); }).catch(() => {});
    const listener = client?.auth.onAuthStateChange((_event, session) => { if (live) setUser(session?.user || null); });
    const previous = document.activeElement;
    card.current?.querySelector('button')?.focus();
    return () => { live = false; listener?.data?.subscription.unsubscribe(); previous?.focus?.(); };
  }, []);
  const keydown = e => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    if (e.key !== 'Tab') return;
    const elements = [...card.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), summary')];
    const first = elements[0], last = elements.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  };
  return createPortal(<div onKeyDown={keydown} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(28,25,23,.65)', display: 'grid', placeItems: 'center', padding: 16 }}>
    <div ref={card} role="dialog" aria-modal="true" aria-label="ayna Pro early access" style={{ background: 'var(--color-surface)', borderRadius: 16, maxWidth: 640, maxHeight: '90dvh', overflow: 'auto', width: '100%', padding: 16 }}>
      <button type="button" className="ay-btn ay-btn--secondary" onClick={onClose}>Close</button>
      <ProAccess user={user} onSignIn={() => window.location.assign('/you/pro')} />
    </div>
  </div>, document.body);
}
