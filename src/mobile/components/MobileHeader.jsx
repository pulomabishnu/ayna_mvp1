export default function MobileHeader({ onOpenSaved, onBack }) {
  return <header className="ayna-figma-header ayna-shared-header">
    <div className="ayna-shared-header-leading">
      {onBack && <button type="button" onClick={onBack} aria-label="Back" className="ayna-shared-header-action">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg>
      </button>}
      <span className="ayna-shared-wordmark">ayna</span>
    </div>
    {onOpenSaved && <button type="button" onClick={onOpenSaved} aria-label="Saved products" className="ayna-shared-header-action">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20s-7-4.5-7-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7 3c0 4.9-7 9.4-7 9.4Z" /></svg>
    </button>}
  </header>;
}
