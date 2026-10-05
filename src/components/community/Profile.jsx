import React, { useCallback, useEffect, useState } from 'react';
import { useCommunity } from './CommunityContext';
import { EmptyState, FeedSkeleton, OverflowMenu, UserAvatar } from './CommunityUI';
import CommunityPostCard from './CommunityPostCard';
import { PlaylistCard } from './Playlists';
import * as store from '../../utils/community/communityStore';
import { trackCommunity } from '../../utils/community/analytics';

export function FollowButton({ targetId, compact = false, onChanged }) {
  const { supabase, user, social, requireProfile, toast } = useCommunity();
  const following = social.followingIds.has(targetId);
  const [busy, setBusy] = useState(false);
  if (!targetId || targetId === user?.id) return null;
  const toggle = async () => {
    if (!requireProfile() || busy) return;
    setBusy(true);
    social.setFollowing(targetId, !following);
    try {
      await store.setFollowing(supabase, user.id, targetId, !following);
      if (!following) trackCommunity('profile_followed', {});
      onChanged?.();
    } catch (e) {
      social.setFollowing(targetId, following);
      toast(store.friendlyError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" className={`cm-follow${following ? ' is-on' : ''}${compact ? ' cm-follow--sm' : ''}`} aria-pressed={following} onClick={toggle} disabled={busy}>
      {following ? 'Following' : 'Follow'}
    </button>
  );
}

export function FriendButton({ targetId, onChanged }) {
  const { supabase, user, social, requireProfile, toast } = useCommunity();
  const [busy, setBusy] = useState(false);
  if (!targetId || targetId === user?.id) return null;
  const { state, row } = store.friendshipState(social.friendships, user.id, targetId);

  const run = async (fn, okMessage) => {
    if (!requireProfile() || busy) return;
    setBusy(true);
    try {
      await fn();
      await social.refreshFriendships();
      onChanged?.();
      if (okMessage) toast(okMessage);
    } catch (e) {
      toast(store.friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  if (state === 'friends') {
    return (
      <button type="button" className="cm-follow is-on" disabled={busy}
        onClick={() => { if (window.confirm('Remove this friend?')) run(() => store.removeFriendship(supabase, row.id)); }}>
        Friends
      </button>
    );
  }
  if (state === 'requested') {
    return <button type="button" className="cm-follow is-pending" disabled={busy} onClick={() => run(() => store.removeFriendship(supabase, row.id), 'Request cancelled')}>Requested</button>;
  }
  if (state === 'incoming') {
    return <button type="button" className="cm-follow cm-follow--accent" disabled={busy} onClick={() => run(() => store.acceptFriendRequest(supabase, row.id), 'You’re friends now')}>Accept friend</button>;
  }
  return (
    <button type="button" className="cm-follow" disabled={busy}
      onClick={() => run(async () => { await store.sendFriendRequest(supabase, user.id, targetId); trackCommunity('friend_request_sent', {}); }, 'Friend request sent')}>
      Add friend
    </button>
  );
}

function ProfileHeader({ profile, stats, isMe, onEdit, onStatsChanged }) {
  const { openReport, confirmBlock } = useCommunity();
  return (
    <header className="cm-profile-head">
      <UserAvatar name={profile.display_name} url={profile.avatar_url} size={72} />
      <div className="cm-profile-head__text">
        <h2>{profile.display_name}</h2>
        <p className="cm-profile-head__username">@{profile.username}</p>
        {profile.bio && <p className="cm-profile-head__bio">{profile.bio}</p>}
        <div className="cm-profile-head__counts">
          <span><strong>{stats?.friends ?? '–'}</strong> Friends</span>
          <span><strong>{stats?.followers ?? '–'}</strong> Followers</span>
          <span><strong>{stats?.following ?? '–'}</strong> Following</span>
        </div>
        <div className="cm-profile-head__actions">
          {isMe ? (
            <button type="button" className="cm-follow" onClick={onEdit}>Edit profile</button>
          ) : (
            <>
              <FollowButton targetId={profile.user_id} onChanged={onStatsChanged} />
              <FriendButton targetId={profile.user_id} onChanged={onStatsChanged} />
              <OverflowMenu
                items={[
                  { label: 'Report user', onClick: () => openReport({ targetType: 'user', reportedUserId: profile.user_id }) },
                  { label: `Block ${profile.display_name}`, danger: true, onClick: () => confirmBlock({ userId: profile.user_id, name: profile.display_name }) },
                ]}
              />
            </>
          )}
        </div>
        {isMe && <p className="cm-hint cm-profile-head__privacy">Your health profile is never shown here. Only what you post is public.</p>}
      </div>
    </header>
  );
}

const TABS = [
  { key: 'posts', label: 'Posts' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'playlists', label: 'Playlists' },
];

function ProfileTab({ profile, tab, isMe }) {
  const { supabase } = useCommunity();
  const [items, setItems] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let rows;
        if (tab === 'playlists') {
          rows = isMe
            ? await store.listPlaylists(supabase, { section: 'mine', limit: 50 })
            : await store.listPlaylists(supabase, { section: 'owner', ownerIds: [profile.user_id], limit: 50 });
        } else if (tab === 'saved') {
          rows = await store.listFeedPosts(supabase, { savedOnly: true, limit: 30 });
        } else {
          // On your own profile, include your anonymous posts (only you see
          // them, marked "you"). Everyone else gets named posts only — the
          // view nulls author_id on anonymous posts, so they can't match.
          rows = await store.listFeedPosts(supabase, {
            kind: tab === 'reviews' ? 'review' : null,
            ...(isMe ? { mineOnly: true } : { authorIds: [profile.user_id] }),
            limit: 30,
          });
          if (tab === 'posts') rows = rows.filter((r) => r.kind !== 'review');
        }
        if (active) setItems(rows);
      } catch {
        if (active) setItems([]);
      }
    })();
    return () => { active = false; };
  }, [supabase, profile.user_id, tab, isMe]);

  if (!items) return <FeedSkeleton count={2} />;
  if (!items.length) {
    const label = { posts: 'posts', reviews: 'reviews', playlists: 'public playlists', saved: 'saved posts' }[tab];
    return <EmptyState title={isMe ? `You haven’t got any ${label} yet` : `No ${label} yet`} />;
  }
  if (tab === 'playlists') {
    return <div className="cm-grid-playlists">{items.map((p) => <PlaylistCard key={p.id} playlist={p} />)}</div>;
  }
  return (
    <div>
      {items.map((p) => (
        <CommunityPostCard
          key={p.id}
          post={p}
          onChange={(next) => setItems((prev) => prev.map((x) => (x.id === next.id ? next : x)))}
          onRemove={(gone) => setItems((prev) => prev.filter((x) => x.id !== gone.id))}
        />
      ))}
    </div>
  );
}

