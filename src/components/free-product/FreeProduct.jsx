import { useCallback, useEffect, useRef, useState } from 'react';
import ViewSkeleton from '../skeletons/ViewSkeleton';
import { getSupabaseClient } from '../../utils/supabaseClient';
import { loadCampaignStatus, track, trackEmailArrival } from '../../utils/campaignClient';
import { remainingLabel } from '../../utils/campaignRules';
import FeedbackSection, { CheckIcon } from './FeedbackSection';
import FriendsSection from './FriendsSection';
import RewardStage from './RewardStage';
import ClaimedView from './ClaimedView';
import '../WebYou.css';
import '../new-account-start.css';
import './free-product.css';

/**
 * /free-product: 3 answers + 3 verified friends = one free product.
 * Everything shown here comes from /api/campaign; the page never decides
 * eligibility itself.
 */

function Equation() {
  return (
    <ol className="ayfp-eq" aria-label="How it works">
      <li className="tone-butter"><strong>3 real answers</strong><span>A couple of honest sentences each</span></li>
      <li className="ayfp-eq__op" aria-hidden="true">+</li>
      <li className="tone-pink"><strong>3 friends join</strong><span>New accounts, verified</span></li>
      <li className="ayfp-eq__op" aria-hidden="true">=</li>
      <li className="tone-peri"><strong>a free product</strong><span>You pick it from our shelf</span></li>
    </ol>
  );
}

function FinePrint() {
  return (
    <p className="ayfp-fine">
      One free product per person. Products and quantities are limited and can run out while you're still earning.
      Your own account needs a verified email or phone. Friends count only for new accounts made with your link and verified.
      Once you claim a product, that's your pick. We may end the campaign at any time; anything you've already claimed stays yours.
    </p>
  );
}

function Requirement({ tone, title, value, done, detail }) {
  return (
    <li className={`ayfp-req tone-${tone}${done ? ' is-done' : ''}`}>
      <span className="ayfp-req__icon" aria-hidden="true">{done ? <CheckIcon /> : null}</span>
      <h2>{title}</h2>
      <p className="ayfp-req__value">{value}</p>
      {detail && <p className="ayfp-req__detail">{detail}</p>}
      <span className="ayfp-sr">{done ? 'Complete' : 'Not complete yet'}</span>
    </li>
  );
}

function VerifyHelp({ user }) {
  const [msg, setMsg] = useState('');
  if (!user?.email) return null;
  const resend = async () => {
    try {
      const { error } = await getSupabaseClient().auth.resend({ type: 'signup', email: user.email, options: { emailRedirectTo: `${window.location.origin}/confirmed` } });
      if (error) throw error;
      setMsg(`Sent. Check ${user.email} (and spam), then come back here.`);
    } catch { setMsg("Couldn't send right now. Try again in a minute."); }
  };
  return (
    <div className="ayfp-verify">
      <button type="button" className="ayfp-link" onClick={resend}>Resend my verification email</button>
      {msg && <span role="status">{msg}</span>}
    </div>
  );
}

