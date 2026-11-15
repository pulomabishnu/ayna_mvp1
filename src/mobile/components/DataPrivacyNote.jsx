/**
 * Founder call, Nov 14 (Puloma; focus group, Caroline 10/26): when she connects her data, the first
 * question is how it is protected. One short line and the two policies, on every Connect your data
 * screen. The sentence repeats only what the legal footer and the policies already say.
 */
const PRIVACY_POLICY_URL = 'https://www.aynahealth.co/privacy-policy';
const CONSUMER_HEALTH_DATA_URL = 'https://www.aynahealth.co/consumer-health-data';

export default function DataPrivacyNote({ className = '' }) {
  return (
    <p className={`ay-dpn ${className}`.trim()}>
      <b>Your data stays yours.</b> We do not sell your personal health information.{' '}
      <a href={PRIVACY_POLICY_URL} target="_blank" rel="noreferrer">Privacy policy</a>
      {' · '}
      <a href={CONSUMER_HEALTH_DATA_URL} target="_blank" rel="noreferrer">Consumer health data notice</a>
    </p>
  );
}
