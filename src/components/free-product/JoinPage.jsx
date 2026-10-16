import { useEffect } from 'react';
import { captureReferralFromUrl } from '../../utils/badges';
import '../WebYou.css';
import './free-product.css';

/**
 * /join?ref=CODE: where a friend's invite link lands. The code is saved
 * (first link wins, 30 days) and attached when this person makes a new
 * account. On the website accounts are made at the end of the quiz, so that's
 * where this sends people. Never reveals who sent the link.
 */
export default function JoinPage({ user, onStartQuiz, onLogIn, onGoHome }) {
  useEffect(() => { captureReferralFromUrl(); }, []);

  if (user && !user.is_anonymous) {
    return (
      <section className="wyou ayfp ayfp-join">
        <div className="wyou-card ayfp-error">
          <h1>you're already on ayna</h1>
          <p className="wyou-muted">Invites count for new accounts, so there's nothing to do here.</p>
          <button type="button" className="wyou-btn" onClick={onGoHome}>back to ayna</button>
        </div>
      </section>
    );
  }

  return (
    <section className="wyou ayfp ayfp-join" aria-labelledby="ayfp-join-title">
      <header className="wyou-hero">
        <div className="ayfp-hero__copy">
          <h1 id="ayfp-join-title">a friend thinks you'd like ayna.</h1>
          <p>Women's health products matched to you, backed by real research and real people. Take the quiz to build your ecosystem and make your account.</p>
        </div>
        <span className="wyou-shapes" aria-hidden="true"><i /><i /><i /></span>
      </header>
      <div className="ayfp-cta-row">
        <button type="button" className="wyou-btn" onClick={onStartQuiz}>take the quiz</button>
        <button type="button" className="wyou-btn is-ghost" onClick={onLogIn}>I already have an account</button>
      </div>
      <p className="ayfp-fine">When you verify your new account, your friend gets credit toward a free product. We never show them your name or email.</p>
    </section>
  );
}
