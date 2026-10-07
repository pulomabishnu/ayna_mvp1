import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './community.css';
import { CommunityContext } from './CommunityContext';
import { useCommunityCore } from './useCommunityCore';
import CommunityFeed from './CommunityFeed';
import PostThread from './PostThread';
import Profile from './Profile';
import CommunitySearch from './CommunitySearch';
import CommunityComposer from './CommunityComposer';
import { PlaylistPage } from './Playlists';
import { NotificationsPage, RecommendationPage } from './Social';
import { UserAvatar, EmptyState, Sheet } from './CommunityUI';
import * as store from '../../utils/community/communityStore';
import { parseCommunityRoute, communityHref } from '../../utils/community/route';
import { trackCommunity } from '../../utils/community/analytics';

function readRoute() {
  return parseCommunityRoute(window.location.pathname, window.location.search);
}

const CREATE_OPTIONS = [
  { kind: 'post', label: 'Start a discussion', hint: 'share a tip, a win, a thought', icon: <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12Z" /> },
  { kind: 'question', label: 'Ask a question', hint: 'get answers from people who’ve been there', icon: <><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 16.6v.2" /></> },
  { kind: 'photo', label: 'Share photos', hint: 'up to 4 photos with a caption', icon: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5-8 8" /></> },
  { kind: 'review', label: 'Review a product', hint: 'rate something from the ayna catalog', account: true, icon: <path d="m12 3 2.6 5.6 6 .6-4.5 4 1.3 6L12 16.3 6.6 19.2l1.3-6-4.5-4 6-.6L12 3Z" /> },
  { kind: 'playlist', label: 'Create a playlist', hint: 'a set of products you swear by', account: true, icon: <path d="M4 6h12M4 12h12M4 18h7M18 15v6m-3-3h6" /> },
];

/** "What would you like to share?" — pick a type first, then a focused composer. */
function CreateMenu({ isGuest, onPick, onClose }) {
  return (
    <Sheet title="What would you like to share?" onClose={onClose}>
      <ul className="cm-create-menu">
        {CREATE_OPTIONS.map((o) => (
          <li key={o.kind}>
            <button type="button" onClick={() => onPick(o)}>
              <span className="cm-create-menu__icon"><svg viewBox="0 0 24 24" aria-hidden="true">{o.icon}</svg></span>
              <span className="cm-create-menu__text">
                <strong>{o.label}</strong>
                <small>{isGuest && o.account ? 'needs an account' : o.hint}</small>
              </span>
              {isGuest && o.account && (
                <svg className="cm-create-menu__lock" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              )}
            </button>
          </li>
        ))}
      </ul>
      {isGuest && <p className="cm-hint cm-create-menu__note">No account? Discussions and questions post as <strong>Anonymous</strong>.</p>}
    </Sheet>
  );
}

export default function Community(props) {
  const { user, onRequireAuth, onViewDiscovery, onUnreadChange } = props;
  const [route, setRoute] = useState(readRoute);
  const [composer, setComposer] = useState(null); // { kind, productId }
  const [createMenu, setCreateMenu] = useState(false);
  const [unread, setUnread] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useCallback((next, { replace = false, refresh = false } = {}) => {
    if (next?.name === 'browse') { onViewDiscovery?.(next.q || ''); return; }
    const href = communityHref(next);
    if (`${window.location.pathname}${window.location.search}` !== href) {
      if (replace) window.history.replaceState({ view: 'community' }, '', href);
      else window.history.pushState({ view: 'community' }, '', href);
    }
    setRoute(parseCommunityRoute(window.location.pathname, window.location.search));
    if (refresh) setRefreshKey((k) => k + 1);
    window.scrollTo({ top: 0 });
  }, [onViewDiscovery]);

  // App pushed a new /community… URL (nav tab, product page link).
  const [seenNavKey, setSeenNavKey] = useState(props.navKey);
  if (props.navKey !== seenNavKey) {
    setSeenNavKey(props.navKey);
    setRoute(readRoute());
  }

  useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const [ctx, overlays] = useCommunityCore({ ...props, navigate });

  useEffect(() => { trackCommunity('community_viewed', { section: route.name }); }, [route.name]);

  const refreshUnread = useCallback(() => {
    if (!ctx.supabase || !user) return;
    store.countUnreadNotifications(ctx.supabase)
      .then((n) => { setUnread(n); onUnreadChange?.(n); })
      .catch(() => { /* non-critical */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- per account
  }, [ctx.supabase, user?.id, onUnreadChange]);

  useEffect(() => {
    if (!ctx.supabase || !user) return undefined;
    const tick = () => {
      store.countUnreadNotifications(ctx.supabase)
        .then((n) => { setUnread(n); onUnreadChange?.(n); })
        .catch(() => { /* non-critical */ });
    };
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- per account
  }, [ctx.supabase, user?.id, onUnreadChange]);

  // Guests can start discussions and questions right away (they post as
  // Anonymous); reviews and playlists need an account. Accounts need a
  // community profile first.
  const openComposer = useCallback((kind = 'question', productId = null) => {
    const k = kind === 'photo' ? 'post' : kind;
    const next = { kind: k, productId };
    if (!user) {
      if (k === 'review' || k === 'playlist') ctx.requireAccount(k === 'review' ? 'review products' : 'make playlists');
      else setComposer(next);
      return;
    }
    if (ctx.requireProfile(() => setComposer(next))) setComposer(next);
  }, [ctx, user]);

  const onCreated = useCallback(({ type, id }) => {
    setComposer(null);
    if (type === 'playlist') navigate({ name: 'playlist', id });
    else navigate({ name: 'post', id });
  }, [navigate]);

  const body = useMemo(() => {
    switch (route.name) {
      case 'post': return <PostThread key={route.id} postId={route.id} />;
      case 'profile': return <Profile key={route.username} username={route.username} onEditProfile={ctx.editProfile} />;
      case 'me':
        if (!user) {
          return (
            <EmptyState title="Your profile lives here" action={<button type="button" className="btn btn-navy" onClick={onRequireAuth}>Log in or sign up</button>}>
              Create an account to get a username, follow people, save posts and see your product matches.
            </EmptyState>
          );
        }
        return ctx.me
          ? <Profile key={ctx.me.username} username={ctx.me.username} onEditProfile={ctx.editProfile} />
          : <EmptyState title="Set up your community profile" action={<button type="button" className="btn btn-navy" onClick={() => ctx.requireProfile()}>Get started</button>} />;
      case 'playlist': return <PlaylistPage key={route.id} playlistId={route.id} />;
      case 'recommendation': return <RecommendationPage key={route.id} id={route.id} />;
      case 'notifications':
        if (!user) {
          return (
            <EmptyState title="Notifications" action={<button type="button" className="btn btn-navy" onClick={onRequireAuth}>Log in or sign up</button>}>
              With an account you’ll hear when people answer, like or follow you.
            </EmptyState>
          );
        }
        return <NotificationsPage onSeen={refreshUnread} />;
      case 'search':
        return <CommunitySearch initialQuery={route.q} onQueryChange={(q) => window.history.replaceState({ view: 'community' }, '', communityHref({ name: 'search', q }))} />;
      case 'feed':
      default:
        return (
          <CommunityFeed
            tab={route.tab}
            productFilter={route.product}
            refreshKey={refreshKey}
            onCompose={openComposer}
            onTabChange={(tab, opts = {}) => navigate({ name: 'feed', tab, ...(opts.clearProduct ? {} : route.product ? { product: route.product } : {}) }, { replace: true })}
          />
        );
    }
  }, [route, ctx, refreshKey, openComposer, navigate, refreshUnread, user, onRequireAuth]);

  if (!ctx.supabase) {
    return (
      <section className="container cm-page">
        <EmptyState title="Community isn’t available right now">Please try again later.</EmptyState>
      </section>
    );
  }

  const isFeed = route.name === 'feed';

  return (
    <CommunityContext.Provider value={ctx}>
      <section className="container cm-page animate-fade-in-up" aria-label="Community">
        <header className="cm-header">
          {isFeed ? (
            <div className="cm-header__title">
              <h2>community</h2>
            </div>
          ) : (
            <button type="button" className="cm-back" onClick={() => (window.history.length > 1 ? window.history.back() : navigate({ name: 'feed' }))}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
              back
            </button>
          )}
          <div className="cm-header__actions">
            <button type="button" className="cm-icon-btn" aria-label="Search the community" onClick={() => navigate({ name: 'search' })}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
            </button>
            {user ? (
              <>
                <button type="button" className="cm-icon-btn cm-bell" aria-label={`Notifications${unread ? ` (${unread} new)` : ''}`} onClick={() => navigate({ name: 'notifications' })}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Zm4 4a2 2 0 0 0 4 0" /></svg>
                  {unread > 0 && <span className="cm-bell__count">{unread > 9 ? '9+' : unread}</span>}
                </button>
                <button type="button" className="cm-me" aria-label="Your community profile" onClick={() => (ctx.me ? navigate({ name: 'profile', username: ctx.me.username }) : ctx.requireProfile())}>
                  <UserAvatar name={ctx.me?.display_name || ''} url={ctx.me?.avatar_url} size={32} />
                </button>
              </>
            ) : (
              <button type="button" className="cm-login-pill" onClick={onRequireAuth}>log in</button>
            )}
            <button type="button" className="cm-create-icon" aria-label="Create" onClick={() => setCreateMenu(true)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </header>

        {body}

      </section>
      {createMenu && (
        <CreateMenu
          isGuest={!user}
          onClose={() => setCreateMenu(false)}
          onPick={(o) => { setCreateMenu(false); trackCommunity('community_create_opened', { kind: o.kind }); openComposer(o.kind); }}
        />
      )}
      {composer && (
        <CommunityComposer initialKind={composer.kind} initialProductId={composer.productId} onClose={() => setComposer(null)} onCreated={onCreated} />
      )}
      {overlays}
    </CommunityContext.Provider>
  );
}
