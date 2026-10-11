import RotatingProducts from '../components/RotatingProducts.jsx';
import SlideToStart from '../components/SlideToStart.jsx';
import '../landing.css';

export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna }) {
  return <main className="ay-cover">
    <span className="ay-cover-art ay-cover-stars" aria-hidden="true"><i /><i /><i /><i /><i /></span>
    <header className="ay-cover-top">
      <span className="ay-cover-mark">ayna</span>
      <button type="button" onClick={onAlreadyHaveAccount}>Sign in</button>
    </header>
    <section className="ay-cover-reel" aria-label="What ayna does">
      <div className="ay-cover-widget"><RotatingProducts /></div>
    </section>
    <section className="ay-cover-copy" aria-labelledby="ay-cover-title">
      <h1 id="ay-cover-title">Health,<br />matched to you.</h1>
      <p>Products · care · answers</p>
    </section>
    <section className="ay-cover-actions" aria-label="Get started">
      <SlideToStart onComplete={onStartQuiz} />
      <div><button type="button" onClick={onBrowse}>Just browsing</button><button type="button" onClick={onAboutAyna}>About us</button></div>
    </section>
  </main>;
}
