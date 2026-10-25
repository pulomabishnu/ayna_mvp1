import TodayScreen from './TodayScreen.jsx';
import EcosystemScreen from './EcosystemScreen.jsx';
import HomeSwitch from '../components/HomeSwitch.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FinishQuizCard from '../../components/FinishQuizCard.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import '../ayna-home.css';

/**
 * The chat-first Home, kept for Monday's focus group (team sync, Oct 25):
 * shown with ?home=chat or the dev flag (src/mobile/utils/homeVariant.js).
 * The app's centre tab, "ayna" (founder, Oct 24 20:12). Three views under one
 * small switch at the top:
 *   Chat          the guided Ask ayna chat, the home. MobileApp draws it
 *                 (AskAynaModal as the tab's content), over this screen.
 *   Products      her matches and My ecosystem shelves (EcosystemScreen).
 *   My dashboard  the Today content (TodayScreen): the Daily Rundown card for
 *                 replay, decision items, her log, routine, health data,
 *                 More for you.
 * The dashboard stays mounted under the chat (hidden), so the Daily Rundown
 * still opens on its own each morning (autoLaunch.js) whichever view is up.
 */
export default function AynaHomeChatScreen(props) {
  const { homeView = 'chat', onHomeView, hasEcosystem = false, myProducts = [], quizDraft = null, onResumeQuiz, onStartOverQuiz, onStartQuiz, onBrowse, lastQuizAnswers = null } = props;
  const top = <HomeSwitch view={homeView} onChange={onHomeView} />;
  const hasProducts = hasEcosystem || myProducts.length > 0;
  return (
    <div className="ay-home" data-view={homeView}>
      {homeView === 'products' && (
        <div role="tabpanel" aria-label="Products" className="ay-home__view">
          {hasProducts
            ? <EcosystemScreen {...props} onBack={null} homeTop={top} />
            : <div className="ayna-fresh-ecosystem eco-app">
              {top}
              <h1 className="sr-only">Products</h1>
              {quizDraft && onResumeQuiz
                ? <FinishQuizCard progress={quizDraft} onContinue={onResumeQuiz} onStartOver={onStartOverQuiz} />
                : <EmptyState art="spark" title={lastQuizAnswers ? 'No strong matches yet' : 'Your matches live here'} body={lastQuizAnswers ? 'Nothing passed the bar for your goals yet. Explore has everything, with your match on each product.' : 'Create your health profile and ayna shows the products that fit you, each with the reason why.'} actionLabel={lastQuizAnswers ? 'Explore products' : 'Create your health profile'} onAction={lastQuizAnswers ? () => onBrowse?.() : onStartQuiz} secondaryLabel={lastQuizAnswers ? null : 'Explore products'} onSecondary={() => onBrowse?.()} />}
              <LegalFooter />
            </div>}
        </div>
      )}
      <div role="tabpanel" aria-label="My dashboard" className="ay-home__view" hidden={homeView !== 'dashboard'}>
        <TodayScreen {...props} homeTop={top} />
      </div>
    </div>
  );
}
