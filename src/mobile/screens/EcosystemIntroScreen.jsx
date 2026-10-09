import MobileHeader from '../components/MobileHeader.jsx';

export default function EcosystemIntroScreen({ onStartQuiz, onAlreadyHaveAccount, onAboutAyna, authUser, onOpenSaved, onBrowse, onGoCommunity, headerInitial = 'A', onOpenProfile }) {
  return (
    <main className="ayna-fresh-intro">
      <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />
      <div className="ayna-fresh-intro-scroll">
        <section className="ayna-fresh-intro-stage">
          <span className="ayna-fresh-kicker">YOUR ECOSYSTEM STARTS HERE</span>
          <h1>A space built<br /><em>around you.</em></h1>
          <div className="ayna-figma-intro-preview" aria-hidden="true"><span>YOUR CONTEXT</span><strong>Goals.<br />Health.<br />Preferences.</strong><small>Thoughtful matches, made personal.</small></div>
        </section>
        <section className="ayna-fresh-intro-content">
          <p>Tell us what matters. We’ll bring the products, research, and real perspectives together for you.</p>
          <div className="ayna-fresh-intro-steps"><span>01 <strong>Your goals</strong></span><span>02 <strong>Your health</strong></span><span>03 <strong>Your preferences</strong></span></div>
          <button type="button" className="ayna-fresh-start" onClick={onStartQuiz}>Start the intake <span aria-hidden="true">↗</span></button>
          {!authUser && <button type="button" className="ayna-fresh-plain-link" onClick={onAlreadyHaveAccount}>I already have an account</button>}
          <button type="button" className="ayna-fresh-plain-link" onClick={onAboutAyna}>About us</button>
        </section>
      </div>
    </main>
  );
}
