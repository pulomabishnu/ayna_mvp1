import React, { useEffect, useMemo, useState } from 'react';
import { useCommunity, relativeTime } from './CommunityContext';
import { CommunityProductPreview, EmptyState, FeedSkeleton, Sheet, UserAvatar } from './CommunityUI';
import * as store from '../../utils/community/communityStore';
import { trackCommunity } from '../../utils/community/analytics';

const USERNAME_RE = /^[a-z0-9_.]{3,24}$/;

function suggestUsername(name) {
  const base = String(name || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '').slice(0, 16);
  return (base.length >= 3 ? base : `ayna${base}`) + Math.floor(100 + Math.random() * 900);
}

/** First visit (or "Edit profile"): the only things that ever become public. */
export function ProfileSetupSheet({ existing, defaultName, onClose, onSaved }) {
  const { supabase, user } = useCommunity();
  const [displayName, setDisplayName] = useState(existing?.display_name || defaultName || '');
  const [username, setUsername] = useState(existing?.username || suggestUsername(defaultName));
  const [bio, setBio] = useState(existing?.bio || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const validUsername = USERNAME_RE.test(username);

  const save = async () => {
    if (!displayName.trim() || !validUsername) return;
    setSaving(true);
    setError('');
    try {
      if (await store.isUsernameTaken(supabase, username, user.id)) {
        setError('That username is taken.');
        return;
      }
      const profile = await store.upsertCommunityProfile(supabase, user.id, { username, displayName, bio, avatarUrl: existing?.avatar_url });
      onSaved(profile);
    } catch (e) {
      setError(store.friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      title={existing ? 'Edit profile' : 'Join the ayna community'}
      onClose={onClose}
      footer={<button type="button" className="btn btn-navy cm-btn-block" disabled={!displayName.trim() || !validUsername || saving} onClick={save}>{existing ? 'Save' : 'Continue'}</button>}
    >
      <div className="cm-form">
        {!existing && (
          <div className="cm-privacy-note">
            <strong>Your health profile stays private.</strong>
            <span>Only your name, username, bio and what you choose to post are visible. You can post anonymously anytime.</span>
          </div>
        )}
        <label className="cm-field">
          <span>Name</span>
          <input className="cm-input" maxLength={50} value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="given-name" />
        </label>
        <label className="cm-field">
          <span>Username</span>
          <div className="cm-input-prefix">
            <span>@</span>
            <input className="cm-input" maxLength={24} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
          </div>
          {!validUsername && <small className="cm-hint">3–24 letters, numbers, _ or .</small>}
        </label>
        <label className="cm-field">
          <span>Bio <em>optional</em></span>
          <textarea className="cm-input" rows={2} maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} />
        </label>
        {error && <p className="cm-error" role="alert">{error}</p>}
      </div>
    </Sheet>
  );
}

const REPORT_REASONS = [
  ['unsafe_advice', 'Unsafe or misleading health advice'],
  ['harassment', 'Harassment or bullying'],
  ['spam', 'Spam or self-promotion'],
  ['privacy', 'Shares someone’s private information'],
  ['self_harm', 'Someone may be at risk'],
  ['misinformation', 'False information'],
  ['other', 'Something else'],
];

export function ReportSheet({ target, onClose }) {
  const { supabase, user, toast } = useCommunity();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await store.fileReport(supabase, user.id, { ...target, reason, details });
      toast('Thanks — we’ll review it.');
      onClose();
    } catch (e) {
      toast(store.friendlyError(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Sheet title="Report" onClose={onClose} footer={<button type="button" className="btn btn-navy cm-btn-block" disabled={!reason || saving} onClick={submit}>Submit report</button>}>
      <div className="cm-form">
        <div className="cm-radio-list" role="radiogroup" aria-label="Reason">
          {REPORT_REASONS.map(([key, label]) => (
            <label key={key} className={reason === key ? 'is-on' : ''}>
              <input type="radio" name="report-reason" value={key} checked={reason === key} onChange={() => setReason(key)} />
              {label}
            </label>
          ))}
        </div>
        {reason === 'self_harm' && (
          <p className="cm-privacy-note">If someone is in immediate danger, call 911. In the US you can call or text 988 to reach the Suicide &amp; Crisis Lifeline.</p>
        )}
        <label className="cm-field">
          <span>Details <em>optional</em></span>
          <textarea className="cm-input" rows={3} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} />
        </label>
      </div>
    </Sheet>
  );
}

/** "Recommend to a friend" — product page and product previews. */
export function RecommendSheet({ productId, onClose }) {
  const { supabase, user, social, productsById, toast } = useCommunity();
  const [friends, setFriends] = useState(null);
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const product = productsById.get(productId);

  useEffect(() => {
    let active = true;
    const ids = store.friendIdsFrom(social.friendships, user.id);
    store.getProfilesByIds(supabase, ids)
      .then((map) => { if (active) setFriends(ids.map((id) => map.get(id)).filter(Boolean)); })
      .catch(() => { if (active) setFriends([]); });
    return () => { active = false; };
  }, [supabase, social.friendships, user.id]);

  const send = async () => {
    setSaving(true);
    try {
      await store.sendRecommendations(supabase, user.id, productId, selected, note);
      trackCommunity('community_product_recommended', { recipient_count: selected.length });
      toast(selected.length === 1 ? 'Sent' : `Sent to ${selected.length} friends`);
      onClose();
    } catch (e) {
      toast(store.friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      title="Recommend to a friend"
      onClose={onClose}
      footer={friends?.length ? <button type="button" className="btn btn-navy cm-btn-block" disabled={!selected.length || saving} onClick={send}>Send{selected.length ? ` (${selected.length})` : ''}</button> : null}
    >
      {product && <p className="cm-hint">{product.brand ? `${product.brand} · ` : ''}{product.name}</p>}
      {friends === null ? <FeedSkeleton count={1} /> : friends.length === 0 ? (
        <EmptyState title="No friends yet">Add friends from their community profile, then you can send them products.</EmptyState>
      ) : (
        <>
          <ul className="cm-pick-list">
            {friends.map((f) => {
              const on = selected.includes(f.user_id);
              return (
                <li key={f.user_id}>
                  <button type="button" className={on ? 'is-on' : ''} aria-pressed={on} onClick={() => setSelected((prev) => (on ? prev.filter((x) => x !== f.user_id) : [...prev, f.user_id]))}>
                    <UserAvatar name={f.display_name} url={f.avatar_url} size={30} />
                    <span>{f.display_name}<small>@{f.username}</small></span>
                    <span className="cm-check" aria-hidden="true">{on ? '✓' : ''}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <label className="cm-field">
            <span>Note <em>optional</em></span>
            <input className="cm-input" maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why you love it" />
          </label>
          <p className="cm-hint">They’ll see their own match for it — never yours.</p>
        </>
      )}
    </Sheet>
  );
}

export function RecommendationPage({ id }) {
  const { supabase, user, navigate, onAddToEcosystem, isInEcosystem, productsById } = useCommunity();
  const [rec, setRec] = useState(undefined);
  const [sender, setSender] = useState(null);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await store.getRecommendation(supabase, id);
        if (!active) return;
        setRec(r || null);
        if (r) {
          const map = await store.getProfilesByIds(supabase, [r.sender_id]);
          if (active) setSender(map.get(r.sender_id) || null);
          if (r.recipient_id === user.id) store.markRecommendationSeen(supabase, r.id).catch(() => {});
        }
      } catch {
        if (active) setRec(null);
      }
    })();
    return () => { active = false; };
  }, [supabase, id, user.id]);

  if (rec === undefined) return <FeedSkeleton count={1} />;
  if (!rec || !productsById.has(rec.product_id)) return <EmptyState title="This recommendation isn’t available" />;
  const fromMe = rec.sender_id === user.id;
  const product = productsById.get(rec.product_id);
  return (
    <div className="cm-rec">
      <div className="cm-rec__from">
        <UserAvatar name={sender?.display_name} url={sender?.avatar_url} size={40} />
        <p>
          <span>
            {fromMe ? 'You recommended this' : <><button type="button" className="cm-link cm-link--strong" onClick={() => sender && navigate({ name: 'profile', username: sender.username })}>{sender?.display_name || 'A friend'}</button> recommended this to you</>}
          </span>
          <small>{relativeTime(rec.created_at)}</small>
        </p>
      </div>
      {rec.note && <p className="cm-rec__note">“{rec.note}”</p>}
      <CommunityProductPreview productId={rec.product_id} variant="row" />
      {!fromMe && onAddToEcosystem && (
        <button type="button" className={`pdp-btn ${isInEcosystem(rec.product_id) ? 'pdp-btn--outline-on' : 'pdp-btn--outline'} cm-btn-pill`} onClick={() => onAddToEcosystem(product)}>
          {isInEcosystem(rec.product_id) ? 'In your ecosystem' : 'Add to ecosystem'}
        </button>
      )}
      <p className="cm-hint">The match shown is yours, from your own ayna profile.</p>
    </div>
  );
}

function notificationText(n, actorName, productName) {
  const who = n.actor_id ? actorName || 'Someone' : 'Someone';
  switch (n.type) {
    case 'follow': return `${who} followed you`;
    case 'friend_request': return `${who} sent you a friend request`;
    case 'friend_accepted': return `${who} accepted your friend request`;
    case 'comment': return `${who} replied to your post`;
    case 'reply': return `${who} replied to your comment`;
    case 'helpful': return `${who} found your ${n.comment_id ? 'comment' : 'post'} helpful`;
    case 'recommendation': return `${who} recommended ${productName || 'a product'} to you`;
    case 'playlist_saved': return `${who} saved your playlist`;
    default: return 'New activity';
  }
}

export function NotificationsPage({ onSeen }) {
  const { supabase, user, navigate, productsById, social, toast } = useCommunity();
  const [items, setItems] = useState(null);
  const [actors, setActors] = useState(new Map());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await store.listNotifications(supabase);
        const map = await store.getProfilesByIds(supabase, rows.map((r) => r.actor_id));
        if (!active) return;
        setItems(rows);
        setActors(map);
        if (rows.some((r) => !r.read_at)) {
          await store.markNotificationsRead(supabase);
          onSeen?.();
        }
      } catch {
        if (active) setItems([]);
      }
    })();
    return () => { active = false; };
  }, [supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  const incoming = useMemo(() => (social.friendships || []).filter((r) => r.status === 'pending' && r.addressee_id === user.id), [social.friendships, user.id]);

  const open = (n) => {
    const actor = actors.get(n.actor_id);
    if (n.type === 'recommendation' && n.recommendation_id) navigate({ name: 'recommendation', id: n.recommendation_id });
    else if (n.post_id) navigate({ name: 'post', id: n.post_id });
    else if (n.playlist_id) navigate({ name: 'playlist', id: n.playlist_id });
    else if (actor) navigate({ name: 'profile', username: actor.username });
  };

  const accept = async (req) => {
    try { await store.acceptFriendRequest(supabase, req.id); await social.refreshFriendships(); toast('You’re friends now'); } catch (e) { toast(store.friendlyError(e)); }
  };

  if (items === null) return <FeedSkeleton count={3} />;
  return (
    <div className="cm-notifications">
      <h2 className="cm-page-title">notifications</h2>
      {items.length === 0 ? (
        <EmptyState title="Nothing yet">Replies, follows and recommendations will show up here.</EmptyState>
      ) : (
        <ul className="cm-notif-list">
          {items.map((n) => {
            const actor = actors.get(n.actor_id);
            const pending = n.type === 'friend_request' && incoming.find((r) => r.requester_id === n.actor_id);
            return (
              <li key={n.id} className={n.read_at ? '' : 'is-unread'}>
                <button type="button" className="cm-notif" onClick={() => open(n)}>
                  <UserAvatar name={actor?.display_name} url={actor?.avatar_url} anonymous={!n.actor_id} size={36} />
                  <span className="cm-notif__text">
                    {notificationText(n, actor?.display_name, productsById.get(n.product_id)?.name)}
                    <small>{relativeTime(n.created_at)}</small>
                  </span>
                </button>
                {pending && (
                  <button type="button" className="cm-follow cm-follow--accent cm-follow--sm" onClick={() => accept(pending)}>Accept</button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
