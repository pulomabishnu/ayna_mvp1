import { useContext } from 'react';
import { AskContext } from '../askContext.js';

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
    {openAsk && <button type="button" onClick={openAsk} aria-label="Ask ayna" className="ayna-shared-header-action ay-header-ask">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v12H9l-5 3V5Z" /><path d="M10 9.5a2 2 0 1 1 3.4 1.4c-.9.6-1.4 1-1.4 2.1M12 15h.01" /></svg>
    </button>}
    {onOpenSaved && <button type="button" onClick={onOpenSaved} aria-label="Saved products" className="ayna-shared-header-action">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20s-7-4.5-7-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7 3c0 4.9-7 9.4-7 9.4Z" /></svg>
    </button>}
    </div>
  </header>;
}