export default function Profile({ username, onEditProfile }) {
  const { supabase, me, navigate } = useCommunity();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [state, setState] = useState('loading');
  const [tab, setTab] = useState('posts');
  const isMe = Boolean(me && profile && me.user_id === profile.user_id);

  const load = useCallback(() => (
    (username ? store.getProfileByUsername(supabase, username) : Promise.resolve(me))
      .then((p) => {
        setProfile(p);
        setState(p ? 'ready' : 'missing');
        return p ? store.getProfileStats(supabase, p.user_id).then(setStats) : null;
      })
      .catch(() => setState('error'))
  ), [supabase, username, me]);

  useEffect(() => { load(); }, [load]);

  if (state === 'loading') return <FeedSkeleton count={2} />;
  if (state !== 'ready') {
    return <EmptyState title="Profile not found" action={<button type="button" className="btn btn-navy" onClick={() => navigate({ name: 'feed' })}>Back to Community</button>} />;
  }

  const tabs = isMe ? [...TABS, { key: 'saved', label: 'Saved' }] : TABS;

  return (
    <div className="cm-profile">
      <ProfileHeader
        profile={profile}
        stats={stats}
        isMe={isMe}
        onEdit={onEditProfile}
        onStatsChanged={() => store.getProfileStats(supabase, profile.user_id).then(setStats).catch(() => {})}
      />
      <div className="ayna-browse__categories cm-subtabs" role="tablist" aria-label="Profile sections">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'is-active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <ProfileTab key={tab} profile={profile} tab={tab} isMe={isMe} />
    </div>
  );
}
