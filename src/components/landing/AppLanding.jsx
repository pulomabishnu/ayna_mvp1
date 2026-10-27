import SlideToStart from '../ui/SlideToStart.jsx';
import MedicalNote from '../MedicalNote.jsx';
import { ScallopEdge } from '../ui/ay/index.js';
import { Rain, HeroSearch, BrandBar } from './kit.jsx';
import './app-landing.css';

/*
 * The app's landing (founder, Oct 27 10:40-11:36): exactly one screen, never
 * a scroll, calm but still fun. Top: the espresso band (centred wordmark, the
 * faded rain behind, a moderate two-line title with the pink highlighter
 * swipe, one line) ending in the wavy edge. Then the brown and pink bar (the
 * partner names). Then the search, Slide to start and the medical note, all
 * centred, inside the safe areas and above the tab bar.
 *
 * Signed out with nothing on this phone, the Home tab is this screen; the
 * ayna wordmark opens it for everyone. Signed in with a profile, the main
 * action is "Go to your Home". Get my matches goes straight to question 1.
 */
export default function AppLanding({ signedIn = false, hasProfile = false, onStartQuiz, onGoHome, onSearch, onSignIn, onBrowse, onPartners, banner = null }) {
  const home = signedIn && hasProfile && onGoHome;
  const cta = home
    ? { label: 'Go to your Home', slide: 'Slide to go to your Home', go: onGoHome }
    : { label: 'Get my matches', slide: 'Slide to get your matches', go: onStartQuiz };
  return (
    <div id="ay-landing" className="alx">
      <section className="alx__band" aria-labelledby="alx-title">
        <Rain cols={2} onInk className="alx__rain" />
        <div className="alx__top">
          <span className="alx__mark" aria-hidden="true">ayna</span>
          {!signedIn && onSignIn && <button type="button" className="alx__btn" onClick={onSignIn}>Sign in</button>}
        </div>
        <div className="alx__head">
          <div className="alx__copy">
            <h1 id="alx-title" className="alx__title">Find what fits <span><mark>your body.</mark></span></h1>
            <p className="alx__lead">Women&rsquo;s health products matched to you, with the evidence beside each one.</p>
          </div>
        </div>
      </section>
      <ScallopEdge shape="wave" tone="ink" className="alx__edge" />
      <BrandBar onOpen={onPartners || onBrowse} className="alx__bar" />
      <div className="alx__act">
        {banner && <div className="alx__banner">{banner}</div>}
        <HeroSearch onSearch={onSearch} className="alx__search" />
        <SlideToStart className="alx__sts" tour="landing-start" label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="ink" />
        {!signedIn && onBrowse && <button type="button" className="alx__link" onClick={() => onBrowse()}>Explore first</button>}
      </div>
      <MedicalNote className="alx__med" />
    </div>
  );
}
