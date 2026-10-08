export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna }) {
  return (
    <main className="ayna-fresh-welcome">
      <div className="ayna-fresh-welcome-top"><span className="ayna-fresh-wordmark">ayna.</span><button type="button" onClick={onAlreadyHaveAccount}>Sign in</button></div>
      <div className="ayna-fresh-welcome-copy">
        <span className="ayna-fresh-kicker">A BETTER WAY TO FIGURE IT OUT</span>
        <h1>GOOD THINGS<br />FOR <em>YOUR</em><br />BODY.</h1>
      </div>
      <div className="ayna-fresh-playground" aria-hidden="true">
        <span className="ayna-fresh-orbit orbit-one" /><span className="ayna-fresh-orbit orbit-two" />
        <span className="ayna-fresh-sticker sticker-one">real answers</span>
        <span className="ayna-fresh-sticker sticker-two">your way</span>
        <span className="ayna-fresh-dot dot-one" /><span className="ayna-fresh-dot dot-two" />
        <span className="ayna-fresh-character"><i className="eye eye-one" /><i className="eye eye-two" /><i className="smile" /><i className="arm arm-one" /><i className="arm arm-two" /></span>
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