export default function FreeProduct({ user, authLoading, onLogIn, onStartQuiz, onGoHome }) {
  const [status, setStatus] = useState(null);
  const [loadState, setLoadState] = useState('idle'); // idle | loading | ok | error
  const [stage, setStage] = useState('progress'); // progress | reward
  const [justClaimed, setJustClaimed] = useState(false);
  const viewed = useRef(false);
  const eligibleTracked = useRef(false);

  const apply = useCallback((r, quiet) => {
    if (r.error) {
      // Keep whatever we already showed; only a first load falls back to the error card.
      setLoadState((s) => (quiet && s === 'ok' ? 'ok' : 'error'));
      return;
    }
    setStatus(r);
    setLoadState('ok');
  }, []);
  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoadState('loading');
    apply(await loadCampaignStatus(), quiet);
  }, [apply]);

  useEffect(() => { trackEmailArrival(); }, []);
  // First load. Until it answers, a signed-in visitor sees the skeleton
  // (loadState 'idle'), never a wrong "not verified / 0 of 3" flash.
  const userId = user && !user.is_anonymous ? user.id : null;
  useEffect(() => {
    if (authLoading || !userId) return undefined;
    let live = true;
    loadCampaignStatus().then((r) => { if (live) apply(r, false); });
    return () => { live = false; };
  }, [userId, authLoading, apply]);

  // Friends verify elsewhere: refresh when she comes back to the tab.
  useEffect(() => {
    if (!user || stage !== 'progress') return undefined;
    const onVis = () => { if (document.visibilityState === 'visible') load({ quiet: true }); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [user, stage, load]);

  useEffect(() => {
    if (viewed.current || authLoading) return;
    if (!user || loadState === 'ok') {
      viewed.current = true;
      track('campaign_page_viewed', { signed_in: Boolean(user), claimed: Boolean(status?.claim), eligible: Boolean(status?.eligible) });
    }
  }, [user, authLoading, loadState, status]);

  useEffect(() => {
    if (status?.eligible && !eligibleTracked.current) {
      eligibleTracked.current = true;
      try {
        const k = `ayna_fp_eligible_${user?.id}`;
        if (!localStorage.getItem(k)) { localStorage.setItem(k, '1'); track('campaign_eligible'); }
      } catch { track('campaign_eligible'); }
    }
  }, [status?.eligible, user?.id]);

  /* ------------------------------ states ------------------------------ */

  if (authLoading || loadState === 'loading' || (user && loadState === 'idle')) {
    return <section className="wyou ayfp"><ViewSkeleton label="Loading your free product progress" lines={2} cards={3} onRetry={() => load()} /></section>;
  }

  if (!user || user.is_anonymous) {
    return (
      <section className="wyou ayfp" aria-labelledby="ayfp-title">
        <header className="wyou-hero ayfp-hero">
          <div className="ayfp-hero__copy">
            <h1 id="ayfp-title">give us your thoughts. get something on us.</h1>
            <p>Sign in to see your progress toward a free product.</p>
          </div>
          <span className="wyou-shapes" aria-hidden="true"><i /><i /><i /></span>
        </header>
        <Equation />
        <div className="ayfp-cta-row">
          <button type="button" className="wyou-btn" onClick={onLogIn}>log in</button>
          <button type="button" className="wyou-btn is-ghost" onClick={onStartQuiz}>new here? take the quiz to make an account</button>
        </div>
        <FinePrint />
      </section>
    );
  }

  if (loadState === 'error' || !status) {
    return (
      <section className="wyou ayfp">
        <div className="wyou-card ayfp-error" role="alert">
          <h1>couldn't load your progress</h1>
          <p className="wyou-muted">Nothing is lost. Your answers and friends are saved on our side.</p>
          <button type="button" className="wyou-btn" onClick={() => load()}>try again</button>
        </div>
      </section>
    );
  }

  if (status.claim) {
    return <ClaimedView claim={status.claim} userEmail={user.email} justClaimed={justClaimed} onStatus={(next) => next && setStatus(next)} />;
  }

  if (!status.campaign || !status.campaign.open) {
    return (
      <section className="wyou ayfp">
        <div className="wyou-card ayfp-error">
          <h1>{status.campaign ? 'this one has wrapped up' : 'nothing running right now'}</h1>
          <p className="wyou-muted">The free product campaign isn't open at the moment. Thanks for being part of ayna.</p>
          <button type="button" className="wyou-btn is-ghost" onClick={onGoHome}>back to ayna</button>
        </div>
      </section>
    );
  }

  if (stage === 'reward' && status.eligible) {
    return (
      <RewardStage
        status={status}
        onBack={() => { setStage('progress'); load({ quiet: true }); }}
        onStatusRefresh={() => load({ quiet: true })}
        onClaimed={(claim) => {
          setJustClaimed(true);
          setStage('progress');
          setStatus((s) => ({ ...s, eligible: false, claim: claim || s.claim }));
          load({ quiet: true });
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  /* ------------------------------ progress ------------------------------ */
  const required = status.friendsRequired || 3;
  const fb = status.feedbackDone?.length || 0;
  const fr = Math.min(required, status.friendsVerified || 0);
  const label = remainingLabel(status);
  const allDone = status.verified && fb >= 3 && fr >= required;

  return (
    <section className="wyou ayfp" aria-labelledby="ayfp-title">
      <header className="wyou-hero ayfp-hero">
        <div className="ayfp-hero__copy">
          <h1 id="ayfp-title">your free product progress</h1>
          <p>{status.eligible ? 'your free product is unlocked.' : fb + fr > 0 ? "you're on your way." : '3 real answers + 3 friends who join = a free product you pick.'}</p>
        </div>
        <div className="ayfp-hero__cta">
          {status.eligible ? (
            <button type="button" className="wyou-btn ayfp-main-cta is-ready" onClick={() => { setStage('reward'); window.scrollTo(0, 0); }}>
              {label}
            </button>
          ) : (
            <p className="ayfp-remaining" role="status">{label}</p>
          )}
          {status.eligible && !status.inventoryAvailable && <small>The shelf is empty for now. You keep your spot.</small>}
        </div>
        <span className="wyou-shapes" aria-hidden="true"><i /><i /><i /></span>
      </header>

      <ul className="ayfp-reqs">
        <Requirement
          tone="butter"
          title="Your account"
          value={status.verified ? 'Verified' : 'Not verified'}
          done={status.verified}
          detail={status.verified ? null : 'Confirm your email or phone so your progress counts.'}
        />
        <Requirement tone="pink" title="Your feedback" value={`${fb}/3 completed`} done={fb >= 3} />
        <Requirement tone="peri" title="Your referrals" value={`${fr}/${required} verified friends`} done={fr >= required}
          detail={status.friendsJoined > fr ? `${status.friendsJoined - fr} joined, waiting on verification` : null} />
      </ul>
      {!status.verified && <VerifyHelp user={user} />}
      {allDone && !status.eligible && <p className="wyou-note" role="status">Everything's done. Refresh in a moment if the button hasn't unlocked yet.</p>}

      <FeedbackSection status={status} onStatus={(next) => next && setStatus(next)} />
      <FriendsSection status={status} />
      <FinePrint />
    </section>
  );
}
