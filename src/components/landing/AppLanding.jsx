import SlideToStart from '../ui/SlideToStart.jsx';
import MedicalNote from '../MedicalNote.jsx';
import { ScallopEdge } from '../ui/ay/index.js';
import { Rain, HeroSearch } from './kit.jsx';
import './app-landing.css';

/*
 * The app's landing (founder, Oct 27 10:40-11:36): exactly one screen, never
 * a scroll, fun but not crowded (13:01). Top: the espresso band (centred
 * wordmark, the falling products and features in a strip of their own, never
 * behind the words, then a big two-line title with "your body." in pink and
 * one line) ending in the wavy edge. Then the search, Slide
 * to start, Explore first and the medical note, evenly spaced and centred,
 * inside the safe areas and above the tab bar. (The brown and pink brand bar
 * is on the website only, founder 12:08.)
 *
 * Signed out with nothing on this phone, the Home tab is this screen; the
 * ayna wordmark opens it for everyone. Signed in with a profile, the main
 * action is "Go to your Home". Get my matches goes straight to question 1.
 */
export default function AppLanding({ signedIn = false, hasProfile = false, onStartQuiz, onGoHome, onSearch, onSignIn, onBrowse, banner = null }) {
  const home = signedIn && hasProfile && onGoHome;
  const cta = home
    ? { label: 'Go to your Home', slide: 'Slide to go to your Home', go: onGoHome }
    : { label: 'Get my matches', slide: 'Slide to find your matches', go: onStartQuiz };
  return (
    <div id="ay-landing" className="alx">
      <section className="alx__band" aria-labelledby="alx-title">
        <div className="alx__top">
          <span className="alx__mark" aria-hidden="true">ayna</span>
          {!signedIn && onSignIn && <button type="button" className="alx__btn" onClick={onSignIn}>Sign in</button>}
        </div>
        <Rain cols={3} onInk className="alx__rain" />
        <div className="alx__head">
          <div className="alx__copy">
            <h1 id="alx-title" className="alx__title">Find what fits <span>your body.</span></h1>
            <p className="alx__one">Your products, routine and health data, finally in one place.</p>
          </div>
        </div>
      </section>
      <ScallopEdge shape="wave" tone="ink" className="alx__edge" />
      <div className="alx__act">
        {banner && <div className="alx__banner">{banner}</div>}
        <SlideToStart className="alx__sts" tour="landing-start" size="lg" hint={null} label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="ink" />
        <HeroSearch onSearch={onSearch} className="alx__search" />
        {!signedIn && onBrowse && <button type="button" className="alx__link" onClick={() => onBrowse()}>Explore first</button>}
      </div>
      <MedicalNote className="alx__med" />
    </div>
  );
}
