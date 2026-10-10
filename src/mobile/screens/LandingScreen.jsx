import RotatingProducts from '../components/RotatingProducts.jsx';
import SlideToStart from '../components/SlideToStart.jsx';

export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna }) {
  return <main className="ayna-fresh-welcome ayna-cover ayna-cabinet-cover">
    <header className="ayna-cover-top"><span className="ayna-fresh-wordmark">ayna</span><button type="button" onClick={onAlreadyHaveAccount}>Sign in</button></header>
    <section className="ayna-cover-story" aria-labelledby="ayna-cover-title">
      <RotatingProducts />
      <div className="ayna-cover-intro"><h1 id="ayna-cover-title">Health,<br /><em>matched to you.</em></h1></div>
    </section>
    <section className="ayna-cover-actions" aria-label="Get started">
      <SlideToStart onComplete={onStartQuiz} />
      <div className="ayna-cover-secondary"><button type="button" onClick={onBrowse}>Just browsing</button><button type="button" onClick={onAboutAyna}>About us</button></div>
    </section>
  </main>;
}
