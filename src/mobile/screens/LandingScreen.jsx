export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna }) {
  return (
    <main className="ayna-fresh-welcome ayna-cover">
      <header className="ayna-cover-top">
        <span className="ayna-fresh-wordmark">ayna</span>
        <button type="button" onClick={onAlreadyHaveAccount}>Sign in</button>
      </header>

      <section className="ayna-cover-hero" aria-labelledby="ayna-cover-title">
        <div className="ayna-cover-overline"><span>YOUR HEALTH / IN CONTEXT</span><span>01</span></div>
        <div className="ayna-cover-headline">
          <h1 id="ayna-cover-title">Your body.<br />Your context.</h1>
          <p>Discover products and care that fit your life, with the research and real experiences behind each pick.</p>
        </div>
      </section>

      <section className="ayna-cover-proof" aria-label="How Ayna helps you choose">
        <div className="ayna-cover-proof-heading"><span>THE WAY WE PICK</span><span aria-hidden="true">↘</span></div>
        <div className="ayna-cover-proof-row"><strong>01</strong><span>Your answers shape what you see.</span></div>
        <div className="ayna-cover-proof-row"><strong>02</strong><span>Research and clinical context stay visible.</span></div>
        <div className="ayna-cover-proof-row"><strong>03</strong><span>Real experiences help you decide.</span></div>
      </section>

      <section className="ayna-cover-actions" aria-label="Get started">
        <button className="ayna-cover-start" type="button" onClick={onStartQuiz}><span>Build my Ecosystem</span><span className="ayna-cover-arrow" aria-hidden="true">→</span></button>
        <button className="ayna-cover-browse" type="button" onClick={onBrowse}>I’m just browsing <span aria-hidden="true">→</span></button>
        <div className="ayna-cover-links"><button type="button" onClick={onAlreadyHaveAccount}>I already have an account</button><button type="button" onClick={onAboutAyna}>About us</button></div>
        <small className="ayna-cover-privacy">Private by default · recommendations, not diagnoses</small>
      </section>
    </main>
  );
}
