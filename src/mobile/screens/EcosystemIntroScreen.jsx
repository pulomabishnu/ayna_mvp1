import MobileHeader from '../components/MobileHeader.jsx';

export default function EcosystemIntroScreen({ onStartQuiz, onAlreadyHaveAccount, onAboutAyna, authUser, onOpenSaved, onBrowse, onGoCommunity, headerInitial = 'A', onOpenProfile }) {
  return (
    <div className="ayna-editorial-eco-intro">
      <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />
      <div className="ayna-editorial-eco-intro-scroll">
        <div className="ayna-editorial-eco-intro-photo">
          <img src="/landing-bg.png" alt="A person stretching in warm afternoon light" />
          <span>Made for all the things that make you, you.</span>
        </div>
        <div className="ayna-editorial-eco-intro-copy">
          <p className="ayna-editorial-kicker">Your personal edit</p>
          <h1>Meet your <em>Ecosystem.</em></h1>
          <p>Tell us what matters to you. We’ll bring together products, research, and real experiences worth exploring.</p>
          <button type="button" className="ayna-editorial-primary" onClick={onStartQuiz}>Start the intake <span aria-hidden="true">↗</span></button>
          {!authUser && <button type="button" className="ayna-editorial-text-link" onClick={onAlreadyHaveAccount}>I already have an account</button>}
          <button type="button" className="ayna-editorial-text-link" onClick={onAboutAyna}>About us</button>
        </div>
      </div>
    </div>
  );
}
