export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna }) {
  return (
    <main className="ayna-fresh-welcome ayna-cover">
      <header className="ayna-cover-top">
        <span className="ayna-fresh-wordmark">ayna</span>
        <button type="button" onClick={onAlreadyHaveAccount}>Sign in</button>
      </header>

      <section className="ayna-cover-story" aria-labelledby="ayna-cover-title">
        <div className="ayna-cover-intro">
          <span className="ayna-cover-eyebrow">A BETTER WAY TO FIND WHAT FITS</span>
          <h1 id="ayna-cover-title">Health picks<br />that <em>get you.</em></h1>
          <p>Find products for your body, backed by research and real experiences.</p>
        </div>
        <div className="ayna-cover-photo">
          <img src="/team/ayna-founders.jpg" alt="The three Ayna founders together outdoors" fetchPriority="high" />
          <span className="ayna-cover-photo-label">Made with care,<br />by real people.</span>
        </div>
      </section>

      <section className="ayna-cover-actions" aria-label="Get started">
        <button className="ayna-cover-start" type="button" onClick={onStartQuiz}><span>Build my Ecosystem</span><span className="ayna-cover-arrow" aria-hidden="true">→</span></button>
        <button className="ayna-cover-browse" type="button" onClick={onBrowse}><span>I’m just browsing</span><span aria-hidden="true">→</span></button>
        <div className="ayna-cover-links"><button type="button" onClick={onAlreadyHaveAccount}>I already have an account</button><button type="button" onClick={onAboutAyna}>About us</button></div>
      </section>
    </main>
  );
}
