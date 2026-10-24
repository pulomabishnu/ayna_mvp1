import ReadyReveal from '../../components/onboarding/ReadyReveal.jsx';

// App: the first personalized reveal, after setup and the health data step.
export default function ReadyScreen({ planAnswers, authUser, onSeeMyToday, onReadyCreateAccount, onReadyBack, onMakeMorePersonal }) {
  return <ReadyReveal variant="app" answers={planAnswers} signedIn={Boolean(authUser)} onSeeToday={onSeeMyToday} onCreateAccount={onReadyCreateAccount} onBack={onReadyBack} onMorePersonal={onMakeMorePersonal} />;
}
