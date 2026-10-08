export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna }) {
  return (
    <main className="ayna-editorial-welcome">
      <div className="ayna-editorial-welcome-photo">
        <img src="/landing-bg.png" alt="A person stretching in warm afternoon light" />
        <div className="ayna-editorial-welcome-top">
          <span className="ayna-editorial-wordmark">ayna</span>
          <button type="button" onClick={onAlreadyHaveAccount}>Log in</button>
        </div>
        <p className="ayna-editorial-photo-caption">A little more in tune with you.</p>
      </div>
      <div className="ayna-editorial-welcome-content">
        <p className="ayna-editorial-kicker">Wellness, your way</p>
        <h1>Find what <em>feels right.</em></h1>
        <p className="ayna-editorial-intro">Health products picked with your needs in mind. Real research and real experiences, all in one place.</p>
        <button type="button" className="ayna-editorial-primary" onClick={onStartQuiz}>Build my Ecosystem <span aria-hidden="true">↗</span></button>
        <button type="button" className="ayna-editorial-secondary" onClick={onBrowse}>I’m just browsing</button>
        <div className="ayna-editorial-welcome-links">
          <button type="button" onClick={onAlreadyHaveAccount}>I already have an account</button>
          <button type="button" onClick={onAboutAyna}>About us</button>
        </div>
      </div>
    </main>
  );
}
