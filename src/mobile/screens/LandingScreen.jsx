import LandingShowcase from '../../components/landing/LandingShowcase.jsx';
import FinishQuizCard from '../../components/FinishQuizCard.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import '../../styles/onboarding.css';

// The app's landing (founder, Oct 27 01:10-01:18): signed out, the Home tab
// IS this page, inside the app shell with the tab bar; the ayna wordmark opens
// it for everyone. The same page as the website's / (LandingShowcase): the
// raining collage, search, Slide to start, then every feature with a Sample
// state. Signed in with a profile, the main action is "Go to your Home".
// Get my matches still goes straight to question 1, no account first.

export default function LandingScreen({
  authUser = null, hasEcosystem = false, lastQuizAnswers = null, articles = [],
  onStartQuiz, onBrowse, onAlreadyHaveAccount, onAboutAyna, onOpenProduct, onOpenArticle, onGoCommunity,
  onExploreSection, onAskAyna, onGoToday, quizDraft = null, onResumeQuiz, onStartOverQuiz,
}) {
  const signedIn = Boolean(authUser);
  const hasProfile = Boolean(hasEcosystem || lastQuizAnswers);
  const toHomeOrQuiz = () => (hasProfile ? onGoToday?.() : onStartQuiz?.());
  const FEATURE = {
    data: toHomeOrQuiz,
    rundown: toHomeOrQuiz,
    routine: toHomeOrQuiz,
    matches: () => onBrowse?.(),
    compare: () => onBrowse?.(),
    ask: () => onAskAyna?.(),
    community: () => onGoCommunity?.(),
    library: () => onExploreSection?.('resources'),
    services: () => onExploreSection?.('services'),
  };
  return (
    <main className="ay-landing-app" aria-label="ayna">
      <LandingShowcase
        variant="app"
        signedIn={signedIn}
        hasProfile={hasProfile}
        onStartQuiz={onStartQuiz}
        onGoHome={onGoToday}
        onSearch={(q) => onBrowse?.(String(q || '').trim())}
        onSignIn={onAlreadyHaveAccount}
        onBrowse={() => onBrowse?.()}
        onOpenProduct={onOpenProduct}
        onFeature={(k) => FEATURE[k]?.()}
        onViewArticle={(id) => { const a = articles.find((x) => x.id === id); if (a) onOpenArticle?.(a); else onExploreSection?.('resources'); }}
        onViewCommunity={() => onGoCommunity?.()}
        onViewAbout={onAboutAyna}
        banner={!hasProfile && quizDraft && onResumeQuiz ? <FinishQuizCard progress={quizDraft} onContinue={onResumeQuiz} onStartOver={onStartOverQuiz} /> : null}
        footer={<LegalFooter />}
      />
    </main>
  );
}
