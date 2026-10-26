import AuthGate from './AuthGate';
import './GatedFeaturePreview.css';

/*
 * Signed out on a page that needs an account (Screenings, Recalls,
 * Appointment prep): the page says what the feature does, with the sign-in
 * panel beside it, instead of the landing page under a modal (onboarding
 * audit #6). Every line below restates what the page itself says; nothing
 * here is a sample of anyone's data.
 */
const FEATURES = {
  screenings: {
    title: 'Recommended screenings',
    lede: 'Care reminders based on your health data and recent check-ins.',
    rows: [
      ['Your monthly check-in', 'Screening and doctor visit tips based on your symptoms and history.'],
      ['Each reminder', 'What it is, why it is suggested for you, and what to do next.'],
      ['Sources', 'Linked public guidance, so you can check it yourself.'],
    ],
    feature: 'screening reminders',
  },
  recalls: {
    title: 'Safety and recall center',
    lede: 'ayna’s safety notes, plus a live FDA recall check on every product page.',
    rows: [
      ['Our safety notes', 'Plain notes on products with a known safety issue: why, and what to do.'],
      ['Your products', 'ayna checks the FDA recall database for a product when you open it.'],
      ['Good to know', 'This is not a complete recall list, so always confirm with the FDA.'],
    ],
    feature: 'recall alerts',
  },
  'doctor-prep': {
    title: 'Appointment prep',
    lede: 'A one-page ayna health summary to bring to your appointment.',
    rows: [
      ['What you told ayna', 'Your answers and recent check-ins, in one place.'],
      ['Products you use', 'Each with its main ingredients, so your clinician can check them.'],
      ['Questions to ask', 'A short list to start the conversation.'],
    ],
    feature: 'appointment prep',
  },
};
FEATURES.tracked = FEATURES.recalls;

export default function GatedFeaturePreview({ view, onStartEcosystem, onAuthenticated, onBeforeOAuthRedirect }) {
  const f = FEATURES[view];
  if (!f) return null;
  return (
    <div className="ay-gate">
      <section className="ay-gate__preview" aria-labelledby="ay-gate-title">
        <h1 id="ay-gate-title" className="ay-gate__title">{f.title}</h1>
        <p className="ay-gate__lede">{f.lede}</p>
        <dl className="ay-gate__rows">
          {f.rows.map(([label, value], i) => (
            <div key={label} className="ay-gate__row">
              <span className="ay-gate__n" aria-hidden="true">{i + 1}</span>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {view === 'doctor-prep' && <p className="ay-gate__fine">ayna gives information only. It is not a medical device.</p>}
      </section>
      <div className="ay-gate__panel">
        <AuthGate embedded context="feature" feature={f.feature} onStartEcosystem={onStartEcosystem} onAuthenticated={onAuthenticated} onBeforeOAuthRedirect={onBeforeOAuthRedirect} />
      </div>
    </div>
  );
}
