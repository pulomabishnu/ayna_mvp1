import React, { useEffect, useMemo, useState } from 'react';
import './profileProgress.css';
import { getSupabaseClient } from '../utils/supabaseClient';
import { loadPhoneNumberForUser } from '../utils/phoneNumberStore';
import { computeProfileCompletion } from '../utils/profileCompletion';

export function ProgressRing({ percent, size = 64, stroke = 6, label = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, percent || 0));
  return (
    <span className="pp-ring" style={{ width: size, height: size }} role="img" aria-label={`${pct}% complete`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="pp-ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="pp-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {label && <strong style={{ fontSize: Math.round(size * 0.27) }}>{pct}<small>%</small></strong>}
    </span>
  );
}

/** Loads the few signals that live in Supabase (community profile, phone, posts). */
function useCompletionSignals(user) {
  const [signals, setSignals] = useState({ userId: null, communityProfile: null, phoneVerified: false, contributions: 0 });
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!user?.id || !supabase) return undefined;
    let alive = true;
    Promise.all([
      supabase.from('community_profiles').select('username, avatar_url, bio, public_interests').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => data || null, () => null),
      loadPhoneNumberForUser(supabase, user.id).then((row) => Boolean(row?.is_verified), () => false),
      supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id)
        .then(({ count }) => count || 0, () => 0),
    ]).then(([communityProfile, phoneVerified, contributions]) => {
      if (alive) setSignals({ userId: user.id, communityProfile, phoneVerified, contributions });
    });
    return () => { alive = false; };
  }, [user?.id]);
  return signals.userId === user?.id ? signals : { communityProfile: null, phoneVerified: false, contributions: 0 };
}

/**
 * "your profile is N% complete" with a checklist of next steps.
 *   variant="card"  full checklist (My Ecosystem)
 *   variant="strip" ring + the single next step; hidden at 100%
 *   variant="hero"  same, styled for the dark home hero
 */
export default function ProfileProgress({ user, quizDone, ecosystemCount = 0, variant = 'card', onAction }) {
  const signals = useCompletionSignals(user);
  const { percent, steps, next } = useMemo(() => computeProfileCompletion({
    signedIn: Boolean(user),
    quizDone,
    ecosystemCount,
    ...signals,
  }), [user, quizDone, ecosystemCount, signals]);

  if (variant === 'strip' || variant === 'hero') {
    if (!next) return null;
    return (
      <section className={`pp-strip${variant === 'hero' ? ' pp-strip--hero' : ''}`} aria-label="Profile progress">
        <ProgressRing percent={percent} size={56} stroke={5} />
        <div className="pp-strip__text">
          <span className="pp-eyebrow">your profile is {percent}% set up</span>
          <strong>{next.label}</strong>
          <small>{next.hint}</small>
        </div>
        <button type="button" className="pp-strip__cta" onClick={() => onAction?.(next.key)}>
          {next.key === 'account' ? 'sign up' : 'go'}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </section>
    );
  }

  return (
    <section className="pp-panel" aria-label="Profile progress">
      <div className="pp-panel__head">
        <ProgressRing percent={percent} size={68} stroke={6} />
        <div>
          <span className="pp-eyebrow">your profile</span>
          <h3>{percent === 100 ? 'all set ✦' : `${percent}% complete`}</h3>
          <small>{percent === 100 ? 'your matches are as sharp as they get.' : 'each step makes your matches sharper.'}</small>
        </div>
      </div>
      <ul className="pp-steps">
        {steps.map((s) => (
          <li key={s.key}>
            <button type="button" className={s.done ? 'is-done' : ''} aria-disabled={s.done} onClick={() => { if (!s.done) onAction?.(s.key); }}>
              <span className="pp-check" aria-hidden="true">
                {s.done ? <svg viewBox="0 0 24 24"><path d="m6 12.5 4 4 8-9" /></svg> : s.progress > 0 ? <i style={{ '--pp-part': s.progress }} /> : null}
              </span>
              <span className="pp-steps__text">
                <span>{s.label}</span>
                {!s.done && <small>{s.hint}</small>}
              </span>
              {!s.done && <em>+{Math.round(s.weight * (1 - s.progress))}%</em>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
