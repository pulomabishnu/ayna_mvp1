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
          <p>Tell us what matters to you. Explore products with the research and real experiences behind each pick.</p>
        </div>
        <div className="ayna-cover-cards" aria-label="What shapes your picks">
          <div className="ayna-cover-card ayna-cover-card-personal">
            <img src="/team/ayna-founders-cover.jpg" alt="The Ayna founders together outdoors" fetchPriority="high" />
            <div><span>01 / YOUR ANSWERS</span><strong>It starts<br />with you.</strong><small>Your health, goals, and preferences lead.</small></div>
          </div>
          <div className="ayna-cover-card ayna-cover-card-evidence">
            <span>02 / THE RESEARCH</span><strong>See the<br />evidence.</strong><small>Know the reason behind a pick.</small>
          </div>
          <div className="ayna-cover-card ayna-cover-card-voices">
            <span>03 / REAL VOICES</span><strong>Hear from<br />real people.</strong><small>Go beyond the product claims.</small>
          </div>
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
