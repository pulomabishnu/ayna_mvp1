import RotatingProducts from '../components/RotatingProducts.jsx';
import SlideToStart from '../components/SlideToStart.jsx';

// Welcome cover. Same visual language as the intake and Wrapped: one colour
// field, an ink-outlined "sticker" card for the feature reel, one headline,
// one primary action.
export default function LandingScreen({ onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna }) {
  return <main className="ay-cover">
    <span className="ay-cover-art" aria-hidden="true"><i /><i /><i /></span>
    <header className="ay-cover-top">
      <span className="ay-cover-mark">ayna</span>
      <button type="button" onClick={onAlreadyHaveAccount}>Sign in</button>
    </header>
    <section className="ay-cover-reel" aria-label="What ayna does"><div className="ay-cover-card"><RotatingProducts /></div></section>
    <section className="ay-cover-copy" aria-labelledby="ay-cover-title">
      <h1 id="ay-cover-title">Health,<br /><em>matched to you.</em></h1>
      <p>Answer a few questions. Get products picked for your body.</p>
    </section>
    <section className="ay-cover-actions" aria-label="Get started">
      <SlideToStart onComplete={onStartQuiz} />
      <div><button type="button" onClick={onBrowse}>Just browsing</button><button type="button" onClick={onAboutAyna}>About us</button></div>
    </section>
  </main>;
}
