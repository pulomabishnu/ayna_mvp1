import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import {
  computeBadges, ecosystemCompletion, hasAppSignIn, inviteLinkFor, loadHasPosted, loadReferralStats,
  installReferralCapture,
} from '../utils/badges';
import './badges-panel.css';

const ICONS = {
  app: <><rect x="7" y="3.5" width="10" height="17" rx="2.5" /><path d="M10.5 17.5h3" /></>,
  ecosystem: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.2" /></>,
  post: <path d="M5 5.5h14v10H10l-5 3.5V5.5Z" />,
  friends: <><circle cx="9" cy="9" r="3" /><circle cx="16.5" cy="10" r="2.4" /><path d="M3.5 19c.6-3.1 2.8-5 5.5-5s4.9 1.9 5.5 5M14.5 15.2c.6-.3 1.3-.5 2-.5 2.1 0 3.6 1.5 4 4.3" /></>,
};
const LOCK = <><rect x="6.5" y="11" width="11" height="8" rx="2" /><path d="M9 11V8.5a3 3 0 0 1 6 0V11" /></>;

/** Loads the real signals behind the four badges. Everything degrades to "locked". */
function useBadges({ userId, myProducts, quizAnswers, matchOpts, inApp }) {
  const [user, setUser] = useState(null);
  const [hasPosted, setHasPosted] = useState(null);
  const [referrals, setReferrals] = useState(null);
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) return undefined;
    installReferralCapture(supabase);
    let cancelled = false;
    supabase.auth?.getUser?.().then(({ data }) => { if (!cancelled) setUser(data?.user || null); }).catch(() => {});
    loadHasPosted(supabase, userId).then((v) => { if (!cancelled) setHasPosted(v); });
    loadReferralStats(supabase).then((v) => { if (!cancelled) setReferrals(v); });
    return () => { cancelled = true; };
  }, [userId]);
  const eco = useMemo(() => ecosystemCompletion(myProducts, quizAnswers, matchOpts), [myProducts, quizAnswers, matchOpts]);
  const badges = computeBadges({ usedApp: inApp || hasAppSignIn(user), eco, hasPosted, referrals });
  return { badges, inviteLink: inviteLinkFor(userId) };
}

export default function BadgesPanel({ userId, myProducts, quizAnswers, matchOpts, variant = 'app' }) {
  const { badges: all, inviteLink } = useBadges({ userId, myProducts, quizAnswers, matchOpts, inApp: variant === 'app' });
  // On the website there is no store link to send her to, so "Got the app"
  // only shows once it's earned (it shouldn't reward leaving the site).
  const badges = variant === 'web' ? all.filter((b) => b.key !== 'app' || b.earned) : all;
  const [copied, setCopied] = useState(false);
  if (!userId) return null;
  const earned = badges.filter((b) => b.earned).length;
  const copy = async () => {
    if (!inviteLink) return;
    try {
      if (navigator.share && variant === 'app') await navigator.share({ title: 'ayna', url: inviteLink });
      else await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* dismissed */ }
  };
  return (
    <section className={`ay-badges2 is-${variant}`} aria-labelledby={`ay-badges2-title-${variant}`}>
      <div className="ay-badges2__head">
        <h2 id={`ay-badges2-title-${variant}`}>Badges</h2>
        <span>{earned} of {badges.length}</span>
      </div>
      <ul className="ay-badges2__list">
        {badges.map((b) => (
          <li key={b.key} className={`ay-badges2__item tone-${b.key}${b.earned ? ' is-earned' : ''}`}>
            <span className="ay-badges2__icon" aria-hidden="true"><svg viewBox="0 0 24 24">{b.earned ? ICONS[b.key] : LOCK}</svg></span>
            <span className="ay-badges2__text">
              <strong>{b.label}</strong>
              <small>{b.earned ? 'Earned' : b.hint}</small>
              {!b.earned && b.progress && (
                <span className="ay-badges2__progress" aria-label={`${b.progress.value} of ${b.progress.goal}`}>
                  <i aria-hidden="true"><b style={{ width: `${(b.progress.value / b.progress.goal) * 100}%` }} /></i>
                  <span aria-hidden="true">{b.progress.value}/{b.progress.goal}{b.key === 'ecosystem' ? ' needs' : ''}</span>
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {inviteLink && (
        <div className="ay-badges2__invite">
          <span>Invite friends with your link</span>
          <button type="button" onClick={copy}>{copied ? 'Copied' : variant === 'app' ? 'Share link' : 'Copy link'}</button>
        </div>
      )}
    </section>
  );
}
