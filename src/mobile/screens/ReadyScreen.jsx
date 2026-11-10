import ReadyReveal from '../../components/onboarding/ReadyReveal.jsx';

// App: the first personalized reveal, after the quiz. Her linked health data counts in it.
export default function ReadyScreen({ planAnswers, authUser, onSeeMyToday, onWatchWrapped, onReadyCreateAccount, onReadyBack, onMakeMorePersonal, onReadyConnect, readyConnected = false, readyMatchOpts }) {
  return <ReadyReveal variant="app" answers={planAnswers} signedIn={Boolean(authUser)} onSeeToday={onSeeMyToday} onWatchWrapped={onWatchWrapped} onCreateAccount={onReadyCreateAccount} onBack={onReadyBack} onMorePersonal={onMakeMorePersonal} onConnect={onReadyConnect} connected={readyConnected} matchOpts={readyMatchOpts} />;
}
