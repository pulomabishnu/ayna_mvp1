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
    <section className="ay-cover-reel" aria-label="What ayna does">
      <div className="ay-cover-stack">
        <span className="ay-cover-behind is-pink" aria-hidden="true" />
        <span className="ay-cover-behind is-butter" aria-hidden="true" />
        <div className="ay-cover-card"><RotatingProducts /></div>
        <svg className="ay-cover-badge" viewBox="0 0 120 120" aria-hidden="true">
          <defs><path id="ay-badge-ring" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" /></defs>
          <circle cx="60" cy="60" r="58" />
          <text><textPath href="#ay-badge-ring" textLength="272" lengthAdjust="spacing">MADE FOR YOUR BODY • MATCHED TO YOU •</textPath></text>
          <path className="ay-cover-badge-star" d="M60 40C61.7 53 67 58.3 80 60 67 61.7 61.7 67 60 80 58.3 67 53 61.7 40 60 53 58.3 58.3 53 60 40Z" />
        </svg>
      </div>
    </section>
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
