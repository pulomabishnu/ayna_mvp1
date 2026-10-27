import SlideToStart from '../ui/SlideToStart.jsx';
import MedicalNote from '../MedicalNote.jsx';
import { Rain, HeroSearch } from './kit.jsx';
import './app-landing.css';

/*
 * The app's landing (founder, Oct 27 10:40: "the landing page on the app
 * shouldnt let u scroll down"): exactly one screen, never a scroll. The
 * raining cut-outs fill whatever height is left; the logo, headline, search,
 * Slide to start and the medical note always fit (SE 375x667 up to Pro Max),
 * inside the safe areas and above the tab bar.
 *
 * Signed out with nothing on this phone, the Home tab is this screen; the
 * ayna wordmark opens it for everyone. Signed in with a profile, the main
 * action is "Go to your Home". Get my matches goes straight to question 1.
 */
export default function AppLanding({ signedIn = false, hasProfile = false, onStartQuiz, onGoHome, onSearch, onSignIn, onBrowse, banner = null }) {
  const home = signedIn && hasProfile && onGoHome;
  const cta = home
    ? { label: 'Go to your Home', slide: 'Slide to go to your Home', go: onGoHome }
    : { label: 'Get my matches', slide: 'Slide to get your matches', go: onStartQuiz };
  return (
    <div id="ay-landing" className="alx">
      <div className="alx__top">
        <span className="alx__mark" aria-hidden="true">ayna</span>
        {!signedIn && onSignIn && <button type="button" className="alx__btn" onClick={onSignIn}>Sign in</button>}
      </div>
      <Rain cols={3} className="alx__rain" />
      <section className="alx__center" aria-labelledby="alx-title">
        <h1 id="alx-title" className="alx__title">Find what fits <span>your body.</span></h1>
        <p className="alx__lead">Women&rsquo;s health products matched to you, with the evidence beside each one.</p>
        {banner && <div className="alx__banner">{banner}</div>}
        <HeroSearch onSearch={onSearch} className="alx__search" />
        <SlideToStart className="alx__sts" tour="landing-start" label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="ink" />
        {!signedIn && onBrowse && <button type="button" className="alx__link" onClick={() => onBrowse()}>Explore first</button>}
      </section>
      <MedicalNote className="alx__med" />
    </div>
  );
}
