import { useContext, useEffect } from 'react';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { installReferralCapture } from '../../utils/badges.js';
import { AskContext, AppHeaderContext } from '../askContext.js';
import { CartMark } from '../../components/nav/tabs.jsx';
import UpdatesBell from '../../components/updates/UpdatesBell.jsx';
import AskSuggestRow from '../../components/nav/AskSuggestRow.jsx';
import '../../styles/flow.css';
import './mobile-header.css';

// The header scrolls away with the screen (founder, Oct 21: nothing stays on
// screen while the page scrolls), so there is no collapsing small-title bar.
// `title` and `titleFor` are still accepted from callers and ignored.
// onOpenSaved is still accepted from callers and ignored.
// hideAsk: Home has its own "Ask ayna" bar right under the header.
export default function MobileHeader({ onOpenSettings, onBack, hideAsk = false }) {
  const openAsk = useContext(AskContext);
  const head = useContext(AppHeaderContext);
  // Header is on every app tab: capture invite codes (idempotent).
  useEffect(() => { installReferralCapture(getSupabaseClient()); }, []);
  const surface = head?.suggest?.surface || (typeof document !== 'undefined' ? document.querySelector('.ayna-mobile')?.dataset?.screen || '' : '');
  return <><header className="ayna-figma-header ayna-shared-header">
    <div className="ayna-shared-header-leading">
      {onBack && <button type="button" onClick={onBack} aria-label="Back" className="ayna-shared-header-action">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg>
      </button>}
      {/* The wordmark opens the landing, signed in or out (founder, Oct 27 01:13). */}
      {head?.onOpenLanding
        ? <button type="button" className="ayna-shared-wordmark ay-logo-btn" onClick={head.onOpenLanding} aria-label="ayna, open the welcome page">ayna</button>
        : <span className="ayna-shared-wordmark">ayna</span>}
    </div>
    <div className="ay-header-actions">
    {openAsk && !hideAsk && <button type="button" onClick={openAsk} aria-label="Ask ayna" className="ay-header-ask ay-header-ask-pill">
      <span className="ay-header-ask-orb" aria-hidden="true" />
      Ask ayna
    </button>}
    {/* The cart (founder, Nov 10: "ask ayna, cart and a bell"): what she saved to buy, with the count. Opens Saved. */}
    {head?.onOpenSaved && <button type="button" onClick={head.onOpenSaved} aria-label={head.savedCount ? `Cart, ${head.savedCount} saved ${head.savedCount === 1 ? 'product' : 'products'}` : 'Cart, your saved products'} className={`ay-header-heart is-cart${head.savedCount ? ' has-saved' : ''}`} data-tab-target="saved" data-tour="saved-heart">
      <CartMark />
      {head.savedCount > 0 && <span className="ay-heart-count" aria-hidden="true">{head.savedCount > 99 ? '99+' : head.savedCount}</span>}
    </button>}
    {/* Updates (founder, Nov 10): check-ins, answers to re-check, community replies, ayna news. */}
    {head?.onUpdate && <UpdatesBell className="ay-header-heart" userId={head.userId || null} quizAnswers={head.quizAnswers || null} onGo={head.onUpdate} theme={head.theme} />}
    {onOpenSettings && <button type="button" onClick={onOpenSettings} aria-label="Settings" className="ayna-shared-header-action ay-header-saved ay-header-settings">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
    </button>}
    {/* Profile is a tab now (founder, Nov 10), so the round profile button left the header. */}
    </div>
  </header>
  {/* Ask ayna suggestions under the header; the questions change with the page she is on. */}
  {head?.suggest && openAsk && <AskSuggestRow className="ay-asksug--app" signedIn={head.suggest.signedIn} hasProfile={head.suggest.hasProfile} surface={surface} onAsk={(question) => openAsk({ question })} />}
  </>;
}
