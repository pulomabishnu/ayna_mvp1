import { useCallback, useEffect, useRef, useState } from 'react';
import { renderMarkdownLite } from '../utils/renderMarkdownLite.jsx';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { publicMediaUrl } from '../utils/community/imageUpload.js';
import * as community from '../utils/community/communityStore.js';
import { firstNameOf, sharedAnswerTitle, referralCodeFor } from '../utils/sharedAnswer.js';
import {
  fetchSharedAnswer, rememberShareReferral, trackSharedAnswerOpened, rememberPendingFriend,
  readPendingFriend, clearPendingFriend, trackFriendAddedFromShare, revokeShareLink,
} from '../utils/shareAnswerClient.js';

function setMeta(attr, key, value) {
  try {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute('content', value);
  } catch { /* no document */ }
}

function Avatar({ name, path }) {
  const [failed, setFailed] = useState(false);
  const src = path && !failed ? publicMediaUrl(path) : null;
  const initial = (firstNameOf(name) || 'a')[0].toUpperCase();
  return <span className="sa__avatar" aria-hidden="true">{src ? <img src={src} alt="" onError={() => setFailed(true)} /> : initial}</span>;
}

const FRIEND_LABEL = { none: 'Add friend', requested: 'Request sent', friends: 'Friends', incoming: 'Accept friend request' };

/**
 * Public page for one shared Ask ayna answer: /a/<slug>.
 * Shows only what the owner chose to share. noindex (set here and by the
 * server's HTML for the route).
 */
