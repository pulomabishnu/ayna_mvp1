import MobileHeader from '../components/MobileHeader.jsx';

export default function EcosystemIntroScreen({ onStartQuiz, onAlreadyHaveAccount, onAboutAyna, authUser, onOpenSaved, onBrowse, onGoCommunity, headerInitial = 'A', onOpenProfile }) {
  return <main className="ayna-ecosystem-start">
    <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />
    <div className="ayna-ecosystem-start-scroll">
      <h1>Make it<br /><em>yours.</em></h1>
      <div className="ayna-context-orbit" aria-label="An Ecosystem shaped by your goals, health and preferences">
        <svg aria-hidden="true" viewBox="0 0 320 280"><path d="M160 140 85 55M160 140 248 89M160 140 119 230" /></svg>
        <span className="ayna-context-you">you</span><span className="ayna-context-goals">Goals</span><span className="ayna-context-health">Health</span><span className="ayna-context-preferences">Preferences</span>
      </div>
      <div className="ayna-ecosystem-start-actions">
        <button type="button" className="ayna-ecosystem-start-primary" onClick={onStartQuiz}>Start intake</button>
        <div>{!authUser && <button type="button" onClick={onAlreadyHaveAccount}>Sign in</button>}<button type="button" onClick={onAboutAyna}>About us</button></div>
      </div>
    </div>
  </main>;
}
