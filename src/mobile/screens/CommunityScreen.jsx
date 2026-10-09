import { useEffect, useMemo, useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { getGuestClient, getGuestId, ensureGuestSession } from '../../utils/community/guestClient.js';
import * as community from '../../utils/community/communityStore.js';
import { rankForYou, postProductIds } from '../../utils/community/ranking.js';
import { extractHashtagTopics, suggestHashtags, suggestTopicsForProducts } from '../../utils/community/topics.js';
import { uploadCommunityImage, deleteCommunityImage, checkImageFile, MAX_POST_PHOTOS, publicMediaUrl } from '../../utils/community/imageUpload.js';
import { CATEGORY_LABELS, getProfileMatchPercentForProduct } from '../../data/products.js';
import { buildSearchTextForItem, buildIdentityTextForItem, scoreQueryAgainstProduct } from '../../utils/naturalLanguageSearch.js';
import PlaylistCoverPicker from '../components/PlaylistCoverPicker.jsx';
import PlaylistAudiencePicker from '../components/PlaylistAudiencePicker.jsx';
import { makePlaylistCoverFile } from '../components/playlistCoverImage.js';
import './community-mobile.css';

const TABS = [ ['for-you', 'For you'], ['following', 'Following'], ['question', 'Questions'], ['review', 'Reviews'], ['playlists', 'Playlists'] ];
const timeLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

function CommunityIcon({ name, size = 20 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 4.5 4.5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9Z" /><path d="M10 21h4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    heart: <path d="M20.5 8.5c0 4.2-8.5 10-8.5 10s-8.5-5.8-8.5-10a4.5 4.5 0 0 1 8.5-2 4.5 4.5 0 0 1 8.5 2Z" />,
    comment: <path d="M20 11.5a8 8 0 0 1-8 8 8.4 8.4 0 0 1-3.3-.7L4 20l1.2-4.7A8 8 0 1 1 20 11.5Z" />,
    bookmark: <path d="M6 4.5h12v15l-6-4-6 4v-15Z" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function CommunityAvatar({ name, path, anonymous = false }) {
  const [failed, setFailed] = useState(false);
  const initials = anonymous ? 'A' : String(name || 'A').split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  return <span className="am-avatar" aria-hidden="true">
    {path && !failed ? <img src={publicMediaUrl(path)} alt="" onError={() => setFailed(true)} /> : initials}
  </span>;
}

function ProductMention({ productId, productsById, quizAnswers, onOpenProduct }) {
  const product = productsById.get(String(productId));
  if (!product) return null;
  const match = quizAnswers ? getProfileMatchPercentForProduct(product, quizAnswers) : null;
  return <button type="button" className="am-product" onClick={() => onOpenProduct(product)}>
    {product.image && <img src={product.image} alt="" loading="lazy" />}
    <span><strong>{product.name}</strong><small>{product.brand || 'ayna product'}</small></span>
    <em>{Number.isFinite(match) ? `${match}% for you` : 'View'}</em>
  </button>;
}

function ProductPicker({ products, value, onChange }) {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    return products.map((product) => ({
      product,
      score: scoreQueryAgainstProduct(q, buildSearchTextForItem(product, CATEGORY_LABELS), buildIdentityTextForItem(product, CATEGORY_LABELS)),
    })).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, 10).map(({ product }) => product);
  }, [products, query]);
  const selected = products.find((p) => String(p.id) === String(value));
  return <div className="am-picker">
    <label htmlFor="am-product-query">{selected ? 'Selected product' : 'Search products by name, concern, or category'}</label>
    {selected ? <div className="am-picked"><span>{selected.name}</span><button type="button" onClick={() => { onChange(null); setQuery(''); }}>Remove</button></div> : <>
      <div className="am-product-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg><input id="am-product-query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try cramps, PCOS, a brand…" /></div>
      {matches.length > 0 && <div className="am-results">{matches.map((p) => <button type="button" key={p.id} onClick={() => { onChange(p.id); setQuery(''); }}>{p.name}<small>{[p.brand, p.category?.replace(/-/g, ' ')].filter(Boolean).join(' · ')}</small></button>)}</div>}
      {query.trim().length >= 2 && matches.length === 0 && <small className="am-picker-empty">No products found. Try another name or concern.</small>}
    </>}
  </div>;
}

