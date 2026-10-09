export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna }) {
  return (
    <main className="ayna-fresh-welcome ayna-cover">
      <header className="ayna-cover-top">
        <span className="ayna-fresh-wordmark">ayna</span>
        <button type="button" onClick={onAlreadyHaveAccount}>Sign in</button>
      </header>

      <section className="ayna-cover-story" aria-labelledby="ayna-cover-title">
        <div className="ayna-cover-intro">
          <span className="ayna-cover-eyebrow">HEALTH, WITH CONTEXT</span>
          <h1 id="ayna-cover-title">Picked for<br /><em>your body.</em><br />With the why.</h1>
          <p>Products. Research. Real experiences.</p>
        </div>
        <div className="ayna-cover-metrics" aria-label="Ayna at a glance">
          <div className="ayna-cover-metric"><strong>140+</strong><span>studies cited</span></div>
          <div className="ayna-cover-metric"><strong>86</strong><span>picks with sources</span></div>
          <div className="ayna-cover-metric"><strong>0</strong><span>data sold. ever.</span></div>
        </div>
      </section>

      <section className="ayna-cover-actions" aria-label="Get started">
        <button className="ayna-cover-start" type="button" onClick={onStartQuiz}><span>Build my Ecosystem</span><span className="ayna-cover-arrow" aria-hidden="true">→</span></button>
        <button className="ayna-cover-browse" type="button" onClick={onBrowse}><span>I’m just browsing</span><span aria-hidden="true">→</span></button>
        <button className="ayna-cover-about" type="button" onClick={onAboutAyna}>About us <span aria-hidden="true">→</span></button>
      </section>
    </main>
  );
}
