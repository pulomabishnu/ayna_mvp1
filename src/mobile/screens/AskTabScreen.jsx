import MobileHeader from '../components/MobileHeader.jsx';
import LegalFooter from '../components/LegalFooter.jsx';
import '../explore.css';

/**
 * The Ask ayna tab. Signed in, the Ask ayna conversation itself fills this
 * tab (MobileApp mounts AskAynaModal as the tab's content). Signed out, a
 * welcoming state that says what Ask does and how to start, never a wall.
 */
export default function AskTabScreen({ authUser = null, lastQuizAnswers = null, quizAnswers = null, onStartQuiz, onAlreadyHaveAccount }) {
  if (authUser) return <div className="ax ay-ask-tab-host" aria-hidden="true" />;
  const hasProfile = Boolean(lastQuizAnswers || quizAnswers);
  return <div className="ax ay-ask-tab">
    <MobileHeader />
    <header className="ax-top"><h1 className="ax-title">Ask ayna</h1></header>
    <section className="ax-sec" aria-labelledby="ay-ask-tab-h">
      <div className="ax-invite">
        <h3 id="ay-ask-tab-h">Ask about your health, products and the evidence</h3>
        <p>ayna answers from your health profile, the products you use and checked sources, and tells you why. {hasProfile ? 'Sign in to keep your profile and start asking.' : 'Create your health profile to start asking.'}</p>
        {!hasProfile && onStartQuiz && <button type="button" className="ax-invite__go" onClick={onStartQuiz}>Create your health profile</button>}
      </div>
      {onAlreadyHaveAccount && <p className="ax-note" style={{ marginTop: 14 }}>Already have an account? <button type="button" className="ax-all" onClick={onAlreadyHaveAccount}>Sign in</button></p>}
    </section>
    <LegalFooter />
  </div>;
}
