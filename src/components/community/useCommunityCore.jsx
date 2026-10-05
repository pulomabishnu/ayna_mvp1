import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseClient } from '../../utils/supabaseClient';
import { getGuestClient, getGuestId, ensureGuestSession } from '../../utils/community/guestClient';
import { trackCommunity } from '../../utils/community/analytics';
import { getProfileInterestSignals } from '../../data/products';
import { useCatalogById, useViewerMatch } from './CommunityContext';
import { ProfileSetupSheet, ReportSheet } from './Social';
import { Sheet } from './CommunityUI';
import { useToast } from './useToast';
import * as store from '../../utils/community/communityStore';

function firstNameOf(user) {
  const meta = user?.user_metadata || {};
  return String(meta.full_name || meta.name || meta.first_name || meta.given_name || '').trim().split(/\s+/)[0] || '';
}

/**
 * Everything Community components share: the Supabase client, the viewer's
 * community profile, their social graph, the catalog, and the match function.
 * Used by the Community page and by the small Community actions on the
 * product page, so both behave identically.
 *
 * Returns [contextValue, overlays] — render `overlays` once (sheets/toast).
 */
export function useCommunityCore({
  user, quizResults, healthProfile, myProducts = {}, savedProducts = {},
  onOpenProduct, onAddToEcosystem, onRequireAuth, onStartQuiz, navigate, lazy = false,
}) {
  // Accounts use the app's client; everyone else uses the guest client, which
  // is keyless (anon) until a guest first posts — see guestClient.js.
  const mainClient = useMemo(() => getSupabaseClient(), []);
  const guestClient = useMemo(() => (mainClient ? getGuestClient() : null), [mainClient]);
  const supabase = user ? mainClient : guestClient;
  const [guestId, setGuestId] = useState(null);
  const [nudge, setNudge] = useState(null); // { reason }
  const productsById = useCatalogById();
  const matchFor = useViewerMatch(quizResults, healthProfile, productsById);
  // undefined = not loaded yet, null = no community profile yet. Keyed by user
  // id so a sign-out/sign-in never shows the previous account's profile.
  const [loaded, setLoaded] = useState({ userId: null, profile: undefined });
  const me = !user ? null : loaded.userId === user.id ? loaded.profile : undefined;
  const setMe = useCallback((profile) => setLoaded({ userId: user?.id || null, profile }), [user]);
  const [followingIds, setFollowingIds] = useState(() => new Set());
  const [friendships, setFriendships] = useState([]);
  const [active, setActive] = useState(!lazy);
  const [profileSheet, setProfileSheet] = useState(null); // { onDone }
  const [reportTarget, setReportTarget] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);
  const [toastNode, toast] = useToast();

  const interest = useMemo(() => (quizResults ? getProfileInterestSignals(quizResults, healthProfile) : null), [quizResults, healthProfile]);
  const hasProfile = Boolean(quizResults);
  const ownedProductIds = useMemo(() => new Set([...Object.keys(myProducts || {}), ...Object.keys(savedProducts || {})]), [myProducts, savedProducts]);

  const refreshFriendships = useCallback(async () => {
    if (!supabase || !user) return;
    try { setFriendships(await store.listMyFriendships(supabase)); } catch { /* keep last */ }
  }, [supabase, user]);

  useEffect(() => {
    if (!active || !supabase || !user) return undefined;
    let alive = true;
    (async () => {
      try {
        const [profile, following, friends] = await Promise.all([
          store.getMyCommunityProfile(supabase, user.id),
          store.listFollowingIds(supabase, user.id),
          store.listMyFriendships(supabase),
        ]);
        if (!alive) return;
        setLoaded({ userId: user.id, profile: profile || null });
        setFollowingIds(new Set(following));
        setFriendships(friends);
      } catch {
        if (alive) setLoaded({ userId: user.id, profile: null });
      }
    })();
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload per account, not per auth-object identity
  }, [active, supabase, user?.id]);

  // A returning guest on this device: recognise their own anonymous posts.
  useEffect(() => {
    if (user || !guestClient) return undefined;
    let alive = true;
    getGuestId().then((id) => { if (alive) setGuestId(id); });
    return () => { alive = false; };
  }, [user, guestClient]);

  const setFollowing = useCallback((id, on) => {
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  /** Account-only actions for guests: a gentle "this needs an account" sheet. */
  const requireAccount = useCallback((reason) => {
    if (user) return true;
    setNudge({ reason: reason || null });
    trackCommunity('community_account_nudge_shown', { source: reason ? 'action' : 'generic' });
    return false;
  }, [user]);

  /**
   * Gate for account-only writes (like, save, follow, friend, playlist,
   * review…): signed in, and has picked a community name. Guests get the
   * account nudge instead of a login wall.
   */
  const pendingRef = useRef(null);
  const requireProfile = useCallback((onDone, reason) => {
    if (!user) { requireAccount(reason); return false; }
    if (me) return true;
    if (me === undefined) {
      // Still loading (or not loaded yet in lazy mode): finish the action
      // once we know whether they already have a community profile.
      pendingRef.current = onDone || null;
      if (!active) setActive(true);
      return false;
    }
    setProfileSheet({ onDone });
    return false;
  }, [user, me, active, requireAccount]);

  useEffect(() => {
    if (me === undefined || !pendingRef.current) return;
    const done = pendingRef.current;
    pendingRef.current = null;
    if (me) done(me);
    else setProfileSheet({ onDone: done });
  }, [me]);

  /**
   * Who is writing a guest-allowed action (post, comment, report)?
   * Accounts: their user id (profile required). Guests: the guest session,
   * created on first use. Resolves null if the action is waiting on the
   * profile sheet; throws a friendly error if guest posting is unavailable.
   */
  const resolveActor = useCallback(async () => {
    if (user) return requireProfile() ? user.id : null;
    const id = await ensureGuestSession();
    setGuestId(id);
    return id;
  }, [user, requireProfile]);

  const social = useMemo(() => ({ followingIds, friendships, setFollowing, refreshFriendships }), [followingIds, friendships, setFollowing, refreshFriendships]);

  const value = useMemo(() => ({
    supabase,
    user,
    isGuest: !user,
    actorId: user ? user.id : guestId,
    resolveActor,
    requireAccount,
    me,
    setMe,
    productsById,
    matchFor,
    hasProfile,
    interest,
    ownedProductIds,
    social,
    toast,
    navigate,
    requireProfile,
    openProduct: (product) => onOpenProduct?.(product),
    startQuiz: () => onStartQuiz?.(),
    onAddToEcosystem,
    isInEcosystem: (id) => Boolean(myProducts?.[id]),
    openReport: (target) => {
      if (!user || requireProfile(() => setReportTarget(target))) setReportTarget(target);
    },
    confirmBlock: (target) => { if (requireProfile(() => setBlockTarget(target), 'block people')) setBlockTarget(target); },
    editProfile: () => setProfileSheet({ editing: true }),
    activate: () => setActive(true),
  }), [supabase, user, guestId, resolveActor, requireAccount, me, setMe, productsById, matchFor, hasProfile, interest, ownedProductIds, social, toast, navigate, requireProfile, onOpenProduct, onStartQuiz, onAddToEcosystem, myProducts]);

  const overlays = (
    <>
      {profileSheet && user && (
        <ProfileSetupSheet
          existing={profileSheet.editing ? me : null}
          defaultName={firstNameOf(user)}
          onClose={() => setProfileSheet(null)}
          onSaved={(profile) => { const done = profileSheet.onDone; setMe(profile); setProfileSheet(null); done?.(profile); }}
        />
      )}
      {nudge && (
        <Sheet
          title="Join ayna"
          onClose={() => setNudge(null)}
          footer={(
            <div className="cm-nudge__actions">
              <button
                type="button"
                className="btn btn-navy cm-btn-block"
                onClick={() => { setNudge(null); trackCommunity('community_account_nudge_clicked', {}); onRequireAuth?.(); }}
              >
                Log in or sign up
              </button>
              <button type="button" className="cm-link" onClick={() => setNudge(null)}>Not now</button>
            </div>
          )}
        >
          <div className="cm-nudge">
            {nudge.reason && <p className="cm-nudge__reason">You’ll need an account to {nudge.reason}.</p>}
            <p className="cm-text">Create an account to personalize your feed, connect with friends, save posts, and see your product matches.</p>
            <p className="cm-hint">You can keep browsing and posting anonymously without one.</p>
          </div>
        </Sheet>
      )}
      {reportTarget && <ReportSheet target={reportTarget} onClose={() => setReportTarget(null)} />}
      {blockTarget && (
        <Sheet
          title={`Block ${blockTarget.name || 'this person'}?`}
          onClose={() => setBlockTarget(null)}
          footer={(
            <button
              type="button"
              className="btn btn-navy cm-btn-block"
              onClick={async () => {
                try {
                  await store.setBlocked(supabase, user.id, blockTarget.userId, true);
                  setFollowing(blockTarget.userId, false);
                  await refreshFriendships();
                  toast('Blocked');
                  setBlockTarget(null);
                  navigate?.({ name: 'feed' }, { replace: true, refresh: true });
                } catch (e) {
                  toast(store.friendlyError(e));
                }
              }}
            >
              Block
            </button>
          )}
        >
          <p className="cm-text">They won’t be able to follow you, friend you, or see your named posts, and you won’t see theirs. They aren’t notified.</p>
        </Sheet>
      )}
      {toastNode}
    </>
  );

  return [value, overlays];
}
