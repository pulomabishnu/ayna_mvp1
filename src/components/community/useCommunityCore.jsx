import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseClient } from '../../utils/supabaseClient';
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
  const supabase = useMemo(() => getSupabaseClient(), []);
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

  const setFollowing = useCallback((id, on) => {
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  /** Gate for every write: signed in, and has picked a community name. */
  const pendingRef = useRef(null);
  const requireProfile = useCallback((onDone) => {
    if (!user) { onRequireAuth?.(); return false; }
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
  }, [user, me, active, onRequireAuth]);

  useEffect(() => {
    if (me === undefined || !pendingRef.current) return;
    const done = pendingRef.current;
    pendingRef.current = null;
    if (me) done(me);
    else setProfileSheet({ onDone: done });
  }, [me]);

  const social = useMemo(() => ({ followingIds, friendships, setFollowing, refreshFriendships }), [followingIds, friendships, setFollowing, refreshFriendships]);

  const value = useMemo(() => ({
    supabase,
    user,
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
    openReport: (target) => { if (requireProfile(() => setReportTarget(target))) setReportTarget(target); },
    confirmBlock: (target) => { if (requireProfile(() => setBlockTarget(target))) setBlockTarget(target); },
    editProfile: () => setProfileSheet({ editing: true }),
    activate: () => setActive(true),
  }), [supabase, user, me, setMe, productsById, matchFor, hasProfile, interest, ownedProductIds, social, toast, navigate, requireProfile, onOpenProduct, onStartQuiz, onAddToEcosystem, myProducts]);

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
