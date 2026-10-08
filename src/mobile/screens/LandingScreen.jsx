export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna }) {
  return (
    <main className="ayna-v2-welcome">
      <section className="ayna-v2-welcome-hero">
        <div className="ayna-v2-welcome-top">
          <span className="ayna-v2-wordmark">ayna<span aria-hidden="true">.</span></span>
          <button type="button" onClick={onAlreadyHaveAccount}>Log in</button>
        </div>
        <p className="ayna-v2-overline">YOUR HEALTH, YOUR RULES</p>
        <h1>Your body.<br /><span>Your call.</span></h1>
        <p className="ayna-v2-welcome-deck">Find products for your body with the research and real talk right beside them.</p>
      </section>
      <figure className="ayna-v2-team-photo">
        <img src="/team/ayna-founders.jpg" alt="The Ayna founding team together outdoors" />
        <figcaption>Made by women who wanted better answers.</figcaption>
      </figure>
      <section className="ayna-v2-welcome-actions">
        <button type="button" className="ayna-v2-primary" onClick={onStartQuiz}>Build my Ecosystem <span aria-hidden="true">↗</span></button>
        <button type="button" className="ayna-v2-outline" onClick={onBrowse}>I’m just browsing</button>
        <div className="ayna-v2-welcome-links">
          <button type="button" onClick={onAlreadyHaveAccount}>I already have an account</button>
          <button type="button" onClick={onAboutAyna}>About us</button>
        </div>
      </section>
    </main>
  );
}
