export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna }) {
  return (
    <main className="ayna-fresh-welcome">
      <div className="ayna-fresh-welcome-top"><span className="ayna-fresh-wordmark">ayna.</span><button type="button" onClick={onAlreadyHaveAccount}>Sign in</button></div>
      <div className="ayna-fresh-welcome-copy">
        <span className="ayna-fresh-kicker">A BETTER WAY TO FIGURE IT OUT</span>
        <h1>GOOD THINGS<br />FOR <em>YOUR</em><br />BODY.</h1>
      </div>
      <div className="ayna-fresh-playground" aria-label="The Ayna team and what shapes your matches">
        <div className="ayna-fresh-collage-card collage-back" aria-hidden="true">CLINICAL<br />CONTEXT</div>
        <div className="ayna-fresh-collage-card collage-photo"><img src="/team/ayna-founders.jpg" alt="The Ayna team together outdoors" /></div>
        <div className="ayna-fresh-collage-card collage-front" aria-hidden="true">RESEARCH<br />+ REAL LIFE</div>
        <span className="ayna-fresh-collage-orbit orbit-one" aria-hidden="true" /><span className="ayna-fresh-collage-orbit orbit-two" aria-hidden="true" />
      </div>
      <div className="ayna-fresh-welcome-bottom">
        <p>Products, research, and real experiences. All in one place.</p>
        <button className="ayna-fresh-start" type="button" onClick={onStartQuiz}>Build my Ecosystem <span aria-hidden="true">↗</span></button>
        <button className="ayna-fresh-browse" type="button" onClick={onBrowse}>I’m just browsing</button>
        <div className="ayna-fresh-links"><button type="button" onClick={onAlreadyHaveAccount}>I already have an account</button><button type="button" onClick={onAboutAyna}>About us</button></div>
      </div>
    </main>
  );
}
