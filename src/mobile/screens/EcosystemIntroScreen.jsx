import MobileHeader from '../components/MobileHeader.jsx';

export default function EcosystemIntroScreen({ onStartQuiz, onAlreadyHaveAccount, onAboutAyna, authUser, onOpenSaved, onBrowse, onGoCommunity, headerInitial = 'A', onOpenProfile }) {
  return (
    <main className="ayna-fresh-intro">
      <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />
      <div className="ayna-fresh-intro-scroll">
        <section className="ayna-fresh-intro-stage">
          <span className="ayna-fresh-kicker">YOUR ECOSYSTEM STARTS HERE</span>
          <h1>More <em>you.</em><br />Less guesswork.</h1>
          <div className="ayna-fresh-intro-art" aria-hidden="true"><span className="ayna-fresh-intro-ring" /><span className="ayna-fresh-intro-note note-one">HEALTH HISTORY</span><span className="ayna-fresh-intro-note note-two">YOUR GOALS</span><span className="ayna-fresh-intro-note note-three">YOUR PREFERENCES</span></div>
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
