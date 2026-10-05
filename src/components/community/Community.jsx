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
import { UserAvatar, EmptyState } from './CommunityUI';
import * as store from '../../utils/community/communityStore';
import { parseCommunityRoute, communityHref } from '../../utils/community/route';
import { trackCommunity } from '../../utils/community/analytics';

function readRoute() {
  return parseCommunityRoute(window.location.pathname, window.location.search);
}

function SignedOut({ onLogIn }) {
  return (
    <div className="cm-signed-out">
      <p className="ayna-browse__eyebrow">ayna community</p>
      <h2>Ask, review, and share what actually works.</h2>
      <p>Real experiences from other women — and for every product mentioned, ayna shows how well it matches <em>you</em>.</p>
      <ul>
        <li>Ask questions, anonymously if you want</li>
        <li>Review the products you use</li>
        <li>Make playlists of your essentials</li>
      </ul>
      <button type="button" className="btn btn-navy" onClick={onLogIn}>Log in to join</button>
      <p className="cm-hint">Your health profile always stays private.</p>
    </div>
  );
}

export default function Community(props) {
  const { user, onRequireAuth, onViewDiscovery, onUnreadChange } = props;
  const [route, setRoute] = useState(readRoute);
  const [composer, setComposer] = useState(null); // { kind, productId }
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

  const openComposer = useCallback((kind = 'question', productId = null) => {
    if (ctx.requireProfile(() => setComposer({ kind, productId }))) setComposer({ kind, productId });
  }, [ctx]);

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
        return ctx.me
          ? <Profile key={ctx.me.username} username={ctx.me.username} onEditProfile={ctx.editProfile} />
          : <EmptyState title="Set up your community profile" action={<button type="button" className="btn btn-navy" onClick={() => ctx.requireProfile()}>Get started</button>} />;
      case 'playlist': return <PlaylistPage key={route.id} playlistId={route.id} />;
      case 'recommendation': return <RecommendationPage key={route.id} id={route.id} />;
      case 'notifications': return <NotificationsPage onSeen={refreshUnread} />;
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
  }, [route, ctx, refreshKey, openComposer, navigate, refreshUnread]);

  if (!ctx.supabase) {
    return (
      <section className="container cm-page">
        <EmptyState title="Community isn’t available right now">Please try again later.</EmptyState>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="container cm-page">
        <SignedOut onLogIn={onRequireAuth} />
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
              <p>what’s actually working, from people like you</p>
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
            <button type="button" className="cm-icon-btn cm-bell" aria-label={`Notifications${unread ? ` (${unread} new)` : ''}`} onClick={() => navigate({ name: 'notifications' })}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Zm4 4a2 2 0 0 0 4 0" /></svg>
              {unread > 0 && <span className="cm-bell__count">{unread > 9 ? '9+' : unread}</span>}
            </button>
            <span className="cm-header__sep" aria-hidden="true" />
            <button type="button" className="cm-me" aria-label="Your community profile" onClick={() => (ctx.me ? navigate({ name: 'profile', username: ctx.me.username }) : ctx.requireProfile())}>
              <UserAvatar name={ctx.me?.display_name || ''} url={ctx.me?.avatar_url} size={32} />
            </button>
            <button type="button" className="cm-create-icon" aria-label="Create post" onClick={() => openComposer('question')}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
        </header>

        {body}

      </section>
      {composer && (
        <CommunityComposer initialKind={composer.kind} initialProductId={composer.productId} onClose={() => setComposer(null)} onCreated={onCreated} />
      )}
      {overlays}
    </CommunityContext.Provider>
  );
}
