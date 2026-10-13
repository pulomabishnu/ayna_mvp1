import { useContext } from 'react';
import { AskContext } from '../askContext.js';
import { HEART_PATH } from '../utils/heart.js';
import '../../styles/flow.css';

export default function MobileHeader({ onOpenSaved, onBack }) {
  const openAsk = useContext(AskContext);
  return <header className="ayna-figma-header ayna-shared-header">
    <div className="ayna-shared-header-leading">
      {onBack && <button type="button" onClick={onBack} aria-label="Back" className="ayna-shared-header-action">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg>
      </button>}
      <span className="ayna-shared-wordmark">ayna</span>
    </div>
    <div className="ay-header-actions">
    {openAsk && <button type="button" onClick={openAsk} aria-label="Ask ayna" className="ay-header-ask ay-header-ask-pill">
      <span className="ay-header-ask-orb" aria-hidden="true" />
      Ask ayna
    </button>}
    {onOpenSaved && <button type="button" onClick={onOpenSaved} aria-label="Saved" className="ayna-shared-header-action">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={HEART_PATH} /></svg>
    </button>}
    </div>
  </header>;
}
