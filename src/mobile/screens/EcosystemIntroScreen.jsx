import MobileHeader from '../components/MobileHeader.jsx';

export default function EcosystemIntroScreen({ onStartQuiz, onAlreadyHaveAccount, onAboutAyna, authUser, onOpenSaved, onBrowse, onGoCommunity, headerInitial = 'A', onOpenProfile }) {
  return (
    <div className="ayna-v2-eco-intro">
      <MobileHeader variant="light" activeTab="eco" initial={headerInitial} onOpenSaved={onOpenSaved} onGoBrowse={onBrowse} onGoCommunity={onGoCommunity} onOpenProfile={onOpenProfile} />
      <div className="ayna-v2-eco-intro-scroll">
        <section className="ayna-v2-eco-intro-blue">
          <p className="ayna-v2-overline">THIS SPACE IS YOURS</p>
          <h1>Less noise.<br /><span>More you.</span></h1>
          <div className="ayna-v2-eco-intro-notes"><span>01 / Your goals</span><span>02 / Your history</span><span>03 / Your preferences</span></div>
        </section>
        <section className="ayna-v2-eco-intro-copy">
          <h2>Meet your Ecosystem.</h2>
          <p>Tell us what matters to you. We’ll show you products with context from research and real people.</p>
          <button type="button" className="ayna-v2-primary" onClick={onStartQuiz}>Start the intake <span aria-hidden="true">↗</span></button>
          {!authUser && <button type="button" className="ayna-v2-text-link" onClick={onAlreadyHaveAccount}>I already have an account</button>}
          <button type="button" className="ayna-v2-text-link" onClick={onAboutAyna}>About us</button>
        </section>
      </div>
    </div>
  );
}