export default function SharedAnswerPage({ slug, user, session, onRequireAuth, onAskOwn, onHome }) {
  const [state, setState] = useState({ status: 'loading' });
  const [friend, setFriend] = useState({ state: 'none', row: null });
  const [friendBusy, setFriendBusy] = useState(false);
  const [friendError, setFriendError] = useState('');
  const [prompt, setPrompt] = useState(false);
  const [reload, setReload] = useState(0);
  const promptRef = useRef(null);
  const signUpRef = useRef(null);
  // The prompt opens under the owner row: bring all of it above the phone tab
  // bar (scroll-margin-bottom in shareAnswer.css) and put focus on Sign up.
  useEffect(() => {
    if (!prompt) return undefined;
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    signUpRef.current?.focus({ preventScroll: true });
    const frame = window.requestAnimationFrame(() => {
      const card = promptRef.current?.getBoundingClientRect();
      if (!card) return;
      // Keep the whole card (its buttons above all) clear of the fixed tab bar, 16px gap.
      const nav = document.querySelector('.ay-tabbar');
      const navTop = nav && window.getComputedStyle(nav).position === 'fixed' ? nav.getBoundingClientRect().top : window.innerHeight;
      const overlap = card.bottom - (navTop - 16);
      if (overlap > 0) window.scrollBy({ top: overlap, behavior: reduce ? 'auto' : 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [prompt]);
  const token = session?.access_token && !session?.user?.is_anonymous ? session.access_token : null;
  const signedIn = Boolean(user && !user.is_anonymous);

  // Private-ish user content: never indexed.
  useEffect(() => {
    setMeta('name', 'robots', 'noindex, nofollow');
    return () => { try { document.head.querySelector('meta[name="robots"]')?.remove(); } catch { /* ignore */ } };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchSharedAnswer(slug, token).then((r) => {
      if (cancelled) return;
      setState(r);
      if (r.status === 'ok') {
        const owner = r.answer.owner || {};
        const isOwner = Boolean(r.answer.is_owner || (user?.id && user.id === owner.user_id));
        if (!isOwner) {
          rememberShareReferral({ slug, referrerCode: referralCodeFor(owner.user_id) });
          trackSharedAnswerOpened({ slug, signed_in: signedIn });
        }
      }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, token, reload]);

  const answer = state.status === 'ok' ? state.answer : null;
  const owner = answer?.owner || {};
  const name = firstNameOf(owner.display_name) || '';
  const title = answer ? sharedAnswerTitle(owner.display_name) : state.status === 'gone' ? 'This answer isn’t shared anymore.' : 'An answer from ayna';
  const isOwner = Boolean(answer && (answer.is_owner || (user?.id && user.id === owner.user_id)));

  useEffect(() => {
    document.title = `${title} | ayna`;
    setMeta('property', 'og:title', title);
    setMeta('name', 'description', 'Read the answer, then ask ayna your own question.');
    setMeta('property', 'og:description', 'Read the answer, then ask ayna your own question.');
  }, [title]);

  const supabase = getSupabaseClient();
  const sendRequest = useCallback(async () => {
    if (!supabase || !user?.id || !owner.user_id) return;
    setFriendBusy(true);
    setFriendError('');
    try {
      if (friend.state === 'incoming' && friend.row) {
        await community.acceptFriendRequest(supabase, friend.row.id);
        setFriend({ state: 'friends', row: friend.row });
      } else if (friend.state === 'none') {
        const row = await community.sendFriendRequest(supabase, user.id, owner.user_id);
        setFriend({ state: 'requested', row });
      }
      trackFriendAddedFromShare({ slug, action: friend.state === 'incoming' ? 'accepted' : 'requested' });
    } catch (e) {
      // Already requested (unique pair): show it as sent.
      if (e?.code === '23505') setFriend((f) => ({ ...f, state: 'requested' }));
      else setFriendError(community.friendlyError(e));
    } finally {
      setFriendBusy(false);
    }
  }, [supabase, user?.id, owner.user_id, friend, slug]);

  // Signed in: where do we stand with her? Then finish a request started signed out.
  useEffect(() => {
    if (!signedIn || !answer || isOwner || !supabase) return undefined;
    let cancelled = false;
    (async () => {
      let current = { state: 'none', row: null };
      try { current = community.friendshipState(await community.listMyFriendships(supabase), user.id, owner.user_id); } catch { /* table missing: treat as none */ }
      if (cancelled) return;
      setFriend(current);
      const pending = readPendingFriend();
      if (pending?.slug === slug && pending.ownerId === owner.user_id) {
        clearPendingFriend();
        if (current.state === 'none') {
          try {
            const row = await community.sendFriendRequest(supabase, user.id, owner.user_id);
            if (!cancelled) setFriend({ state: 'requested', row });
            trackFriendAddedFromShare({ slug, action: 'requested', after_auth: true });
          } catch (e) {
            if (!cancelled) setFriendError(community.friendlyError(e));
          }
        }
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, answer?.slug, isOwner, user?.id]);

  const onAddFriend = () => {
    if (!signedIn) { rememberPendingFriend({ slug, ownerId: owner.user_id }); setPrompt(true); return; }
    sendRequest();
  };

  const stopSharing = async () => {
    try { await revokeShareLink({ token, slug }); setState({ status: 'gone' }); } catch { setFriendError('Couldn’t turn off the link. Try again.'); }
  };

  if (state.status === 'loading') {
    return <div className="ct sa ay-container" aria-busy="true"><div className="sa__skeleton" /><div className="sa__skeleton is-short" /></div>;
  }

  if (state.status === 'gone') {
    return (
      <div className="ct sa sa--gone ay-container">
        <h1 className="sa__title">This answer isn’t shared anymore.</h1>
        <p className="sa__lede">The person who shared it turned the link off.</p>
        <div className="sa__ctas">
          <button type="button" className="ay-btn ay-btn--primary" onClick={onAskOwn}>Ask ayna your own question</button>
          <a className="ct-link" href="/" onClick={(e) => { e.preventDefault(); onHome?.(); }}>Go to ayna</a>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="ct sa sa--gone ay-container">
        <h1 className="sa__title">Couldn’t load this answer</h1>
        <p className="sa__lede">Check your connection and try again.</p>
        <div className="sa__ctas"><button type="button" className="ay-btn ay-btn--primary" onClick={() => setReload((n) => n + 1)}>Try again</button></div>
      </div>
    );
  }

  const sources = Array.isArray(answer.sources) ? answer.sources : [];
  const friendLabel = FRIEND_LABEL[friend.state] || 'Add friend';
  return (
    <div className="ct sa ay-container">
      <h1 className="sa__title">{title}</h1>

      <section className="sa__qa" aria-label="Question and answer">
        <p className="sa__question">{answer.question}</p>
        <div className="sa__answer">{renderMarkdownLite(answer.answer)}</div>
        {sources.length > 0 && (
          <div className="sa__sources">
            <h2>Sources</h2>
            <ol className="ay-source-grid is-stack">
              {sources.map((s, i) => {
                let host = '';
                try { host = s.url ? new URL(s.url).hostname.replace(/^www\./, '') : ''; } catch { /* not a URL */ }
                return (
                  <li key={i} className="ay-source-card">
                    {host && <p className="ay-source-card__meta"><span className="ay-source-card__pub">{host}</span></p>}
                    <p className="ay-source-card__title">{s.title || s.url}</p>
                    {s.url && <a className="ay-source-card__go" href={s.url} target="_blank" rel="noopener noreferrer nofollow">Read the source <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        <p className="sa__disclaimer">ayna’s answers are educational, not medical advice.</p>
      </section>

      <section className="sa__owner" aria-label="Shared by">
        <Avatar name={owner.display_name} path={owner.avatar_url} />
        <div className="sa__who">
          <strong>{owner.display_name || 'An ayna member'}</strong>
          {owner.username && <span>@{owner.username}</span>}
        </div>
        {isOwner ? (
          <button type="button" className="ay-btn ay-btn--secondary" onClick={stopSharing}>Stop sharing</button>
        ) : (
          <button
            type="button"
            className={`ay-btn ay-btn--secondary${friend.state === 'none' || friend.state === 'incoming' ? '' : ' is-done'}`}
            onClick={onAddFriend}
            disabled={friendBusy || friend.state === 'requested' || friend.state === 'friends'}
          >
            {friendBusy ? 'Sending…' : friendLabel}
          </button>
        )}
      </section>
      {friendError && <p className="sa__error" role="alert">{friendError}</p>}

      {prompt && !signedIn && (
        <section ref={promptRef} className="sa__prompt" role="dialog" aria-labelledby="sa-prompt-title">
          <p id="sa-prompt-title" className="sa__prompt-title">{name ? `Sign up to add ${name} as a friend` : 'Sign up to add this friend'}</p>
          <p className="sa__prompt-line">We’ll send the request as soon as you’re in.</p>
          <div className="sa__row">
            <button ref={signUpRef} type="button" className="ay-btn ay-btn--primary" onClick={() => onRequireAuth?.('signup')}>Sign up</button>
            <button type="button" className="ay-btn ay-btn--secondary" onClick={() => onRequireAuth?.('signin')}>Sign in</button>
          </div>
          <button type="button" className="ct-link" onClick={() => { clearPendingFriend(); setPrompt(false); }}>Not now</button>
        </section>
      )}

      <div className="sa__ctas">
        <button type="button" className="ay-btn ay-btn--primary" onClick={onAskOwn}>Ask ayna your own question</button>
      </div>
    </div>
  );
}
