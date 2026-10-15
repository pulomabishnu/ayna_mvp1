import { useState } from 'react';
import { track } from '../../utils/campaignClient';
import { CheckIcon } from './FeedbackSection';

const STATUS_TEXT = {
  verified: 'verified',
  joined: 'joined, verification incomplete',
  waiting: 'waiting',
};

export default function FriendsSection({ status }) {
  const [note, setNote] = useState('');
  const required = status.friendsRequired || 3;
  const link = status.referralLink;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const rows = [...(status.friends || [])];
  while (rows.length < required) rows.push({ label: `Friend ${rows.length + 1}`, status: 'waiting' });

  const flash = (t) => { setNote(t); window.setTimeout(() => setNote(''), 2400); };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      flash('Link copied');
      track('referral_link_copied', { method: 'copy' });
    } catch {
      flash('Select the link above to copy it');
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: 'ayna', text: 'Join me on ayna, women\'s health products matched to you.', url: link });
      track('referral_link_copied', { method: 'share' });
    } catch { /* dismissed */ }
  };

  return (
    <section className="wyou-card ayfp-section" aria-labelledby="ayfp-friends-title">
      <div className="wyou-card-head">
        <h2 id="ayfp-friends-title">Your friends</h2>
        <span>{(status.friendsJoined || 0) > required ? `${status.friendsJoined} joined` : `${status.friendsJoined || 0} of ${required} joined`}</span>
      </div>
      <p className="wyou-muted ayfp-intro">
        Send your link. A friend counts once they make a <strong>new</strong> ayna account with it and verify their email or phone.
      </p>

      {link ? (
        <div className="ayfp-link-row">
          <label htmlFor="ayfp-ref-link" className="ayfp-sr">Your invite link</label>
          <input id="ayfp-ref-link" type="text" readOnly value={link} onFocus={(e) => e.target.select()} />
          <div className="ayfp-link-actions">
            <button type="button" className="wyou-btn ayfp-btn-sm" onClick={copy}>Copy link</button>
            {canShare && <button type="button" className="wyou-btn is-ghost ayfp-btn-sm" onClick={share}>Share</button>}
          </div>
        </div>
      ) : <p className="wyou-muted">Your link will show up here in a moment.</p>}
      {note && <p className="wyou-note" role="status">{note}</p>}

      <ul className="ayfp-friends" aria-label={`${status.friendsVerified || 0} of ${required} friends verified`}>
        {rows.map((f) => (
          <li key={f.label} className={`is-${f.status}`}>
            <span className="ayfp-friends__dot" aria-hidden="true">{f.status === 'verified' ? <CheckIcon /> : null}</span>
            <span className="ayfp-friends__name">{f.label}</span>
            <span className="ayfp-friends__status">{STATUS_TEXT[f.status] || f.status}</span>
          </li>
        ))}
      </ul>
      {(status.friends || []).length > required && (
        <p className="wyou-muted ayfp-small">More than {required} joined. Only {required} need to verify.</p>
      )}
    </section>
  );
}
