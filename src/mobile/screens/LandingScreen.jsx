import RotatingProducts from '../components/RotatingProducts.jsx';

export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna }) {
  return <main className="ayna-fresh-welcome ayna-cover ayna-cabinet-cover">
    <header className="ayna-cover-top"><span className="ayna-fresh-wordmark">ayna</span><button type="button" onClick={onAlreadyHaveAccount}>Sign in</button></header>
    <section className="ayna-cover-story" aria-labelledby="ayna-cover-title">
      <RotatingProducts />
      <div className="ayna-cover-intro"><h1 id="ayna-cover-title">Health,<br /><em>matched to you.</em></h1><p>Products · care · answers</p></div>
    </section>
    <section className="ayna-cover-actions" aria-label="Get started">
      <button className="ayna-cover-start" type="button" onClick={onStartQuiz}><span>Get matched</span><span className="ayna-cover-arrow" aria-hidden="true">→</span></button>
      <div className="ayna-cover-secondary"><button type="button" onClick={onBrowse}>Just browsing</button><button type="button" onClick={onAboutAyna}>About us</button></div>
    </section>
  </main>;
}