export default function CommunityScreen({ authUser, products = [], quizAnswers, headerInitial, onOpenProduct, onGoBrowse, onGoEco, onOpenSaved, onOpenProfile, onRequireAuth, seedKind, seedProductId }) {
  const supabase = authUser ? getSupabaseClient() : (getGuestClient() || getSupabaseClient());
  const productsById = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);
  const [tab, setTab] = useState('for-you');
  const [posts, setPosts] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [playlistSection, setPlaylistSection] = useState('recent');
  const [editingPlaylist, setEditingPlaylist] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState('public');
  const [editCoverMode, setEditCoverMode] = useState('photo');
  const [editCoverColor, setEditCoverColor] = useState('#203C9C');
  const [editCoverText, setEditCoverText] = useState('');
  const [editCoverPhoto, setEditCoverPhoto] = useState(null);
  const [deletePlaylistTarget, setDeletePlaylistTarget] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [followingIds, setFollowingIds] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [friendProfiles, setFriendProfiles] = useState([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [page, setPage] = useState(null); // { type: 'post' | 'playlist' | 'profile' | 'notifications', id }
  const [details, setDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [items, setItems] = useState([]);
  const [compose, setCompose] = useState(seedKind || null); // 'post' | 'question' | 'review' | 'playlist'
  const [body, setBody] = useState('');
  const [productId, setProductId] = useState(seedProductId || null);
  const [anonymous, setAnonymous] = useState(false);
  const [rating, setRating] = useState(5);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [playlistVisibility, setPlaylistVisibility] = useState('public');
  const [coverMode, setCoverMode] = useState('color');
  const [coverColor, setCoverColor] = useState('#203C9C');
  const [coverText, setCoverText] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [commentBody, setCommentBody] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileById, setProfileById] = useState(new Map());
  const [profileName, setProfileName] = useState('');
  const [profileHandle, setProfileHandle] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileHandle, setEditProfileHandle] = useState('');
  const [editProfileBio, setEditProfileBio] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [reportPost, setReportPost] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [postMenuId, setPostMenuId] = useState(null);
  const [reportReason, setReportReason] = useState('misinformation');
  const hashtagMatch = body.match(/(?:^|\s)#([A-Za-z][\w-]*)?$/);
  const hashtagSuggestions = hashtagMatch ? suggestHashtags(hashtagMatch[1] || '', 6) : [];

  const notifyError = (e) => setError(community.friendlyError(e));
  const requireAccount = (feature = 'this feature') => onRequireAuth?.(feature);
  const closePage = () => { setEditingPlaylist(false); setPage(null); setDetails(null); setComments([]); setItems([]); setError(''); };
  const openCompose = (kind = 'post') => {
    if (!authUser && ['review', 'playlist', 'recommend'].includes(kind)) {
      requireAccount(kind === 'review' ? 'reviews' : kind === 'playlist' ? 'playlists' : 'friend recommendations');
      return;
    }
    closePage(); setCompose(kind); setError('');
  };

  useEffect(() => {
    if (!supabase) return;
    const ids = [...new Set([...posts, ...comments, ...(searchResults?.posts || []), ...(page?.type === 'post' && details ? [details] : [])].map((item) => item.author_id).filter(Boolean))];
    if (!ids.length) return;
    let active = true;
    community.getProfilesByIds(supabase, ids).then((profiles) => { if (active) setProfileById((previous) => new Map([...previous, ...profiles])); }).catch(() => {});
    return () => { active = false; };
  }, [supabase, posts, comments, searchResults, page, details]);

  useEffect(() => {
    if (!supabase || !authUser) return;
    community.getMyCommunityProfile(supabase, authUser.id).then(setProfile).catch(() => {});
    community.listFollowingIds(supabase, authUser.id).then(setFollowingIds).catch(() => {});
    community.listMyFriendships(supabase).then(async (rows) => {
      setFriendships(rows);
      const ids = community.friendIdsFrom(rows, authUser.id);
      const profiles = await community.getProfilesByIds(supabase, ids);
      setFriendProfiles(ids.map((id) => profiles.get(id)).filter(Boolean));
    }).catch(() => {});
  }, [supabase, authUser, refresh]);

  useEffect(() => {
    if (!supabase || page || search) return;
    let active = true;
    setLoading(true);
    const run = async () => {
      if (tab === 'playlists') {
        const rows = await community.listPlaylists(supabase, { section: playlistSection });
        if (active) { setPlaylists(rows); setPosts([]); setCursor(null); }
      } else {
        const rows = await community.listFeedPosts(supabase, { kind: tab === 'question' || tab === 'review' ? tab : null, authorIds: tab === 'following' ? followingIds : null });
        if (active) { setPosts(tab === 'for-you' ? rankForYou(rows, { matchFor: (id) => { const p = productsById.get(String(id)); return p && quizAnswers ? getProfileMatchPercentForProduct(p, quizAnswers) : null; }, followingIds: new Set(followingIds) }) : rows); setCursor(rows.length === community.PAGE_SIZE ? community.nextCursor(rows, 'recent') : null); }
      }
    };
    run().catch((e) => { if (active) notifyError(e); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [supabase, tab, page, search, refresh, followingIds, productsById, quizAnswers, playlistSection]);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const rows = await community.listFeedPosts(supabase, { kind: tab === 'question' || tab === 'review' ? tab : null, authorIds: tab === 'following' ? followingIds : null, cursor });
      setPosts((prev) => [...prev, ...(tab === 'for-you' ? rankForYou(rows, { matchFor: (id) => { const p = productsById.get(String(id)); return p && quizAnswers ? getProfileMatchPercentForProduct(p, quizAnswers) : null; } }) : rows)]);
      setCursor(rows.length === community.PAGE_SIZE ? community.nextCursor(rows, 'recent') : null);
    } catch (e) { notifyError(e); } finally { setLoading(false); }
  };

  const openPost = async (post) => {
    setPage({ type: 'post', id: post.id }); setDetails(post); setError('');
    try { setComments(await community.listComments(supabase, post.id)); } catch (e) { notifyError(e); }
  };
  const openPlaylist = async (playlist) => {
    setEditingPlaylist(false); setProductId(null); setPage({ type: 'playlist', id: playlist.id }); setDetails(playlist); setError('');
    try { setItems(await community.listPlaylistItems(supabase, playlist.id)); } catch (e) { notifyError(e); }
  };
  const refreshPlaylist = async (id) => {
    const [next, nextItems] = await Promise.all([community.getPlaylist(supabase, id), community.listPlaylistItems(supabase, id)]);
    if (next) setDetails(next);
    setItems(nextItems);
    setRefresh((value) => value + 1);
  };
  const startPlaylistEdit = () => {
    setEditTitle(details.title || ''); setEditDescription(details.description || '');
    setEditVisibility(details.visibility || 'public'); setEditCoverMode('photo');
    setEditCoverText(''); setEditCoverPhoto(null); setEditingPlaylist(true);
  };
  const savePlaylist = async () => {
    if (!editTitle.trim() || !authUser || !details?.id) return;
    setBusy(true); setError('');
    let uploaded;
    try {
      const patch = { title: editTitle, description: editDescription, visibility: editVisibility };
      if (editCoverPhoto || editCoverMode === 'color') {
        const file = editCoverMode === 'photo' ? editCoverPhoto : await makePlaylistCoverFile(editCoverText || editTitle, editCoverColor);
        uploaded = await uploadCommunityImage(supabase, file, { folder: 'covers', userId: authUser.id });
        patch.coverUrl = uploaded.url;
      }
      await community.updatePlaylist(supabase, details.id, patch);
      await refreshPlaylist(details.id);
      setEditingPlaylist(false); setNotice('Playlist updated.');
    } catch (e) { if (uploaded) await deleteCommunityImage(supabase, uploaded.path); notifyError(e); }
    finally { setBusy(false); }
  };
  const addPlaylistProduct = async () => {
    if (!productId || !details?.id) return;
    setBusy(true); setError('');
    try { await community.addToPlaylist(supabase, details.id, productId); await refreshPlaylist(details.id); setProductId(null); setNotice('Product added.'); }
    catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  const removePlaylistProduct = async (id) => {
    if (!details?.id) return;
    setBusy(true); setError('');
    try { await community.removeFromPlaylist(supabase, details.id, id); await refreshPlaylist(details.id); setNotice('Product removed.'); }
    catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  const confirmDeletePlaylist = async () => {
    if (!deletePlaylistTarget) return;
    setBusy(true); setError('');
    try { await community.deletePlaylist(supabase, deletePlaylistTarget.id); setDeletePlaylistTarget(null); closePage(); setRefresh((value) => value + 1); setNotice('Playlist deleted.'); }
    catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  const openProfile = async (username) => {
    if (!username) return;
    setPage({ type: 'profile', id: username }); setError('');
    try { setDetails(await community.getProfileByUsername(supabase, username)); } catch (e) { notifyError(e); }
  };
  const openNotifications = async () => {
    if (!authUser) { requireAccount('notifications'); return; }
    setPage({ type: 'notifications' }); setError('');
    try { const rows = await community.listNotifications(supabase); setDetails(rows); await community.markNotificationsRead(supabase); } catch (e) { notifyError(e); }
  };

  const uploadAvatar = async (file) => {
    if (!authUser || !profile || !file) return;
    setBusy(true); setError('');
    try {
      checkImageFile(file);
      const uploaded = await uploadCommunityImage(supabase, file, { folder: 'avatars', userId: authUser.id });
      try {
        const next = await community.setAvatarPath(supabase, authUser.id, uploaded.path);
        setProfile(next); setDetails((previous) => previous?.user_id === authUser.id ? { ...previous, avatar_url: uploaded.path } : previous);
        setProfileById((previous) => new Map(previous).set(authUser.id, next));
        setNotice('Profile picture updated.');
      } catch (error) {
        await deleteCommunityImage(supabase, uploaded.path);
        throw error;
      }
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  const saveProfile = async () => {
    if (!authUser || !profileName.trim() || !profileHandle.trim()) return;
    setBusy(true); setError('');
    try {
      const next = await community.upsertCommunityProfile(supabase, authUser.id, { username: profileHandle, displayName: profileName });
      setProfile(next); setNotice('Profile saved');
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  const startProfileEdit = () => {
    setEditProfileName(profile?.display_name || '');
    setEditProfileHandle(profile?.username || '');
    setEditProfileBio(profile?.bio || '');
    setEditingProfile(true);
    setError('');
  };

  const saveProfileEdit = async () => {
    if (!authUser || !profile || !editProfileName.trim() || !editProfileHandle.trim()) return;
    if (editProfileName.trim().length > 50 || editProfileBio.trim().length > 160) {
      setError('Use up to 50 characters for your name and 160 for your bio.');
      return;
    }
    setBusy(true); setError('');
    try {
      const next = await community.upsertCommunityProfile(supabase, authUser.id, {
        username: editProfileHandle, displayName: editProfileName, bio: editProfileBio,
        avatarUrl: profile.avatar_url,
      });
      setProfile(next);
      setDetails((previous) => previous?.user_id === authUser.id ? next : previous);
      setProfileById((previous) => new Map(previous).set(authUser.id, next));
      setPage({ type: 'profile', id: next.username });
      setEditingProfile(false);
      setNotice('Community profile updated.');
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  const submit = async () => {
    if (busy) return;
    if (compose === 'playlist' ? !playlistTitle.trim() : compose !== 'recommend' && !body.trim()) return;
    if (compose === 'review' && !productId) { setError('Choose a product to review.'); return; }
    if (compose === 'recommend' && (!productId || !selectedFriendIds.length)) { setError('Choose a product and at least one friend.'); return; }
    if (!authUser && (compose === 'review' || compose === 'playlist' || compose === 'recommend')) { requireAccount(compose === 'review' ? 'reviews' : compose === 'playlist' ? 'playlists' : 'friend recommendations'); return; }
    if (authUser && !profile) { setError('Set up your community profile first.'); return; }
    setBusy(true); setError('');
    try {
      const client = authUser ? supabase : getGuestClient();
      const userId = authUser?.id || await ensureGuestSession();
      if (compose === 'recommend') {
        await community.sendRecommendations(client, userId, productId, selectedFriendIds, body);
        setCompose(null); setBody(''); setProductId(null); setSelectedFriendIds([]); setNotice('Recommendation sent to your friend.');
      } else if (compose === 'playlist') {
        let uploadedCover;
        try {
          if (coverMode === 'photo' && !coverPhoto) throw new Error('Choose a cover photo first.');
          const coverFile = coverMode === 'photo' ? coverPhoto : await makePlaylistCoverFile(coverText || playlistTitle, coverColor);
          uploadedCover = await uploadCommunityImage(client, coverFile, { folder: 'covers', userId });
          const result = await community.createPlaylist(client, userId, { title: playlistTitle, visibility: playlistVisibility, coverUrl: uploadedCover.url });
          if (productId) {
            try { await community.addToPlaylist(client, result.id, productId); } catch { setNotice('Playlist created, but the product could not be added.'); }
          }
          setCompose(null); setPlaylistTitle(''); setPlaylistVisibility('public'); setProductId(null); setCoverMode('color'); setCoverText(''); setCoverPhoto(null); setTab('playlists'); setRefresh((v) => v + 1); await openPlaylist(result);
        } catch (error) {
          if (uploadedCover) await deleteCommunityImage(client, uploadedCover.path);
          throw error;
        }
      } else {
        const product = productsById.get(String(productId));
        const topics = [...new Set([...extractHashtagTopics(body), ...suggestTopicsForProducts(product ? [product] : [])])].slice(0, 5);
        const media = [];
        let result;
        try {
          for (const photo of photos) media.push(await uploadCommunityImage(client, photo, { folder: 'posts' }));
          result = await community.createPost(client, userId, { kind: compose, body, topics, media, isAnonymous: !authUser || anonymous, productId: compose === 'review' ? productId : null, rating: compose === 'review' ? rating : null, taggedProductIds: compose === 'review' || !productId ? [] : [productId] });
        } catch (e) {
          await Promise.all(media.map((item) => deleteCommunityImage(client, item.path)));
          throw e;
        }
        setCompose(null); setBody(''); setProductId(null); setAnonymous(false); setPhotos([]); setRefresh((v) => v + 1);
        const post = await community.getFeedPost(client, result.id);
        if (post) await openPost(post);
      }
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  const submitComment = async () => {
    if (!commentBody.trim() || !details?.id) return;
    setBusy(true); setError('');
    try {
      const client = authUser ? supabase : getGuestClient();
      const userId = authUser?.id || await ensureGuestSession();
      await community.createComment(client, userId, { postId: details.id, parentId: replyTo, body: commentBody, isAnonymous: !authUser || anonymous, productId });
      setComments(await community.listComments(client, details.id)); setCommentBody(''); setReplyTo(null); setProductId(null);
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  const togglePost = async (post, kind) => {
    if (!authUser) { requireAccount(kind === 'save' ? 'saved posts' : 'reactions'); return; }
    try {
      const on = !post[kind === 'save' ? 'viewer_saved' : 'viewer_found_helpful'];
      if (kind === 'save') await community.setSaved(supabase, authUser.id, post.id, on);
      else await community.setHelpful(supabase, authUser.id, { postId: post.id }, on);
      setRefresh((v) => v + 1);
      if (page?.type === 'post') setDetails(await community.getFeedPost(supabase, post.id));
    } catch (e) { notifyError(e); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || busy) return;
    setBusy(true); setError('');
    try {
      const client = authUser ? supabase : getGuestClient();
      const userId = authUser?.id || await getGuestId();
      if (!client || !userId) throw new Error('Please sign in again to delete this post.');
      await community.deletePost(client, deleteTarget.id, userId);
      setPosts((previous) => previous.filter((post) => post.id !== deleteTarget.id));
      if (page?.type === 'post' && page.id === deleteTarget.id) closePage();
      setDeleteTarget(null); setNotice('Post deleted.'); setRefresh((value) => value + 1);
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  const submitReport = async () => {
    if (!reportPost) return;
    setBusy(true); setError('');
    try {
      const client = authUser ? supabase : getGuestClient();
      const userId = authUser?.id || await ensureGuestSession();
      await community.fileReport(client, userId, { targetType: 'post', postId: reportPost.id, reason: reportReason });
      setReportPost(null); setNotice('Report sent. Thank you for helping keep Community safe.');
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  useEffect(() => {
    if (search.trim().length < 2 || !supabase) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const results = await community.searchCommunity(supabase, search);
        if (active) setSearchResults(results);
      } catch (e) { if (active) notifyError(e); }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, supabase]);

  const renderPost = (post) => {
    const authorName = post.is_anonymous || !post.author_id ? 'Anonymous' : post.author_display_name || post.author_username || 'Community member';
    const postKind = post.kind === 'question' ? 'Question' : post.kind === 'review' ? 'Review' : null;
    return <article className="am-card am-post-card" key={post.id}>
      <div className="am-post-head">
        <div className="am-author">
          <CommunityAvatar name={authorName} path={!post.is_anonymous && post.author_id ? profileById.get(post.author_id)?.avatar_url : null} anonymous={post.is_anonymous || !post.author_id} />
          <div className="am-author-copy">
            {post.is_anonymous || !post.author_username ? <strong>{authorName}</strong> : <button type="button" onClick={() => openProfile(post.author_username)}>{authorName}</button>}
            <small>{timeLabel(post.created_at)}{postKind ? ` · ${postKind}` : ''}</small>
          </div>
        </div>
        <div className="am-post-menu-wrap">
          <button type="button" className="am-icon-button" aria-label={`More options for ${authorName}'s post`} aria-expanded={postMenuId === post.id} onClick={() => setPostMenuId((id) => id === post.id ? null : post.id)}><CommunityIcon name="more" /></button>
          {postMenuId === post.id && <div className="am-post-menu"><button type="button" onClick={() => { setPostMenuId(null); if (post.is_mine) setDeleteTarget(post); else setReportPost(post); }}>{post.is_mine ? 'Delete post' : 'Report post'}</button></div>}
        </div>
      </div>
      <button type="button" className="am-postbody" onClick={() => openPost(post)}>{post.body}</button>
      {(post.media || []).length > 0 && <button type="button" className="am-photo-grid" onClick={() => openPost(post)} aria-label="Open post photos">{post.media.slice(0, 4).map((photo) => <img key={photo.path} src={publicMediaUrl(photo.path)} alt="" loading="lazy" />)}</button>}
      {post.kind === 'review' && <small className="am-kind">Rated {post.rating || 0} out of 5</small>}
      {postProductIds(post).slice(0, 1).map((id) => <ProductMention key={id} productId={id} productsById={productsById} quizAnswers={quizAnswers} onOpenProduct={onOpenProduct} />)}
      <div className="am-actions">
        <button type="button" aria-pressed={Boolean(post.viewer_found_helpful)} onClick={() => togglePost(post, 'helpful')}><CommunityIcon name="heart" /><span>{post.kind === 'post' ? 'Like' : 'Helpful'}{post.helpful_count ? ` ${post.helpful_count}` : ''}</span></button>
        <button type="button" onClick={() => openPost(post)}><CommunityIcon name="comment" /><span>Reply{post.comment_count ? ` ${post.comment_count}` : ''}</span></button>
        <button type="button" aria-pressed={Boolean(post.viewer_saved)} onClick={() => togglePost(post, 'save')}><CommunityIcon name="bookmark" /><span>{post.viewer_saved ? 'Saved' : 'Save'}</span></button>
      </div>
    </article>;
  };

  const renderEmpty = () => {
    const copy = {
      'for-you': ['A space to share and discover', 'Ask a question, share something you learned, or see what others are talking about.', 'Write a post', 'post'],
      following: ['Your people will show up here', 'Visit someone’s profile to follow them and keep up with their posts.', 'Explore the community', null],
      question: ['Start with a question', 'The community is here for the things you are curious about.', 'Ask a question', 'question'],
      review: ['Real experiences start here', 'Share what you thought of a product so others can learn from it.', 'Write a review', 'review'],
      playlists: ['Collect your favorites', 'Make a playlist of products you would recommend or want to try.', 'Create a playlist', 'playlist'],
    }[tab];
    return <div className="am-empty-state ayna-figma-community-empty"><small>COMMUNITY / {tab === 'for-you' ? 'START HERE' : tab.toUpperCase()}</small><h2>{copy[0]}</h2><p>{copy[1]}</p><button type="button" onClick={() => copy[3] ? openCompose(copy[3]) : setTab('for-you')}>{copy[2]} <span aria-hidden="true">→</span></button></div>;
  };

  if (!supabase) return <div className="am-screen"><MobileHeader activeTab="community" onGoBrowse={onGoBrowse} onGoEco={onGoEco} /><p className="am-empty">Community is unavailable right now.</p></div>;
  return <div className="am-screen">
    <MobileHeader activeTab="community" initial={headerInitial} onGoBrowse={onGoBrowse} onGoEco={onGoEco} onGoCommunity={() => {}} onOpenSaved={onOpenSaved} onOpenProfile={onOpenProfile} />
    <div className="am-scroll">
      <div className="am-top"><div className="am-title"><small>AYNA TOGETHER</small><h1>{page ? (page.type === 'notifications' ? 'Notifications' : page.type === 'playlist' ? 'Playlist' : page.type === 'profile' ? 'Profile' : 'Conversation') : 'Community'}</h1></div><div className="am-top-actions"><button type="button" className="am-icon-button" onClick={() => authUser ? (profile ? openProfile(profile.username) : setNotice('Create your community profile below.')) : requireAccount('your Community profile')} aria-label="Community profile"><CommunityAvatar name={profile?.display_name || 'You'} path={profile?.avatar_url} /></button><button type="button" className="am-icon-button" onClick={openNotifications} aria-label="Notifications"><CommunityIcon name="bell" /></button></div></div>
      {error && <p className="am-error" role="alert">{error}</p>}{notice && <p className="am-notice" role="status">{notice}</p>}
      {page ? <>
        <button type="button" className="am-back" onClick={closePage}>← Community</button>
        {page.type === 'post' && details && <>{renderPost(details)}<h2 className="am-section">Replies</h2>{comments.map((c) => <div className="am-comment" key={c.id}><div className="am-meta"><div className="am-author"><CommunityAvatar name={c.author_display_name || c.author_username} path={!c.is_anonymous && c.author_id ? profileById.get(c.author_id)?.avatar_url : null} anonymous={c.is_anonymous || !c.author_id} /><span>{c.is_anonymous || !c.author_id ? 'Anonymous' : c.author_display_name || c.author_username}</span></div><span>{timeLabel(c.created_at)}</span></div><p>{c.body}</p>{c.product_id && <ProductMention productId={c.product_id} productsById={productsById} quizAnswers={quizAnswers} onOpenProduct={onOpenProduct} />}<button type="button" onClick={() => setReplyTo(c.id)}>Reply</button></div>)}<div className="am-compose-inline">{replyTo && <button type="button" onClick={() => setReplyTo(null)}>Replying · cancel</button>}<textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Add to the conversation" /><ProductPicker products={products} value={productId} onChange={setProductId} /><button type="button" className="am-primary" disabled={busy || !commentBody.trim()} onClick={submitComment}>Post reply</button></div></>}
        {page.type === 'playlist' && details && <>
          {details.cover_url && <img className="am-cover-detail" src={publicMediaUrl(details.cover_url)} alt="Playlist cover" />}
          <h2 className="am-detail-title">{details.title}</h2>
          {details.description && <p className="am-detail-copy">{details.description}</p>}
          {authUser?.id === details.owner_id && <div className="am-playlist-owner-actions">
            <button type="button" className="am-secondary" onClick={startPlaylistEdit}>Edit playlist</button>
            <button type="button" className="am-secondary" onClick={() => setDeletePlaylistTarget(details)}>Delete playlist</button>
          </div>}
          {items.map((item) => <div className="am-playlist-item" key={item.product_id}>
            <ProductMention productId={item.product_id} productsById={productsById} quizAnswers={quizAnswers} onOpenProduct={onOpenProduct} />
            {authUser?.id === details.owner_id && <button type="button" disabled={busy} onClick={() => removePlaylistProduct(item.product_id)}>Remove</button>}
          </div>)}
          {items.length === 0 && <p className="am-empty">No products added yet.</p>}
          {authUser?.id === details.owner_id && <div className="am-card am-playlist-add">
            <h3>Add a product</h3><ProductPicker products={products.filter((item) => !items.some((saved) => String(saved.product_id) === String(item.id)))} value={productId} onChange={setProductId} />
            <button type="button" className="am-primary" disabled={busy || !productId} onClick={addPlaylistProduct}>Add to playlist</button>
          </div>}
        </>}
        {page.type === 'profile' && details && <><div className="am-profile-hero"><CommunityAvatar name={details.display_name} path={details.avatar_url} /><div><h2 className="am-detail-title">{details.display_name}</h2><p className="am-detail-copy">@{details.username}</p></div></div>{authUser?.id === details.user_id && <div className="am-profile-owner"><button type="button" className="am-secondary" onClick={startProfileEdit}>Edit profile</button><label className="am-avatar-upload">Change profile picture<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadAvatar(file); event.target.value = ''; }} /></label></div>}{details.bio && <p>{details.bio}</p>}{authUser && details.user_id !== authUser.id && <div className="am-profile-actions"><button type="button" className="am-primary" onClick={async () => { try { const on = !followingIds.includes(details.user_id); await community.setFollowing(supabase, authUser.id, details.user_id, on); setFollowingIds((ids) => on ? [...ids, details.user_id] : ids.filter((id) => id !== details.user_id)); } catch (e) { notifyError(e); } }}>{followingIds.includes(details.user_id) ? 'Following' : 'Follow'}</button><button type="button" className="am-secondary" onClick={async () => { try { const state = community.friendshipState(friendships, authUser.id, details.user_id); if (state.state === 'none') await community.sendFriendRequest(supabase, authUser.id, details.user_id); else if (state.state === 'incoming') await community.acceptFriendRequest(supabase, state.row.id); else return; setRefresh((v) => v + 1); } catch (e) { notifyError(e); } }}>{({ none: 'Add friend', incoming: 'Accept request', requested: 'Requested', friends: 'Friends' })[community.friendshipState(friendships, authUser.id, details.user_id).state]}</button></div>}</>}
        {page.type === 'notifications' && (details || []).map((n) => <div className="am-card" key={n.id}><p>{n.message || n.body || n.type?.replace(/_/g, ' ')}</p><small>{timeLabel(n.created_at)}</small></div>)}
        {page.type === 'profile' && details && !authUser && <div className="am-profile-actions"><button type="button" className="am-primary" onClick={() => requireAccount('following people')}>Follow</button><button type="button" className="am-secondary" onClick={() => requireAccount('friends')}>Add friend</button></div>}
      </> : <>
        {authUser && !profile && <div className="am-card am-profile-setup"><strong>Make your community profile</strong><p>Your health profile stays private.</p><input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Display name" /><input value={profileHandle} onChange={(e) => setProfileHandle(e.target.value)} placeholder="Username" /><button type="button" disabled={busy} onClick={saveProfile}>Save profile</button></div>}
        <div className="am-search"><CommunityIcon name="search" size={19} /><input value={search} onChange={(e) => { setSearch(e.target.value); setSearchResults(null); }} placeholder="Search people, posts, playlists" aria-label="Search Community" />{search && <button type="button" aria-label="Clear search" onClick={() => { setSearch(''); setSearchResults(null); }}>×</button>}</div>
        {search ? <div className="am-search-results">{search.trim().length < 2 ? <p className="am-search-message">Type at least two letters to search Community.</p> : !searchResults ? <p className="am-search-message">Searching Community…</p> : <>
          {searchResults.people.length > 0 && <section><h2>People</h2>{searchResults.people.map((p) => <button type="button" className="am-list-row" key={p.user_id} onClick={() => openProfile(p.username)}><CommunityAvatar name={p.display_name} path={p.avatar_url} /><span>{p.display_name}<small>@{p.username}</small></span></button>)}</section>}
          {searchResults.posts.length > 0 && <section><h2>Posts</h2>{searchResults.posts.map(renderPost)}</section>}
          {searchResults.playlists.length > 0 && <section><h2>Playlists</h2>{searchResults.playlists.map((p) => <button type="button" className="am-list-row" key={p.id} onClick={() => openPlaylist(p)}><span className="am-cover">{p.cover_url ? <img src={publicMediaUrl(p.cover_url)} alt="" /> : 'ayna'}</span><span>{p.title}<small>{p.item_count} products</small></span></button>)}</section>}
          {!searchResults.people.length && !searchResults.posts.length && !searchResults.playlists.length && <div className="am-empty-state am-search-empty"><h2>No results yet</h2><p>Try a person’s name, product topic, or playlist title.</p></div>}
        </>}</div> : <>
          <div className="am-tabs" role="tablist" aria-label="Community sections">{TABS.map(([key, label]) => <button type="button" role="tab" aria-selected={tab === key} key={key} className={tab === key ? 'is-active' : ''} onClick={() => key === 'following' && !authUser ? requireAccount('your following feed') : setTab(key)}>{label}</button>)}</div>
          {tab === 'for-you' && posts.length === 0 && !loading && <section className="ayna-figma-community-start" aria-label="Explore Community">
            <small>FOR YOU / COMMUNITY</small>
            <h2>Real questions.<br />More context.</h2>
            <p>Read experiences from other people, then add your own when you are ready.</p>
            <button type="button" onClick={() => setTab('question')}>Explore questions <span aria-hidden="true">→</span></button>
            <div><button type="button" onClick={() => setTab('review')}>Browse reviews</button><button type="button" onClick={() => setTab('playlists')}>See playlists</button></div>
          </section>}
          {tab === 'for-you' && posts.length > 0 && <button type="button" className="am-share-prompt" onClick={() => openCompose('post')}><CommunityAvatar name={profile?.display_name || 'You'} path={profile?.avatar_url} /><span>Share with the community</span><span className="am-share-plus"><CommunityIcon name="plus" size={18} /></span></button>}
          {tab === 'playlists' ? <><div className="am-list-heading"><h2>{playlistSection === 'mine' ? 'My playlists' : playlistSection === 'friends' ? 'Shared by friends' : 'Made by the community'}</h2><button type="button" onClick={() => openCompose('playlist')}>Create playlist</button></div><div className="am-playlist-switch"><button type="button" aria-pressed={playlistSection === 'recent'} onClick={() => setPlaylistSection('recent')}>Community</button><button type="button" aria-pressed={playlistSection === 'friends'} onClick={() => authUser ? setPlaylistSection('friends') : requireAccount('friends-only playlists')}>Friends</button><button type="button" aria-pressed={playlistSection === 'mine'} onClick={() => authUser ? setPlaylistSection('mine') : requireAccount('your playlists')}>My playlists</button></div><div className="am-playlist-grid">{playlists.map((p) => <button type="button" className="am-playlist" key={p.id} onClick={() => openPlaylist(p)}><span className="am-cover">{p.cover_url ? <img src={publicMediaUrl(p.cover_url)} alt="" loading="lazy" /> : <span>ayna</span>}</span><span className="am-playlist-copy"><strong>{p.title}</strong><small>{p.item_count || 0} products</small><small>by {p.owner_display_name || 'ayna community'}</small></span></button>)}</div>{!loading && playlists.length === 0 && renderEmpty()}</> : <>{posts.map(renderPost)}{!loading && posts.length === 0 && tab !== 'for-you' && renderEmpty()}{cursor && <button type="button" className="am-more" disabled={loading} onClick={loadMore}>Show more posts</button>}</>}
          {loading && <p className="am-empty">Loading…</p>}
        </>}
      </>}
    </div>
    {editingPlaylist && <div className="am-sheet-backdrop" onClick={() => setEditingPlaylist(false)}><div className="am-sheet am-compose-sheet" role="dialog" aria-modal="true" aria-label="Edit playlist" onClick={(e) => e.stopPropagation()}>
      <div className="am-sheet-head"><h2>Edit playlist</h2><button type="button" aria-label="Close" onClick={() => setEditingPlaylist(false)}>×</button></div>
      <label className="am-field-label" htmlFor="am-edit-playlist-title">Playlist name</label><input id="am-edit-playlist-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
      <label className="am-field-label" htmlFor="am-edit-playlist-description">Description</label><textarea id="am-edit-playlist-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="What is this collection for?" />
      <PlaylistAudiencePicker id="am-edit-playlist-visibility" value={editVisibility} onChange={setEditVisibility} />
      <PlaylistCoverPicker title={editTitle} mode={editCoverMode} onMode={setEditCoverMode} color={editCoverColor} onColor={setEditCoverColor} text={editCoverText} onText={setEditCoverText} photo={editCoverPhoto} onPhoto={setEditCoverPhoto} existingCoverUrl={publicMediaUrl(details?.cover_url)} />
      <button type="button" className="am-primary" disabled={busy || !editTitle.trim()} onClick={savePlaylist}>{busy ? 'Saving…' : 'Save changes'}</button>
    </div></div>}
    {editingProfile && <div className="am-sheet-backdrop" onClick={() => setEditingProfile(false)}><div className="am-sheet am-compose-sheet" role="dialog" aria-modal="true" aria-label="Edit community profile" onClick={(e) => e.stopPropagation()}>
      <div className="am-sheet-head"><h2>Edit profile</h2><button type="button" aria-label="Close" onClick={() => setEditingProfile(false)}>×</button></div>
      <p className="am-detail-copy">This is your public Community profile. Your health answers stay private.</p>
      <label className="am-field-label" htmlFor="am-profile-display-name">Display name</label>
      <input id="am-profile-display-name" value={editProfileName} maxLength={50} onChange={(event) => setEditProfileName(event.target.value)} />
      <label className="am-field-label" htmlFor="am-profile-username">Username</label>
      <input id="am-profile-username" value={editProfileHandle} maxLength={24} autoCapitalize="none" onChange={(event) => setEditProfileHandle(event.target.value.toLowerCase())} />
      <small className="am-profile-help">You can change your username once every 30 days.</small>
      <label className="am-field-label" htmlFor="am-profile-bio">Bio</label>
      <textarea id="am-profile-bio" value={editProfileBio} maxLength={160} onChange={(event) => setEditProfileBio(event.target.value)} placeholder="A little about you" />
      <small className="am-profile-help">{editProfileBio.length}/160</small>
      {error && <p className="am-error" role="alert">{error}</p>}
      <button type="button" className="am-primary" disabled={busy || !editProfileName.trim() || !editProfileHandle.trim()} onClick={saveProfileEdit}>{busy ? 'Saving…' : 'Save profile'}</button>
    </div></div>}
    {deletePlaylistTarget && <div className="am-sheet-backdrop" onClick={() => setDeletePlaylistTarget(null)}><div className="am-sheet" role="dialog" aria-modal="true" aria-label="Delete playlist" onClick={(e) => e.stopPropagation()}><div className="am-sheet-head"><h2>Delete playlist?</h2><button type="button" aria-label="Close" onClick={() => setDeletePlaylistTarget(null)}>×</button></div><p className="am-detail-copy">This removes the playlist and its product list. This cannot be undone.</p><button type="button" className="am-primary" disabled={busy} onClick={confirmDeletePlaylist}>{busy ? 'Deleting…' : 'Delete playlist'}</button><button type="button" className="am-secondary" onClick={() => setDeletePlaylistTarget(null)}>Cancel</button></div></div>}
    {deleteTarget && <div className="am-sheet-backdrop" onClick={() => setDeleteTarget(null)}><div className="am-sheet" onClick={(e) => e.stopPropagation()}><div className="am-sheet-head"><h2>Delete post?</h2><button type="button" onClick={() => setDeleteTarget(null)}>×</button></div><p className="am-detail-copy">This will remove your post and its replies from Community.</p><button type="button" className="am-primary" disabled={busy} onClick={confirmDelete}>{busy ? 'Deleting…' : 'Delete post'}</button><button type="button" className="am-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button></div></div>}
    {reportPost && <div className="am-sheet-backdrop" onClick={() => setReportPost(null)}><div className="am-sheet" onClick={(e) => e.stopPropagation()}><div className="am-sheet-head"><h2>Report post</h2><button type="button" onClick={() => setReportPost(null)}>×</button></div><p className="am-detail-copy">Tell us what needs review.</p><select value={reportReason} onChange={(e) => setReportReason(e.target.value)}><option value="misinformation">Health misinformation</option><option value="harassment">Harassment</option><option value="spam">Spam</option><option value="other">Something else</option></select><button type="button" className="am-primary" disabled={busy} onClick={submitReport}>Send report</button></div></div>}
    {compose && <div className="am-sheet-backdrop" onClick={() => setCompose(null)}><div className="am-sheet am-compose-sheet" role="dialog" aria-modal="true" aria-label="Create in Community" onClick={(e) => e.stopPropagation()}>
      <div className="am-sheet-head"><div><small>SHARE YOUR VOICE</small><h2>{({ post: 'New post', question: 'Ask a question', review: 'Write a review', playlist: 'Create a playlist', recommend: 'Recommend a product' })[compose]}</h2></div><button type="button" aria-label="Close" onClick={() => setCompose(null)}>×</button></div>
      <div className="am-type-row" aria-label="What would you like to share?">{[['post','Post'],['question','Question'],['review','Review'],['playlist','Playlist'],['recommend','Recommend']].map(([kind,label]) => <button type="button" key={kind} className={compose === kind ? 'is-active' : ''} aria-pressed={compose === kind} onClick={() => { if (!authUser && ['review','playlist','recommend'].includes(kind)) { requireAccount(kind === 'review' ? 'reviews' : kind === 'playlist' ? 'playlists' : 'friend recommendations'); return; } setCompose(kind); setError(''); }}>{label}</button>)}</div>
      {compose === 'playlist' ? <><label className="am-field-label" htmlFor="am-playlist-name">Playlist name</label><input id="am-playlist-name" value={playlistTitle} onChange={(e) => setPlaylistTitle(e.target.value)} placeholder="e.g. My everyday essentials" /><PlaylistAudiencePicker id="am-new-playlist-visibility" value={playlistVisibility} onChange={setPlaylistVisibility} /><PlaylistCoverPicker title={playlistTitle} mode={coverMode} onMode={setCoverMode} color={coverColor} onColor={setCoverColor} text={coverText} onText={setCoverText} photo={coverPhoto} onPhoto={setCoverPhoto} /></> : <><label className="am-field-label" htmlFor="am-post-text">{compose === 'question' ? 'Your question' : compose === 'review' ? 'Your experience' : compose === 'recommend' ? 'A note to your friends' : 'Your post'}</label><textarea id="am-post-text" value={body} onChange={(e) => setBody(e.target.value)} placeholder={compose === 'question' ? 'What would you like to ask? Add #topics if helpful.' : compose === 'review' ? 'How was it for you?' : compose === 'recommend' ? 'Add a note (optional)' : 'What’s on your mind? Add #topics if helpful.'} />{hashtagSuggestions.length > 0 && <div className="am-hashtags" aria-label="Suggested hashtags">{hashtagSuggestions.map((tag) => <button type="button" key={tag.key} onClick={() => setBody((text) => text.replace(/#(?:[A-Za-z][\w-]*)?$/, `${tag.tag} `))}>{tag.tag}</button>)}</div>}</>}
      {compose === 'review' && <label className="am-rating">Your rating <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} out of 5</option>)}</select></label>}
      <ProductPicker products={products} value={productId} onChange={setProductId} />
      {compose !== 'playlist' && compose !== 'recommend' && <label className="am-photo-input"><strong>Add photos</strong><span>Up to 4 images</span><span className="am-photo-cta">Choose photos</span><input type="file" accept="image/*" multiple onChange={(e) => { try { const files = Array.from(e.target.files || []).slice(0, MAX_POST_PHOTOS); files.forEach(checkImageFile); setPhotos(files); setError(''); } catch (error) { setError(error.message); } }} />{photos.length > 0 && <small>{photos.map((file) => file.name).join(', ')}</small>}</label>}
      {compose === 'recommend' && <div className="am-friends"><strong>Send to friends</strong>{friendProfiles.length ? friendProfiles.map((friend) => <label key={friend.user_id}><input type="checkbox" checked={selectedFriendIds.includes(friend.user_id)} onChange={(e) => setSelectedFriendIds((ids) => e.target.checked ? [...ids, friend.user_id] : ids.filter((id) => id !== friend.user_id))} /> {friend.display_name || friend.username}</label>) : <p>Add friends in Community profiles first.</p>}</div>}
      {authUser && compose !== 'playlist' && compose !== 'recommend' && <label className="am-anon"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Post anonymously</label>}
      {error && <p className="am-error" role="alert">{error}</p>}
      <button type="button" className={`am-primary am-submit${compose === 'playlist' ? ' am-submit-static' : ''}`} disabled={busy} onClick={submit}>{busy ? 'Sharing…' : compose === 'playlist' ? 'Create playlist' : compose === 'recommend' ? 'Send recommendation' : compose === 'question' ? 'Ask question' : compose === 'review' ? 'Post review' : 'Share post'}</button>
    </div></div>}
  </div>;
}
