import SlideToStart from '../ui/SlideToStart.jsx';
import MedicalNote from '../MedicalNote.jsx';
import { ScallopEdge } from '../ui/ay/index.js';
import { Rain } from './kit.jsx';
import './app-landing.css';
import { trackLandingCta } from '../../utils/funnelEvents.js';

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
export default function AppLanding({ signedIn = false, hasProfile = false, onStartQuiz, onGoHome, onSignIn, onBrowse, banner = null, quizDraft = null, onResumeQuiz = null, onStartQuizOver = null }) {
  const home = signedIn && hasProfile && onGoHome;
  // Founder, Nov 9: same words as the website ("Sign up free"), no search bar, and a quiz
  // already started is this one button ("Finish your free quiz"), never a second box.
  const draft = !home && quizDraft && onResumeQuiz && (quizDraft.requiredDone || (quizDraft.index || 1) > 1) ? quizDraft : null;
  const cta = home
    ? { label: 'Go to your Home', slide: 'Go to your Home', go: onGoHome }
    : draft
      ? { label: 'Finish your free quiz', slide: 'Finish your free quiz', go: onResumeQuiz }
      // Nov 12 (founder: "you decide, research it"): the button says what happens next (it starts the
      // quiz, it doesn't ask for an account), and the line under it removes the fear of a sign-up wall.
      : { label: 'Take the 1-minute quiz', slide: 'Take the 1-minute quiz', go: () => { trackLandingCta('sign_up_free', 'app'); onStartQuiz?.(); } };
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
            <h1 id="alx-title" className="alx__title">Women’s health products, <span>matched to you.</span></h1>
            <p className="alx__one">Answer a few questions. See what fits your body, and why.</p>
          </div>
        </div>
      </section>
      <ScallopEdge shape="wave" tone="ink" className="alx__edge" />
      <div className="alx__act">
        {banner && <div className="alx__banner">{banner}</div>}
        <SlideToStart className="alx__sts" tour="landing-start" size="lg" hint={null} label={cta.slide} actionLabel={cta.label} onComplete={cta.go} tone="ink" />
        {!home && !draft && <p className="alx__free">Free. See your top matches before you sign up.</p>}
        {draft && <p className="alx__draft">{draft.requiredDone ? 'Your answers are saved.' : `Question ${draft.index} of ${draft.total}, saved.`}{onStartQuizOver && <> <button type="button" className="alx__draft-over" onClick={onStartQuizOver}>Start over</button></>}</p>}
        {!signedIn && onBrowse && <button type="button" className="alx__link" onClick={() => onBrowse()}>Explore first</button>}
      </div>
      <MedicalNote className="alx__med" />
    </div>
  );
}
