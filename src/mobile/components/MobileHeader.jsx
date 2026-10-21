import { useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { installReferralCapture } from '../../utils/badges.js';
import { AskContext } from '../askContext.js';
import { HEART_PATH } from '../utils/heart.js';
import '../../styles/flow.css';
import './mobile-header.css';

// Large title that collapses (iOS pattern): a screen passes `title` and the id
// of its big h1. Once that h1 scrolls up under this bar, the bar shows the
// title at 17pt in place of the wordmark, so you always know where you are.
export default function MobileHeader({ onOpenSaved, onOpenSettings, onBack, title = '', titleFor = '' }) {
  const openAsk = useContext(AskContext);
  const [collapsed, setCollapsed] = useState(false);
  // Header is on every app tab: capture invite codes (idempotent).
  useEffect(() => { installReferralCapture(getSupabaseClient()); }, []);
  useEffect(() => {
    if (!titleFor || typeof IntersectionObserver === 'undefined') return undefined;
    const el = document.getElementById(titleFor);
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => setCollapsed(!entry.isIntersecting && entry.boundingClientRect.top < 80), { rootMargin: '-72px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [titleFor]);
  return <header className={`ayna-figma-header ayna-shared-header${collapsed ? ' is-collapsed' : ''}`}>
    <div className="ayna-shared-header-leading">
      {onBack && <button type="button" onClick={onBack} aria-label="Back" className="ayna-shared-header-action">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg>
      </button>}
      <span className="ayna-shared-wordmark" aria-hidden={collapsed || undefined}>ayna</span>
      {title && <span className="ay-header-inline-title" aria-hidden={!collapsed || undefined}>{title}</span>}
    </div>
    <div className="ay-header-actions">
    {openAsk && <button type="button" onClick={openAsk} aria-label="Ask ayna" className="ay-header-ask ay-header-ask-pill">
      <span className="ay-header-ask-orb" aria-hidden="true" />
      Ask ayna
    </button>}
    {onOpenSaved && <button type="button" onClick={onOpenSaved} aria-label="Saved" className="ayna-shared-header-action ay-header-saved" data-saved-count>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={HEART_PATH} /></svg>
    </button>}
    {onOpenSettings && <button type="button" onClick={onOpenSettings} aria-label="Settings" className="ayna-shared-header-action ay-header-saved ay-header-settings">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
    </button>}
    </div>
  </header>;
}
