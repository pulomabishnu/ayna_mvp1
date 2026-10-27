import AppLanding from '../../components/landing/AppLanding.jsx';
import FinishQuizCard from '../../components/FinishQuizCard.jsx';
import '../../styles/onboarding.css';

// The app's landing (founder, Oct 27 10:40): one fixed screen, no scrolling.
// The raining cut-outs, the wordmark, the headline, search, Slide to start
// and the medical note. Signed out, the Home tab IS this screen, inside the
// app shell with the tab bar; the ayna wordmark opens it for everyone. Every
// feature is one tap away in the tabs (and "Explore first"), not below.
// Signed in with a profile, the main action is "Go to your Home".
// Get my matches still goes straight to question 1, no account first.

export default function LandingScreen({
  authUser = null, hasEcosystem = false, lastQuizAnswers = null,
  onStartQuiz, onBrowse, onAlreadyHaveAccount, onGoToday, quizDraft = null, onResumeQuiz, onStartOverQuiz,
}) {
  const signedIn = Boolean(authUser);
  const hasProfile = Boolean(hasEcosystem || lastQuizAnswers);
  return (
    <main className="ay-landing-app" aria-label="ayna">
      <AppLanding
        signedIn={signedIn}
        hasProfile={hasProfile}
        onStartQuiz={onStartQuiz}
        onGoHome={onGoToday}
        onSearch={(q) => onBrowse?.(String(q || '').trim())}
        onSignIn={onAlreadyHaveAccount}
        onBrowse={() => onBrowse?.()}
        banner={!hasProfile && quizDraft && onResumeQuiz ? <FinishQuizCard progress={quizDraft} onContinue={onResumeQuiz} onStartOver={onStartOverQuiz} /> : null}
      />
    </main>
  );
}
