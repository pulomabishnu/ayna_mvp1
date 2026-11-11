import ReadyReveal from '../../components/onboarding/ReadyReveal.jsx';

// App: the first personalized reveal, after the quiz. Her linked health data counts in it.
export default function ReadyScreen({ planAnswers, authUser, onSeeMyToday, onWatchWrapped, onReadyCreateAccount, onReadyBack, onMakeMorePersonal, onReadyConnect, readyConnected = false, readyMatchOpts, onAskAyna, onReadyExplore }) {
  return <ReadyReveal variant="app" answers={planAnswers} signedIn={Boolean(authUser)} onSeeToday={onSeeMyToday} onWatchWrapped={onWatchWrapped} onCreateAccount={onReadyCreateAccount} onBack={onReadyBack} onMorePersonal={onMakeMorePersonal} onConnect={onReadyConnect} connected={readyConnected} matchOpts={readyMatchOpts} onExplore={onReadyExplore} onLearn={onAskAyna ? (topic) => onAskAyna({ question: `Teach me the basics of ${topic.toLowerCase()}. What should I know?` }) : null} />;
}
