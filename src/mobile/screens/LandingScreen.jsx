export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna }) {
  return (
    <main className="ayna-fresh-welcome ayna-cover">
      <div className="ayna-fresh-welcome-top ayna-cover-top"><span className="ayna-fresh-wordmark">ayna</span><button type="button" onClick={onAlreadyHaveAccount}>Sign in</button></div>
      <div className="ayna-cover-spacer" aria-hidden="true" />
      <div className="ayna-cover-seal" aria-label="Clinical context included">CLINICAL<br />CONTEXT<span aria-hidden="true">✓</span></div>
      <div className="ayna-cover-content">
        <span className="ayna-cover-kicker">HEALTH, WITH CONTEXT</span>
        <h1>picked for<br /><em>your body,</em><br />with the why.</h1>
        <p>Tell us what matters to you. See products and care matched to your answers, with research and real experiences in view.</p>
        <div className="ayna-cover-tiles" aria-label="What shapes an Ayna pick">
          <div><strong>01</strong><span>your answers</span></div>
          <div><strong>02</strong><span>evidence</span></div>
          <div><strong>03</strong><span>real voices</span></div>
        </div>
        <button className="ayna-fresh-start ayna-cover-start" type="button" onClick={onStartQuiz}><span>Build my Ecosystem</span><span className="ayna-cover-arrow" aria-hidden="true">→</span></button>
        <button className="ayna-fresh-browse ayna-cover-browse" type="button" onClick={onBrowse}>I’m just browsing <span aria-hidden="true">→</span></button>
        <div className="ayna-fresh-links ayna-cover-links"><button type="button" onClick={onAlreadyHaveAccount}>I already have an account</button><button type="button" onClick={onAboutAyna}>About us</button></div>
        <small className="ayna-cover-privacy">Private by default · recommendations, not diagnoses</small>
      </div>
    </main>
  );
}
