import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getSupabaseClient } from '../utils/supabaseClient';
import { getGuestClient, getGuestId, ensureGuestSession } from '../utils/community/guestClient.js';
import * as community from '../utils/community/communityStore.js';
import { rankForYou, postProductIds } from '../utils/community/ranking.js';
import { extractHashtagTopics, suggestHashtags, suggestTopicsForProducts } from '../utils/community/topics.js';
import { uploadCommunityImage, deleteCommunityImage, checkImageFile, MAX_POST_PHOTOS, publicMediaUrl } from '../utils/community/imageUpload.js';
import { makePlaylistCoverFile } from '../mobile/components/playlistCoverImage.js';
import { CATEGORY_LABELS, getProfileMatchPercentForProduct, getProductMatchDetailsForProduct } from '../data/products';
import { scoreSearchMatch } from '../utils/search/index.js';
import { searchCommunityTolerant } from '../utils/search/communitySearch.js';
import SmartSearchInput from './search/SmartSearchInput.jsx';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import { customProductId, customProductName } from '../utils/customProductTag.js';
import { RuleField, CommunityRulesList } from './community/RuleField.jsx';
import { VerifiedBadge } from './community/VerifiedBadge.jsx';
import { toast } from '../utils/toast';
import { useTeamBadges } from './community/useTeamBadges.js';
import Announcements from './community/Announcements.jsx';
import { breaksCommunityRules } from '../utils/communityRules.js';
import { markPerf } from '../utils/perfTimings';
import './WebCommunity.css';
import '../styles/audit-community.css';
import '../styles/verify-content.css';
import '../styles/community2.css';

// The app's Community, built for the website. Same data and rules (shared
// community store, ranking, topics, guest posting). Three columns on wide
// screens: feeds + you on the left, the feed in the middle, and side modules
// built only from loaded data on the right (each hides when it has nothing).

const TABS = [['for-you', 'For you'], ['following', 'Following'], ['question', 'Questions'], ['review', 'Reviews'], ['playlists', 'Playlists']];
const VERB = { post: 'Post', question: 'Ask', review: 'Review', playlist: 'Playlist', recommend: 'Recommend' };
const KIND_TITLES = { post: 'New post', question: 'Ask a question', review: 'Write a review', playlist: 'Create a playlist', recommend: 'Recommend a product' };
const COVER_COLORS = ['#1D1A2B', '#B9C2F4', '#F7BADD', '#BDEBD6', '#F7E78E'];
const AUDIENCE = [['public', 'Everyone'], ['friends', 'Friends only'], ['private', 'Only me']];
const POST_MAX = 2000;
const COMMENT_MAX = 1000;
const BIO_MAX = 160;
const SUGGESTED_MAX = 5;
const PROFILE_LIST_MAX = 30;
const KIND_TAG = { question: 'Question', review: 'Review', post: 'Post', playlist: 'Playlist' };
const SIDE_MAX = 3;
const TOPICS_MAX = 8;
const loadArticles = () => import('./Articles.jsx').then((m) => m.ARTICLES || []);
const timeLabel = (v) => (v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '');

function Avatar({ name, path, anonymous = false, size = 40 }) {
  const [failed, setFailed] = useState(false);
  const initials = anonymous ? 'A' : String(name || 'A').split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return <span className="wc-avatar" style={{ width: size, height: size, fontSize: Math.max(14, Math.round(size * 0.32)) }} aria-hidden="true">{path && !failed ? <img src={publicMediaUrl(path)} alt="" onError={() => setFailed(true)} /> : initials}</span>;
}

const ICONS = {
  heart: <path d="M20.5 8.5c0 4.2-8.5 10-8.5 10s-8.5-5.8-8.5-10a4.5 4.5 0 0 1 8.5-2 4.5 4.5 0 0 1 8.5 2Z" />,
  comment: <path d="M20 11.5a8 8 0 0 1-8 8 8.4 8.4 0 0 1-3.3-.7L4 20l1.2-4.7A8 8 0 1 1 20 11.5Z" />,
  bookmark: <path d="M6 4.5h12v15l-6-4-6 4v-15Z" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9Z" /><path d="M10 21h4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  more: <><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>,
};
function Icon({ name, size = 18 }) {
  return <svg className="wc-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name]}</svg>;
}
const STAR_PATH = 'M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z';
function Star({ on, size = 18 }) {
  return <svg className={`wc-star${on ? ' is-on' : ''}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d={STAR_PATH} fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}
function Stars({ value = 0, size = 18 }) {
  const n = Math.max(0, Math.min(5, Number(value) || 0));
  return <span className="wc-stars" role="img" aria-label={`Rated ${n} out of 5`}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} on={i <= n} size={size} />)}</span>;
}
function Check({ checked, onChange, children }) {
  return <label className="wc-check">
    <input type="checkbox" className="wc-check-input" checked={checked} onChange={onChange} />
    <span className="wc-check-box" aria-hidden="true"><Icon name="check" size={14} /></span>
    <span className="wc-check-text">{children}</span>
  </label>;
}
function Counter({ length, max }) {
  if (length < max * 0.8) return null;
  return <small className={`wc-counter${length >= max ? ' is-max' : ''}`} aria-live="polite">{length} / {max}</small>;
}
function SkeletonPost() {
  return <div className="wc-skel-post" aria-hidden="true"><div className="wc-skel-row"><span className="wc-skel-dot" /><span className="wc-skel-line is-short" /></div><span className="wc-skel-line" /><span className="wc-skel-line is-mid" /></div>;
}
function SkeletonPlaylists() {
  return <div className="wc-pl-grid" aria-hidden="true">{[0, 1, 2, 3].map((i) => <div key={i} className="wc-skel-pl"><span className="wc-skel-cover" /><span className="wc-skel-line is-mid" /><span className="wc-skel-line is-short" /></div>)}</div>;
}

function Mention({ productId, productsById, quizResults, onOpenProduct, hideView = false }) {
  const product = productsById.get(String(productId));
  if (!product) {
    const customName = customProductName(String(productId || ''));
    if (!customName) return null;
    return <span className="wc-mention is-custom">
      <span className="wc-mention-photo" aria-hidden="true">{customName.slice(0, 1).toUpperCase()}</span>
      <span><strong>{customName}</strong><small>Not in the ayna catalog yet</small></span>
    </span>;
  }
  const match = quizResults ? getProductMatchDetailsForProduct(product, quizResults) : null;
  const show = match?.matchStatus === 'scored' && Number.isFinite(match.percent);
  return <button type="button" className="wc-mention" onClick={() => onOpenProduct(product)}>
    <span className="wc-mention-photo"><ProductTileImage product={product} imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} letterNode={<ProductImageFallback style={{ position: 'absolute', inset: 0 }} />} /></span>
    <span><strong>{product.name}</strong><small>{product.brand || 'ayna product'}</small></span>
    {show ? <em className="wc-match"><b>{match.percent}%</b> match</em> : !hideView && <em className="wc-view">View</em>}
  </button>;
}

function Tag({ kind }) {
  return <span className={`wc-tag is-${kind in KIND_TAG ? kind : 'post'}`}>{KIND_TAG[kind] || KIND_TAG.post}</span>;
}

// Playlist cover: the uploaded cover, or up to four product photos on white tiles.
function PlaylistCover({ playlist, productsById, big = false }) {
  if (playlist.cover_url) return <span className={`wc-cover${big ? ' is-big' : ''}`}><img src={publicMediaUrl(playlist.cover_url)} alt="" loading="lazy" /></span>;
  const picks = (playlist.preview_product_ids || []).map((id) => productsById.get(String(id))).filter(Boolean).slice(0, 4);
  if (!picks.length) return <span className={`wc-cover${big ? ' is-big' : ''}`}>ayna</span>;
  return <span className={`wc-cover is-mosaic${big ? ' is-big' : ''}`}>{picks.map((p) => <span key={p.id} className="wc-cover-tile"><ProductTileImage product={p} imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} letterNode={<ProductImageFallback style={{ position: 'absolute', inset: 0 }} />} /></span>)}</span>;
}

function Picker({ products, value, onChange, placeholder = 'Mention a product (optional)' }) {
  const [q, setQ] = useState('');
  const matches = useMemo(() => {
    const t = q.trim();
    if (t.length < 2) return [];
    return products.map((p) => ({ p, s: scoreSearchMatch(t, p) }))
      .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 8).map((x) => x.p);
  }, [products, q]);
  const selected = products.find((p) => String(p.id) === String(value));
  const selectedName = selected?.name || customProductName(String(value || ''));
  const draft = q.trim().replace(/\s+/g, ' ');
  const exact = matches.some((p) => String(p.name || '').trim().toLowerCase() === draft.toLowerCase());
  const addCustom = () => { const id = customProductId(draft); if (id) { onChange(id); setQ(''); } };
  if (selectedName) return <div className="wc-picked"><span>{selectedName}</span><button type="button" onClick={() => { onChange(null); setQ(''); }}>Remove</button></div>;
  return <div className="wc-picker">
    <SmartSearchInput value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.length >= 2) { e.preventDefault(); if (matches.length && exact) { onChange(matches[0].id); setQ(''); } else addCustom(); } }} placeholder={placeholder} aria-label="Find a product" />
    {draft.length >= 2 && <div className="wc-results">
      {!exact && <button type="button" className="is-add" onClick={addCustom}>+ Add “{draft}”<small>{matches.length ? 'Not listed? Tag it anyway' : 'Not in the ayna catalog yet'}</small></button>}
      {matches.map((p) => <button type="button" key={p.id} onClick={() => { onChange(p.id); setQ(''); }}>{p.name}<small>{[p.brand, p.category?.replace(/-/g, ' ')].filter(Boolean).join(' · ')}</small></button>)}
    </div>}
  </div>;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Modal dialog: labelled by its title, focus moves in on open (to [data-autofocus]
// when present), Tab stays inside, Escape closes, focus returns on close.
// Rendered inside .app-container so it picks up the site tokens and dark mode.
function Sheet({ title, onClose, children, className = '' }) {
  const ref = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const opener = document.activeElement;
    const node = ref.current;
    const first = node?.querySelector('[data-autofocus]') || node?.querySelector(FOCUSABLE);
    (first || node)?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) { e.preventDefault(); return; }
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === a || !node.contains(document.activeElement))) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && (document.activeElement === z || !node.contains(document.activeElement))) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    };
  }, []);
  const host = document.querySelector('.app-container') || document.body;
  return createPortal(<div className="wc-sheet-backdrop" onClick={onClose}><div ref={ref} tabIndex={-1} className={`wc-sheet${className ? ` ${className}` : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
    <header><h2 id={titleId}>{title}</h2><button type="button" className="wc-sheet-close" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button></header>{children}
  </div></div>, host);
}

export default function WebCommunity({ user, products = [], quizResults = null, onOpenProduct, onOpenArticle, onRequireAuth, seedKind = null, seedProductId = null, initialProfileHandle = null, onProfileChange, initialPostId = null, onPostChange, composeOnly = false, onDone }) {
  const supabase = user ? getSupabaseClient() : (getGuestClient() || getSupabaseClient());
  const productsById = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);
  const [tab, setTab] = useState('for-you');
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [playlistSection, setPlaylistSection] = useState('recent');
  const [followingIds, setFollowingIds] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [friendProfiles, setFriendProfiles] = useState([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [page, setPage] = useState(null);
  const [details, setDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [items, setItems] = useState([]);
  const [profilePosts, setProfilePosts] = useState([]);
  const [profilePlaylists, setProfilePlaylists] = useState([]);
  const [compose, setCompose] = useState(composeOnly ? (seedKind || 'post') : seedKind);
  const [doneLabel, setDoneLabel] = useState('');
  const [profileChecked, setProfileChecked] = useState(false);
  const [body, setBody] = useState('');
  const [productId, setProductId] = useState(seedProductId);
  const [anonymous, setAnonymous] = useState(false);
  const [rating, setRating] = useState(5);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [playlistVisibility, setPlaylistVisibility] = useState('public');
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
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
  const [refresh, setRefresh] = useState(0);
  const [reportPost, setReportPost] = useState(null);
  const [reportReason, setReportReason] = useState('misinformation');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editPost, setEditPost] = useState(null);
  const [editBody, setEditBody] = useState('');
  const [notifications, setNotifications] = useState(null);
  const [showUpdates, setShowUpdates] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileStats, setProfileStats] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editHandle, setEditHandle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const [sideQuestions, setSideQuestions] = useState([]);
  const [sidePlaylists, setSidePlaylists] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const coverPreview = useMemo(() => (coverPhoto ? URL.createObjectURL(coverPhoto) : null), [coverPhoto]);
  useEffect(() => () => { if (coverPreview) URL.revokeObjectURL(coverPreview); }, [coverPreview]);
  const teamBadges = useTeamBadges(supabase, user);
  // After the first visit the hero shrinks to a title band so the feed starts on screen.
  const [seenBefore] = useState(() => { try { const v = window.localStorage.getItem('ayna.powderroom.seen'); window.localStorage.setItem('ayna.powderroom.seen', '1'); return v === '1'; } catch { return false; } });
  const badgeFor = (authorId, anon = false) => (!anon && authorId ? teamBadges.get(authorId) || null : null);
  const openRules = () => setShowRules(true);

  const notifyError = (e) => setError(community.friendlyError(e));
  const requireAccount = (feature = 'this feature') => onRequireAuth?.(feature);
  const closePage = () => { setPage(null); setDetails(null); setComments([]); setItems([]); setError(''); setEditingProfile(false); setProfileStats(null); };
  const openCompose = (kind = 'post') => {
    // Posting in a health community needs an account (no anonymous guest posts).
    if (!user) { requireAccount(kind === 'review' ? 'reviews' : kind === 'playlist' ? 'playlists' : kind === 'recommend' ? 'friend recommendations' : 'posting'); return; }
    setCompose(kind); setError('');
  };
  const matchFor = (id) => { const p = productsById.get(String(id)); return p && quizResults ? getProfileMatchPercentForProduct(p, quizResults) : null; };

  useEffect(() => {
    if (!supabase) return undefined;
    const ids = [...new Set([...posts, ...comments, ...(searchResults?.posts || []), ...(page?.type === 'post' && details ? [details] : [])].map((i) => i.author_id).filter(Boolean))];
    if (!ids.length) return undefined;
    let active = true;
    community.getProfilesByIds(supabase, ids).then((m) => { if (active) setProfileById((prev) => new Map([...prev, ...m])); }).catch(() => {});
    return () => { active = false; };
  }, [supabase, posts, comments, searchResults, page, details]);

  useEffect(() => {
    if (!supabase || !user) { setUnreadCount(0); return undefined; }
    let active = true;
    community.countUnreadNotifications(supabase).then((n) => { if (active) setUnreadCount(Number(n) || 0); }).catch(() => {});
    return () => { active = false; };
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase || !user) return;
    community.getMyCommunityProfile(supabase, user.id).then(setProfile).catch(() => {}).finally(() => setProfileChecked(true));
    community.listFollowingIds(supabase, user.id).then(setFollowingIds).catch(() => {});
    community.listMyFriendships(supabase).then(async (rows) => {
      setFriendships(rows);
      const ids = community.friendIdsFrom(rows, user.id);
      const m = await community.getProfilesByIds(supabase, ids);
      setFriendProfiles(ids.map((id) => m.get(id)).filter(Boolean));
    }).catch(() => {});
  }, [supabase, user, refresh]);

  useEffect(() => {
    if (!supabase || page || search || composeOnly) return undefined;
    if (tab === 'announcements') { setPosts([]); setCursor(null); setLoading(false); return undefined; }
    let active = true;
    setLoading(true);
    (async () => {
      if (tab === 'playlists') {
        const rows = await community.listPlaylists(supabase, { section: playlistSection });
        if (active) { setPlaylists(rows); setPosts([]); setCursor(null); }
      } else {
        const rows = await community.listFeedPosts(supabase, { kind: tab === 'question' || tab === 'review' ? tab : null, authorIds: tab === 'following' ? followingIds : null });
        if (active) { setPosts(tab === 'for-you' ? rankForYou(rows, { matchFor, followingIds: new Set(followingIds) }) : rows); setCursor(rows.length === community.PAGE_SIZE ? community.nextCursor(rows, 'recent') : null); }
      }
    })().catch((e) => { if (active) notifyError(e); }).finally(() => { if (active) setLoading(false); markPerf('community_feed_loaded'); });
    return () => { active = false; };
  }, [supabase, tab, page, search, refresh, followingIds, productsById, quizResults, playlistSection]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (search.trim().length < 2 || !supabase) return undefined;
    let active = true;
    const t = window.setTimeout(async () => {
      try { const r = await searchCommunityTolerant(community.searchCommunity, supabase, search); if (active) setSearchResults(r); } catch (e) { if (active) notifyError(e); }
    }, 250);
    return () => { active = false; window.clearTimeout(t); };
  }, [search, supabase]);

  // Side modules: recent questions and community playlists, loaded once.
  useEffect(() => {
    if (!supabase || composeOnly) return undefined;
    let active = true;
    community.listFeedPosts(supabase, { kind: 'question', limit: 6 }).then((rows) => { if (active) setSideQuestions(rows || []); }).catch(() => {});
    community.listPlaylists(supabase, { section: 'recent', limit: 6 }).then((rows) => { if (active) setSidePlaylists(rows || []); }).catch(() => {});
    return () => { active = false; };
  }, [supabase, composeOnly, refresh]);

  // The post "…" menu closes on outside click or Escape.
  useEffect(() => {
    if (!menuId) return undefined;
    const onDown = (e) => { if (!e.target.closest?.('.wc-menu-wrap')) setMenuId(null); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuId(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuId]);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const rows = await community.listFeedPosts(supabase, { kind: tab === 'question' || tab === 'review' ? tab : null, authorIds: tab === 'following' ? followingIds : null, cursor });
      setPosts((prev) => [...prev, ...(tab === 'for-you' ? rankForYou(rows, { matchFor }) : rows)]);
      setCursor(rows.length === community.PAGE_SIZE ? community.nextCursor(rows, 'recent') : null);
    } catch (e) { notifyError(e); } finally { setLoading(false); }
  };
  const openPost = async (post) => {
    setPage({ type: 'post', id: post.id }); setDetails(post); setError(''); window.scrollTo(0, 0);
    try { setComments(await community.listComments(supabase, post.id)); } catch (e) { notifyError(e); }
  };
  const openPlaylist = async (pl) => {
    setProductId(null); setPage({ type: 'playlist', id: pl.id }); setDetails(pl); setError(''); window.scrollTo(0, 0);
    setItems((pl.preview_product_ids || []).map((product_id) => ({ product_id })));
    try { setItems(await community.listPlaylistItems(supabase, pl.id)); } catch (e) { if (!pl.preview_product_ids?.length) notifyError(e); }
  };
  const openPlaylistById = async (id) => {
    try { const pl = await community.getPlaylist(supabase, id); if (pl) await openPlaylist(pl); else setError('This playlist isn’t available anymore.'); } catch (e) { notifyError(e); }
  };
  const refreshPlaylist = async (id) => {
    const [next, nextItems] = await Promise.all([community.getPlaylist(supabase, id), community.listPlaylistItems(supabase, id)]);
    if (next) setDetails(next);
    setItems(nextItems); setRefresh((v) => v + 1);
  };
  const openProfile = async (username) => {
    if (!username) return;
    const handle = String(username).replace(/^@/, '').toLowerCase();
    setPage({ type: 'profile', id: handle }); setDetails(null); setProfilePosts([]); setProfilePlaylists([]); setProfileStats(null); setEditingProfile(false); setError(''); setSearch(''); setSearchResults(null); window.scrollTo(0, 0);
    setProfileLoading(true);
    try {
      const p = await community.getProfileByUsername(supabase, handle);
      setDetails(p);
      if (p?.user_id) {
        const [a, b, c] = await Promise.allSettled([
          community.listFeedPosts(supabase, { authorIds: [p.user_id], limit: PROFILE_LIST_MAX }),
          community.listPlaylists(supabase, { section: p.user_id === user?.id ? 'mine' : 'owner', ownerIds: [p.user_id], limit: PROFILE_LIST_MAX }),
          community.getProfileStats(supabase, p.user_id),
        ]);
        if (a.status === 'fulfilled') setProfilePosts(a.value);
        if (b.status === 'fulfilled') setProfilePlaylists(b.value);
        if (c.status === 'fulfilled' && c.value) setProfileStats(c.value);
      }
    } catch (e) { notifyError(e); } finally { setProfileLoading(false); }
  };
  const openUpdates = async () => {
    if (!user) { requireAccount('notifications'); return; }
    setShowUpdates(true); setNotifications(null);
    try {
      const rows = await community.listNotifications(supabase);
      const actorOf = (n) => n.actor_id || n.from_user_id || n.sender_id || n.data?.actor_id || n.payload?.actor_id || null;
      let people = new Map();
      try { people = await community.getProfilesByIds(supabase, rows.map(actorOf)); } catch { /* names are a nicety */ }
      setNotifications(rows.map((n) => ({ ...n, actor: people.get(actorOf(n)) || null })));
      if (unreadCount) { await community.markNotificationsRead(supabase); setUnreadCount(0); }
    } catch (e) { setNotifications([]); notifyError(e); }
  };
  const startEditProfile = () => {
    if (!profile) return;
    setEditName(profile.display_name || ''); setEditHandle(profile.username || ''); setEditBio(profile.bio || ''); setEditingProfile(true); setError('');
  };
  const saveProfileEdits = async () => {
    if (!user || !profile || !editName.trim() || !editHandle.trim() || breaksCommunityRules(editName, editBio)) return;
    setBusy(true); setError('');
    try {
      const next = await community.upsertCommunityProfile(supabase, user.id, { username: editHandle, displayName: editName, bio: editBio, avatarUrl: profile.avatar_url || null });
      if (next) { setProfile(next); setDetails(next); setPage({ type: 'profile', id: next.username }); }
      setEditingProfile(false); setNotice('Profile saved');
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  const toggleFollow = async (targetId) => {
    if (!user) { requireAccount('following people'); return; }
    try {
      const on = !followingIds.includes(targetId);
      await community.setFollowing(supabase, user.id, targetId, on);
      setFollowingIds((ids) => (on ? [...ids, targetId] : ids.filter((id) => id !== targetId)));
    } catch (e) { notifyError(e); }
  };
  const saveProfile = async () => {
    if (!user || !profileName.trim() || !profileHandle.trim() || breaksCommunityRules(profileName, profileHandle)) return;
    setBusy(true); setError('');
    try { setProfile(await community.upsertCommunityProfile(supabase, user.id, { username: profileHandle, displayName: profileName })); setNotice('Profile saved'); }
    catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  // composeOnly (product page): the composer is the whole UI. Close or a
  // successful post hands control back through onDone.
  const finishCompose = (label) => setDoneLabel(label);
  useEffect(() => {
    if (!doneLabel) return undefined;
    const t = window.setTimeout(() => onDone?.(), 1400);
    return () => window.clearTimeout(t);
  }, [doneLabel]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (composeOnly && !user) { onRequireAuth?.('posting'); onDone?.(); }
  }, [composeOnly, user]); // eslint-disable-line react-hooks/exhaustive-deps
  const closeCompose = () => { if (composeOnly) onDone?.(); else setCompose(null); };

  const submit = async () => {
    if (busy) return;
    if (!user) { requireAccount('posting'); return; }
    if (composeEmpty || composeIssue || composeBlocked) return;
    if (compose === 'review' && !productId) { setError('Choose a product to review.'); return; }
    if (compose === 'recommend' && (!productId || !selectedFriendIds.length)) { setError('Choose a product and at least one friend.'); return; }
    if (user && !profile) { setError('Set up your community profile first.'); return; }
    setBusy(true); setError('');
    try {
      const client = user ? supabase : getGuestClient();
      const userId = user?.id || await ensureGuestSession();
      if (compose === 'recommend') {
        await community.sendRecommendations(client, userId, productId, selectedFriendIds, body);
        setCompose(null); setBody(''); setProductId(null); setSelectedFriendIds([]);
        if (composeOnly) finishCompose('Sent'); else setNotice('Recommendation sent.');
      } else if (compose === 'playlist') {
        let cover;
        try {
          const file = coverPhoto || await makePlaylistCoverFile(playlistTitle, coverColor);
          cover = await uploadCommunityImage(client, file, { folder: 'covers', userId });
          const result = await community.createPlaylist(client, userId, { title: playlistTitle, visibility: playlistVisibility, coverUrl: cover.url });
          if (productId) { try { await community.addToPlaylist(client, result.id, productId); } catch { setNotice('Playlist created, but the product could not be added.'); } }
          setCompose(null); setPlaylistTitle(''); setPlaylistVisibility('public'); setProductId(null); setCoverPhoto(null);
          if (composeOnly) finishCompose('Playlist created'); else { setTab('playlists'); setRefresh((v) => v + 1); await openPlaylist(result); }
        } catch (e) { if (cover) await deleteCommunityImage(client, cover.path); throw e; }
      } else {
        const product = productsById.get(String(productId));
        const topics = [...new Set([...extractHashtagTopics(body), ...suggestTopicsForProducts(product ? [product] : [])])].slice(0, 5);
        const media = [];
        let result;
        try {
          for (const photo of photos) media.push(await uploadCommunityImage(client, photo, { folder: 'posts' }));
          result = await community.createPost(client, userId, { kind: compose, body, topics, media, isAnonymous: !user || anonymous, productId: compose === 'review' ? productId : null, rating: compose === 'review' ? rating : null, taggedProductIds: compose === 'review' || !productId ? [] : [productId] });
        } catch (e) { await Promise.all(media.map((m) => deleteCommunityImage(client, m.path))); throw e; }
        setCompose(null); setBody(''); setProductId(null); setAnonymous(false); setPhotos([]); setRefresh((v) => v + 1);
        if (composeOnly) { finishCompose('Posted'); return; }
        const post = await community.getFeedPost(client, result.id);
        if (post) await openPost(post);
      }
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  const submitComment = async () => {
    if (!user) { requireAccount('replying'); return; }
    if (!commentBody.trim() || !details?.id || breaksCommunityRules(commentBody)) return;
    setBusy(true); setError('');
    try {
      const client = user ? supabase : getGuestClient();
      const userId = user?.id || await ensureGuestSession();
      await community.createComment(client, userId, { postId: details.id, parentId: replyTo, body: commentBody, isAnonymous: !user || anonymous, productId });
      setComments(await community.listComments(client, details.id)); setCommentBody(''); setReplyTo(null); setProductId(null);
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  const togglePost = async (post, kind) => {
    if (!user) { requireAccount(kind === 'save' ? 'saved posts' : 'reactions'); return; }
    try {
      const on = !post[kind === 'save' ? 'viewer_saved' : 'viewer_found_helpful'];
      if (kind === 'save') await community.setSaved(supabase, user.id, post.id, on);
      else await community.setHelpful(supabase, user.id, { postId: post.id }, on);
      setRefresh((v) => v + 1);
      if (page?.type === 'post') setDetails(await community.getFeedPost(supabase, post.id));
    } catch (e) { notifyError(e); }
  };
  // Delete waits 5 seconds with an Undo before it really happens.
  const pendingDelete = useRef(null);
  const confirmDelete = async () => {
    if (!deleteTarget || busy) return;
    const target = deleteTarget;
    setDeleteTarget(null); setError('');
    setPosts((prev) => prev.filter((p) => p.id !== target.id));
    if (page?.type === 'post' && page.id === target.id) closePage();
    const timer = window.setTimeout(async () => {
      pendingDelete.current = null;
      try {
        const client = user ? supabase : getGuestClient();
        const userId = user?.id || await getGuestId();
        await community.deletePost(client, target.id, userId);
        setRefresh((v) => v + 1);
      } catch (e) { notifyError(e); setRefresh((v) => v + 1); }
    }, 5000);
    pendingDelete.current = timer;
    toast('Post deleted', { label: 'Undo', onClick: () => { window.clearTimeout(timer); pendingDelete.current = null; setRefresh((v) => v + 1); } });
  };
  const submitReport = async () => {
    if (!reportPost) return;
    setBusy(true); setError('');
    try {
      const client = user ? supabase : getGuestClient();
      const userId = user?.id || await ensureGuestSession();
      await community.fileReport(client, userId, { targetType: 'post', postId: reportPost.id, reason: reportReason });
      setReportPost(null); setNotice('Report sent. Thank you for helping keep Community safe.');
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };

  // Profile URL sync (/community/@handle): report the open profile up, and
  // follow the handle the parent passes in (deep link, back/forward).
  const reportedHandle = useRef(initialProfileHandle ? String(initialProfileHandle).replace(/^@/, '').toLowerCase() : null);
  const currentHandle = page?.type === 'profile' ? page.id : null;
  // A deep link opens its profile on mount; until that page is set, don't
  // report "no profile" up (that rewrote /community/@handle to /community).
  const pendingHandle = useRef(reportedHandle.current);
  useEffect(() => {
    if (pendingHandle.current) {
      if (!currentHandle) return;
      pendingHandle.current = null;
    }
    if (currentHandle === reportedHandle.current) return;
    reportedHandle.current = currentHandle;
    onProfileChange?.(currentHandle);
  }, [currentHandle]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const wanted = initialProfileHandle ? String(initialProfileHandle).replace(/^@/, '').toLowerCase() : null;
    if (wanted === currentHandle) return;
    if (wanted) { reportedHandle.current = wanted; pendingHandle.current = wanted; openProfile(wanted); }
    else if (currentHandle) { reportedHandle.current = null; closePage(); }
  }, [initialProfileHandle, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Post URL sync (/community/p/:id): open a linked post on mount, report the open post up.
  const currentPostId = page?.type === 'post' ? page.id : null;
  const postSynced = useRef(false);
  useEffect(() => {
    if (!initialPostId || !supabase || postSynced.current) return;
    postSynced.current = true;
    community.getFeedPost(supabase, initialPostId).then((post) => { if (post) openPost(post); else setError('This post isn’t available anymore.'); }).catch(notifyError);
  }, [initialPostId, supabase]); // eslint-disable-line react-hooks/exhaustive-deps
  const lastPost = useRef(initialPostId);
  useEffect(() => {
    if (currentPostId === lastPost.current) return;
    if (!currentPostId && initialPostId && !postSynced.current) return;
    lastPost.current = currentPostId;
    onPostChange?.(currentPostId);
  }, [currentPostId]); // eslint-disable-line react-hooks/exhaustive-deps

  // People to follow, only from profiles already loaded with the feed.
  const suggestedPeople = useMemo(() => [...profileById.values()]
    .filter((p) => p?.user_id && p.username && p.user_id !== user?.id && p.user_id !== profile?.user_id && !followingIds.includes(p.user_id))
    .slice(0, SUGGESTED_MAX), [profileById, user, profile, followingIds]);

  const bodyMax = POST_MAX;
  const composeIssue = (() => {
    if (!compose) return '';
    if (user && !profile) return 'Set up your community profile first.';
    if (compose === 'review' && !productId) return 'Choose the product you’re reviewing.';
    if (compose === 'recommend' && !productId) return 'Choose a product to recommend.';
    if (compose === 'recommend' && !selectedFriendIds.length) return 'Pick at least one friend.';
    if (compose !== 'playlist' && body.length > bodyMax) return `Keep it under ${bodyMax} characters.`;
    return '';
  })();
  const composeEmpty = compose === 'playlist' ? !playlistTitle.trim() : compose !== 'recommend' && !body.trim();
  const composeBlocked = compose === 'playlist' ? breaksCommunityRules(playlistTitle) : breaksCommunityRules(body);

  const hashtagMatch = body.match(/(?:^|\s)#([A-Za-z][\w-]*)?$/);
  const hashtagSuggestions = hashtagMatch ? suggestHashtags(hashtagMatch[1] || '', 6) : [];

  const renderPost = (post, full = false) => {
    const anon = post.is_anonymous || !post.author_id;
    const name = anon ? 'Anonymous' : post.author_display_name || post.author_username || 'Community member';
    const menuOpen = menuId === post.id;
    const helpful = Number(post.helpful_count) || 0;
    const replies = Number(post.comment_count) || 0;
    return <article className={`wc-post${full ? ' is-full' : ''}`} data-kind={post.kind || 'post'} key={post.id}>
      <header className="wc-post-head">
        <Avatar size={36} name={name} path={!anon ? profileById.get(post.author_id)?.avatar_url : null} anonymous={anon} />
        <div className="wc-post-who">
          {anon || !post.author_username ? <strong>{name}</strong> : <button type="button" className="wc-name" onClick={() => openProfile(post.author_username)}>{name}</button>}
          {/* One label for staff: "ayna team · CMO" (was check + title + pill). */}
          {badgeFor(post.author_id, anon) && <span className="wc-team-tag">ayna team · {String(badgeFor(post.author_id, anon)).replace(/,\s*ayna\s*$/i, '')}</span>}
          <time dateTime={post.created_at || undefined}>{timeLabel(post.created_at)}</time>
        </div>
        {post.kind && post.kind !== 'post' && <Tag kind={post.kind} />}
        <div className="wc-menu-wrap">
          <button type="button" className="wc-more" aria-label={`More options for ${name}'s post`} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuId(menuOpen ? null : post.id)}><Icon name="more" size={18} /></button>
          {menuOpen && <div className="wc-menu" role="menu">
            {post.is_mine && user && <button type="button" role="menuitem" onClick={() => { setMenuId(null); setEditPost(post); setEditBody(post.body || ''); }}>Edit post</button>}
            <button type="button" role="menuitem" onClick={() => { setMenuId(null); if (post.is_mine) setDeleteTarget(post); else setReportPost(post); }}>{post.is_mine ? 'Delete post' : 'Report post'}</button>
          </div>}
        </div>
      </header>
      {post.kind === 'review' && <Stars value={post.rating} size={15} />}
      {full ? <p className="wc-body">{post.body}</p> : <button type="button" className="wc-body" onClick={() => openPost(post)}>{post.body}</button>}
      {(post.media || []).length > 0 && <div className="wc-photos">{post.media.slice(0, 4).map((m) => <img key={m.path} src={publicMediaUrl(m.path)} alt="" loading="lazy" />)}</div>}
      {postProductIds(post).slice(0, 1).map((id) => <Mention key={id} productId={id} productsById={productsById} quizResults={quizResults} onOpenProduct={onOpenProduct} />)}
      <footer className="wc-actions">
        <button type="button" aria-pressed={Boolean(post.viewer_found_helpful)} aria-label={`Helpful${helpful ? `, ${helpful}` : ''}`} title="Helpful" onClick={() => togglePost(post, 'helpful')}><Icon name="heart" size={17} /><span aria-hidden="true">{helpful ? `Helpful ${helpful}` : 'Helpful'}</span></button>
        <button type="button" aria-label={`Reply${replies ? `, ${replies} replies` : ''}`} title="Reply" onClick={() => openPost(post)}><Icon name="comment" size={17} /><span aria-hidden="true">{replies ? `Reply ${replies}` : 'Reply'}</span></button>
        <button type="button" className="wc-save" aria-pressed={Boolean(post.viewer_saved)} aria-label={post.viewer_saved ? 'Saved' : 'Save'} title={post.viewer_saved ? 'Saved' : 'Save'} onClick={() => togglePost(post, 'save')}><Icon name="bookmark" size={17} /><span aria-hidden="true">{post.viewer_saved ? 'Saved' : 'Save'}</span></button>
      </footer>
    </article>;
  };
  const playlistCard = (p) => <button type="button" className="wc-playlist" key={p.id} onClick={() => openPlaylist(p)}>
    <PlaylistCover playlist={p} productsById={productsById} />
    <span className="wc-playlist-copy"><strong>{p.title}</strong><small>{p.item_count || 0} {(p.item_count || 0) === 1 ? 'product' : 'products'} · {p.owner_display_name || 'ayna community'}</small></span>
  </button>;

  const composeLabel = compose === 'question' ? 'Your question' : compose === 'review' ? 'Your review' : compose === 'recommend' ? 'Note to your friends' : 'Your post';
  const composeSheet = compose && <Sheet title={KIND_TITLES[compose]} onClose={closeCompose} className="wc-compose">
      <div className="wc-seg wc-kinds" role="group" aria-label="What are you sharing?">{Object.keys(KIND_TITLES).map((k) => <button type="button" key={k} aria-pressed={compose === k} onClick={() => openCompose(k)}>{VERB[k] || k}</button>)}</div>
      {composeOnly && user && profileChecked && !profile && <div className="wc-card wc-join"><h3>Pick a name first</h3><p className="wc-muted">Your health answers stay private.</p>
        <RuleField as="input" value={profileName} maxLength={50} onChange={(e) => setProfileName(e.target.value)} placeholder="Display name" aria-label="Display name" onShowRules={openRules} />
        <RuleField as="input" value={profileHandle} maxLength={30} onChange={(e) => setProfileHandle(e.target.value.toLowerCase())} placeholder="Username" aria-label="Username" onShowRules={openRules} />
        <button type="button" className="wc-btn is-ghost" disabled={busy || !profileName.trim() || !profileHandle.trim() || breaksCommunityRules(profileName, profileHandle)} onClick={saveProfile}>Create profile</button></div>}
      {compose === 'playlist' ? <>
        <section className="wc-group">
          <label className="wc-label" htmlFor="wc-pl-name">Name</label>
          <RuleField as="input" id="wc-pl-name" data-autofocus value={playlistTitle} maxLength={60} onChange={(e) => setPlaylistTitle(e.target.value)} placeholder="e.g. My everyday essentials" onShowRules={openRules} />
        </section>
        <section className="wc-group">
          <h3 className="wc-label">Who can see it</h3>
          <div className="wc-seg wc-seg-fill">{AUDIENCE.map(([v, l]) => <button type="button" key={v} aria-pressed={playlistVisibility === v} onClick={() => setPlaylistVisibility(v)}>{l}</button>)}</div>
        </section>
        <section className="wc-group">
          <h3 className="wc-label">Cover</h3>
          <div className="wc-cover-pick">
            <span className="wc-cover-preview" style={coverPreview ? undefined : { background: coverColor, color: coverColor === COVER_COLORS[0] ? '#fffcf5' : '#1d1a2b' }} aria-hidden="true">{coverPreview ? <img src={coverPreview} alt="" /> : <span>{playlistTitle.trim() || 'ayna'}</span>}</span>
            <div className="wc-cover-opts">
              <div className="wc-colors">{COVER_COLORS.map((c) => <button type="button" key={c} aria-label={`Cover colour ${c}`} aria-pressed={!coverPhoto && coverColor === c} style={{ background: c }} onClick={() => { setCoverColor(c); setCoverPhoto(null); }} />)}</div>
              <label className="wc-btn is-ghost is-small wc-upload">{coverPhoto ? 'Change photo' : 'Upload a photo'}<input type="file" accept="image/*" className="wc-file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { try { checkImageFile(f); setCoverPhoto(f); } catch (err) { setError(err.message); } } e.target.value = ''; }} /></label>
            </div>
          </div>
        </section>
        <section className="wc-group">
          <h3 className="wc-label">First product <small>Optional</small></h3>
          <Picker products={products} value={productId} onChange={setProductId} placeholder="Search products to add" />
        </section>
      </> : <>
        <section className="wc-group">
          <label className="wc-label" htmlFor="wc-compose-body">{composeLabel}</label>
          <RuleField id="wc-compose-body" autoGrow data-autofocus minRows={4} value={body} maxLength={bodyMax} onChange={(e) => setBody(e.target.value)} placeholder={compose === 'question' ? 'What would you like to ask? Add #topics if helpful.' : compose === 'review' ? 'How was it for you?' : compose === 'recommend' ? 'Add a note (optional)' : 'What’s on your mind? Add #topics if helpful.'} onShowRules={openRules} />
          <Counter length={body.length} max={bodyMax} />
          {hashtagSuggestions.length > 0 && <div className="wc-tags">{hashtagSuggestions.map((t) => <button type="button" key={t.key} onClick={() => setBody((x) => x.replace(/#(?:[A-Za-z][\w-]*)?$/, `${t.tag} `))}>{t.tag}</button>)}</div>}
          {compose === 'review' && <div className="wc-rating" role="radiogroup" aria-label="Your rating">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`} className={n <= rating ? 'is-on' : ''} onClick={() => setRating(n)}><Star on={n <= rating} size={28} /></button>)}</div>}
        </section>
        <section className="wc-group">
          <h3 className="wc-label">{compose === 'review' ? 'Product you’re reviewing' : compose === 'recommend' ? 'Product to recommend' : <>Product <small>Optional</small></>}</h3>
          <Picker products={products} value={productId} onChange={setProductId} placeholder="Search products" />
          {compose !== 'recommend' && <div className="wc-photo-pick">
            <label className="wc-btn is-ghost is-small wc-upload">{photos.length ? 'Change photos' : 'Add photos'}<input type="file" accept="image/*" multiple className="wc-file" onChange={(e) => { try { const f = Array.from(e.target.files || []).slice(0, MAX_POST_PHOTOS); f.forEach(checkImageFile); setPhotos(f); setError(''); } catch (err) { setError(err.message); } e.target.value = ''; }} /></label>
            <small>{photos.length ? photos.map((f) => f.name).join(', ') : `Up to ${MAX_POST_PHOTOS}`}</small>
          </div>}
        </section>
        {compose === 'recommend' && <section className="wc-group wc-friends"><h3 className="wc-label">Send to friends</h3>{friendProfiles.length ? friendProfiles.map((f) => <Check key={f.user_id} checked={selectedFriendIds.includes(f.user_id)} onChange={(e) => setSelectedFriendIds((ids) => (e.target.checked ? [...ids, f.user_id] : ids.filter((id) => id !== f.user_id)))}>{f.display_name || f.username}</Check>) : <p className="wc-muted">Add friends from Community profiles first.</p>}</section>}
      </>}
      <div className="wc-compose-foot">
        {user && compose !== 'playlist' && compose !== 'recommend' && <Check checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}>Post anonymously</Check>}
        {composeIssue && !composeEmpty && (compose !== 'recommend' || body.trim() || productId) && <p className="wc-hint" role="status">{composeIssue}</p>}
        {error && <p className="wc-error" role="alert">{error}</p>}
        <div className="wc-compose-actions">
          <button type="button" className="wc-link wc-rules-link" onClick={openRules}>Community rules</button>
          <button type="button" className="wc-btn" disabled={busy || composeEmpty || Boolean(composeIssue) || composeBlocked} onClick={submit}>{busy ? 'Sharing…' : compose === 'playlist' ? 'Create playlist' : compose === 'recommend' ? 'Send recommendation' : compose === 'question' ? 'Ask question' : compose === 'review' ? 'Post review' : 'Share post'}</button>
        </div>
      </div>
    </Sheet>;

  if (composeOnly && !supabase) return <Sheet title="Community isn’t loading" onClose={() => onDone?.()}><p className="wc-muted">Try again later.</p><button type="button" className="wc-btn" onClick={() => onDone?.()}>Close</button></Sheet>;
  if (composeOnly) {
    if (!user) return null;
    return <>
      {!doneLabel && composeSheet}
      {showRules && <Sheet title="Community rules" onClose={() => setShowRules(false)} className="wc-rules-sheet"><CommunityRulesList /><button type="button" className="wc-btn" onClick={() => setShowRules(false)}>Got it</button></Sheet>}
      {doneLabel && createPortal(<div className="wc-sheet-backdrop wc-done-backdrop" onClick={() => onDone?.()}><div className="wc-done" role="status" aria-live="polite"><span className="wc-done-mark" aria-hidden="true"><Icon name="check" size={22} /></span><strong>{doneLabel}</strong></div></div>, document.querySelector('.app-container') || document.body)}
    </>;
  }
  if (!supabase) return <section className="wc"><div className="wc-empty"><h1>Community isn’t loading</h1><p>Try again later.</p></div></section>;

  let main;
  if (page?.type === 'post' && details) {
    main = <>
      {renderPost(details, true)}
      <h2 className="wc-h2">Replies</h2>
      {comments.length === 0 && <p className="wc-muted">No replies yet.</p>}
      {comments.map((c) => <div className="wc-comment" key={c.id}>
        <header><Avatar size={30} name={c.author_display_name || c.author_username} path={!c.is_anonymous && c.author_id ? profileById.get(c.author_id)?.avatar_url : null} anonymous={c.is_anonymous || !c.author_id} /><strong>{c.is_anonymous || !c.author_id ? 'Anonymous' : c.author_display_name || c.author_username}</strong><VerifiedBadge title={badgeFor(c.author_id, c.is_anonymous)} compact /><small>{timeLabel(c.created_at)}</small></header>
        <p>{c.body}</p>
        {c.product_id && <Mention productId={c.product_id} productsById={productsById} quizResults={quizResults} onOpenProduct={onOpenProduct} />}
        <button type="button" className="wc-link" onClick={() => setReplyTo(c.id)}>Reply</button>
      </div>)}
      <div className="wc-reply">
        {replyTo && <button type="button" className="wc-link" onClick={() => setReplyTo(null)}>Replying to a comment · cancel</button>}
        <RuleField autoGrow minRows={3} value={commentBody} maxLength={COMMENT_MAX} onChange={(e) => setCommentBody(e.target.value)} placeholder="Add to the conversation" aria-label="Your reply" onShowRules={openRules} />
        <Counter length={commentBody.length} max={COMMENT_MAX} />
        <Picker products={products} value={productId} onChange={setProductId} />
        {user && <Check checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}>Reply anonymously</Check>}
        <button type="button" className="wc-btn" disabled={busy || !commentBody.trim() || breaksCommunityRules(commentBody)} onClick={submitComment}>Post reply</button>
      </div>
    </>;
  } else if (page?.type === 'playlist' && details) {
    const mine = user?.id === details.owner_id;
    const count = details.item_count ?? items.length;
    const addable = products.filter((p) => !items.some((s) => String(s.product_id) === String(p.id)));
    const deletePl = async () => { setBusy(true); try { await community.deletePlaylist(supabase, details.id); closePage(); setRefresh((v) => v + 1); setNotice('Playlist deleted.'); } catch (e) { notifyError(e); } finally { setBusy(false); } };
    const removeItem = async (pid) => { setBusy(true); try { await community.removeFromPlaylist(supabase, details.id, pid); await refreshPlaylist(details.id); } catch (e) { notifyError(e); } finally { setBusy(false); } };
    const addItem = async () => { setBusy(true); try { await community.addToPlaylist(supabase, details.id, productId); await refreshPlaylist(details.id); setProductId(null); } catch (e) { notifyError(e); } finally { setBusy(false); } };
    main = <section className="wc-pl-detail">
      <div className="wc-pl-hero"><PlaylistCover playlist={{ ...details, preview_product_ids: details.preview_product_ids || items.map((it) => it.product_id) }} productsById={productsById} big />
        <div className="wc-pl-hero-copy">
          <Tag kind="playlist" />
          <h1>{details.title}</h1>
          {details.description && <p>{details.description}</p>}
          <small>{count} {count === 1 ? 'product' : 'products'}{details.owner_display_name ? ` · by ${details.owner_display_name}` : ''}</small>
        </div>
      </div>
      <ul className="wc-pl-list" aria-label="Products in this playlist">
        {items.map((it) => <li key={it.product_id} className="wc-pl-row">
          <Mention productId={it.product_id} productsById={productsById} quizResults={quizResults} onOpenProduct={onOpenProduct} hideView={mine} />
          {mine && <button type="button" className="wc-pl-remove" disabled={busy} onClick={() => removeItem(it.product_id)} aria-label={`Remove ${productsById.get(String(it.product_id))?.name || customProductName(String(it.product_id)) || 'product'}`}>Remove</button>}
        </li>)}
        {mine && <li className="wc-pl-add">
          <span className="wc-pl-add-mark" aria-hidden="true"><Icon name="plus" size={18} /></span>
          <Picker products={addable} value={productId} onChange={setProductId} placeholder="Add a product" />
          <button type="button" className="wc-btn is-small" disabled={busy || !productId} onClick={addItem}>Add</button>
        </li>}
      </ul>
      {items.length === 0 && !mine && <p className="wc-muted">No products added yet.</p>}
      {mine && <div className="wc-pl-owner"><button type="button" className="wc-link is-danger" disabled={busy} onClick={deletePl}>Delete playlist</button></div>}
    </section>;
  } else if (page?.type === 'profile') {
    const own = Boolean(user && details && (details.user_id === user.id || (profile && details.user_id === profile.user_id)));
    const countLabel = (n) => (n >= PROFILE_LIST_MAX ? `${PROFILE_LIST_MAX}+` : String(n));
    const counts = details ? [
      ['Posts', countLabel(profilePosts.length)],
      ['Playlists', countLabel(profilePlaylists.length)],
      ...(profileStats ? [['Followers', String(profileStats.followers ?? 0)], ['Following', String(profileStats.following ?? 0)]] : []),
    ] : [];
    main = !details ? (profileLoading ? <div className="wc-prof-skel" aria-busy="true" aria-label="Loading profile"><span className="wc-skel-dot is-big" /><div><span className="wc-skel-line is-mid" /><span className="wc-skel-line is-short" /></div></div> : <div className="wc-empty"><h2>Profile not found</h2><p>Check the handle and try again.</p></div>) : <section className="wc-profile">
      <div className="wc-prof-hero">
        <Avatar size={88} name={details.display_name} path={details.avatar_url} />
        <div className="wc-prof-id">
          <h1>{details.display_name || details.username}</h1>
          <small className="wc-prof-handle">@{details.username}<VerifiedBadge title={badgeFor(details.user_id)} /></small>
          {details.bio && <p className="wc-prof-bio">{details.bio}</p>}
          {!details.bio && own && <button type="button" className="wc-prof-bio is-empty" onClick={startEditProfile}>+ Add a short bio so people know what you’re into</button>}
        </div>
      </div>
      <dl className="wc-prof-counts">{counts.map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>
      {own && !editingProfile && <div className="wc-row"><button type="button" className="wc-btn is-ghost" onClick={startEditProfile}>Edit profile</button></div>}
      {own && editingProfile && <form className="wc-card wc-prof-edit" onSubmit={(e) => { e.preventDefault(); saveProfileEdits(); }}>
        <h3>Edit profile</h3>
        <label className="wc-field"><span>Display name</span><RuleField as="input" value={editName} maxLength={50} onChange={(e) => setEditName(e.target.value)} required onShowRules={openRules} /></label>
        <label className="wc-field"><span>Username</span><input value={editHandle} maxLength={24} autoCapitalize="none" onChange={(e) => setEditHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} required /></label>
        <label className="wc-field"><span>Bio</span><RuleField autoGrow minRows={2} value={editBio} maxLength={BIO_MAX} onChange={(e) => setEditBio(e.target.value)} placeholder="A little about you" onShowRules={openRules} /><Counter length={editBio.length} max={BIO_MAX} /></label>
        <div className="wc-row"><button type="submit" className="wc-btn" disabled={busy || !editName.trim() || !editHandle.trim() || breaksCommunityRules(editName, editBio)}>{busy ? 'Saving…' : 'Save'}</button><button type="button" className="wc-btn is-ghost" onClick={() => setEditingProfile(false)}>Cancel</button></div>
      </form>}
      {!own && user && <div className="wc-row">
        <button type="button" className="wc-btn" aria-pressed={followingIds.includes(details.user_id)} onClick={() => toggleFollow(details.user_id)}>{followingIds.includes(details.user_id) ? 'Following' : 'Follow'}</button>
        <button type="button" className="wc-btn is-ghost" onClick={async () => { try { const st = community.friendshipState(friendships, user.id, details.user_id); if (st.state === 'none') await community.sendFriendRequest(supabase, user.id, details.user_id); else if (st.state === 'incoming') await community.acceptFriendRequest(supabase, st.row.id); else return; setRefresh((v) => v + 1); } catch (e) { notifyError(e); } }}>{({ none: 'Add friend', incoming: 'Accept request', requested: 'Requested', friends: 'Friends' })[community.friendshipState(friendships, user.id, details.user_id).state]}</button>
      </div>}
      {!user && <div className="wc-row"><button type="button" className="wc-btn" onClick={() => requireAccount('following people')}>Follow</button></div>}
      <h2 className="wc-h2">Playlists</h2>
      {profilePlaylists.length ? <div className="wc-pl-grid">{profilePlaylists.map(playlistCard)}</div> : <p className="wc-muted">No playlists shared yet.</p>}
      <h2 className="wc-h2">Posts</h2>
      {profilePosts.length ? profilePosts.map((p) => renderPost(p)) : <p className="wc-muted">No posts shared yet.</p>}
    </section>;
  } else if (search) {
    main = search.trim().length < 2 ? <p className="wc-muted">Type at least two letters to search Community.</p> : !searchResults ? <p className="wc-muted">Searching…</p> : <>
      {searchResults.people.length > 0 && <><h2 className="wc-h2">People</h2><div className="wc-people">{searchResults.people.map((p) => <button type="button" key={p.user_id} onClick={() => openProfile(p.username)}><Avatar name={p.display_name} path={p.avatar_url} /><span>{p.display_name}<small>@{p.username}</small></span></button>)}</div></>}
      {searchResults.posts.length > 0 && <><h2 className="wc-h2">Posts</h2>{searchResults.posts.map((p) => renderPost(p))}</>}
      {searchResults.playlists.length > 0 && <><h2 className="wc-h2">Playlists</h2><div className="wc-pl-grid">{searchResults.playlists.map(playlistCard)}</div></>}
      {!searchResults.people.length && !searchResults.posts.length && !searchResults.playlists.length && <p className="wc-muted">No results. Try a name, topic, or playlist.</p>}
    </>;
  } else {
    const switchSection = (k) => {
      if (k !== 'recent' && !user) { requireAccount('your playlists'); return; }
      if (k !== playlistSection) setPlaylists([]);
      setPlaylistSection(k);
    };
    const firstLoad = loading && (tab === 'playlists' ? playlists.length === 0 : posts.length === 0);
    main = tab === 'announcements' ? <Announcements supabase={supabase} user={user} products={products} productsById={productsById} loadArticles={loadArticles} teamBadges={teamBadges} variant="web" onOpenProduct={onOpenProduct} onOpenPlaylist={openPlaylistById} onOpenArticle={onOpenArticle} onOpenProfile={openProfile} onRequireAuth={requireAccount} onShowRules={openRules} /> : <>
      {tab === 'playlists' ? <>
        <div className="wc-row is-split wc-subbar"><div className="wc-subtabs" role="tablist" aria-label="Playlists">{[['recent', 'Community'], ['friends', 'Friends'], ['mine', 'My playlists']].map(([k, l]) => <button type="button" role="tab" key={k} aria-selected={playlistSection === k} onClick={() => switchSection(k)}>{l}</button>)}</div><button type="button" className="wc-btn" onClick={() => openCompose('playlist')}>Create playlist</button></div>
        {firstLoad ? <SkeletonPlaylists /> : playlists.length ? <div className="wc-pl-grid">{playlists.map(playlistCard)}</div> : <div className="wc-empty"><h2>No playlists yet</h2><p>Collect your favorites.</p></div>}
      </> : <>
        <div className="wc-composer">
          <Avatar size={36} name={profile?.display_name || 'You'} path={profile?.avatar_url} anonymous={!profile} />
          <button type="button" className="wc-share" onClick={() => openCompose(tab === 'question' ? 'question' : tab === 'review' ? 'review' : 'post')}>{tab === 'question' ? 'Ask the community a question' : tab === 'review' ? 'Review a product you’ve tried' : 'Share with the community'}</button>
          <div className="wc-composer-kinds" aria-label="Or start a">
            {Object.keys(KIND_TITLES).map((k) => <button type="button" key={k} className={`is-${k}`} onClick={() => openCompose(k)}>{VERB[k] || k}</button>)}
          </div>
        </div>
        {tab === 'for-you' && <div className="wc-pinned"><Announcements supabase={supabase} user={user} products={products} productsById={productsById} loadArticles={loadArticles} teamBadges={teamBadges} variant="web" onOpenProduct={onOpenProduct} onOpenPlaylist={openPlaylistById} onOpenArticle={onOpenArticle} onOpenProfile={openProfile} onRequireAuth={requireAccount} onShowRules={openRules} /></div>}
        {firstLoad ? <div className="wc-skel-list" aria-busy="true" aria-label="Loading posts"><SkeletonPost /><SkeletonPost /><SkeletonPost /></div> : posts.map((p) => renderPost(p))}
        {!loading && posts.length === 0 && (tab === 'following' ? <div className="wc-empty">
          <h2>No posts yet</h2>
          <p>{suggestedPeople.length ? 'Follow a few people to fill this feed.' : 'Follow people from their profiles to see their posts here.'}</p>
          {suggestedPeople.length > 0 && <ul className="wc-suggest" aria-label="People to follow">{suggestedPeople.map((p) => <li key={p.user_id}>
            <button type="button" className="wc-suggest-who" onClick={() => openProfile(p.username)}><Avatar name={p.display_name || p.username} path={p.avatar_url} /><span><strong>{p.display_name || p.username}</strong><small>@{p.username}</small></span></button>
            <button type="button" className="wc-btn is-small" onClick={() => toggleFollow(p.user_id)}>Follow</button>
          </li>)}</ul>}
        </div> : <div className="wc-empty"><h2>{tab === 'question' ? 'No questions yet' : tab === 'review' ? 'No reviews yet' : 'No posts yet'}</h2><p>Be the first.</p></div>)}
        {cursor && <button type="button" className="wc-btn is-ghost wc-more-btn" disabled={loading} onClick={loadMore}>{loading ? 'Loading…' : 'Show more posts'}</button>}
      </>}
    </>;
  }

  const switchTab = (k) => {
    if (k === 'following' && !user) { requireAccount('your following feed'); return; }
    if (page) closePage();
    if (search) { setSearch(''); setSearchResults(null); }
    if (k !== tab) { setPosts([]); setCursor(null); setError(''); }
    setTab(k);
  };
  const onFeed = !page && !search;
  const openMe = () => (profile ? openProfile(profile.username) : requireAccount('your Community profile'));

  // Side modules, each built only from loaded data and hidden when empty.
  const topics = (() => {
    const counts = new Map();
    [...posts, ...sideQuestions].forEach((p) => (p.topics || []).forEach((t) => { const k = String(t).toLowerCase(); counts.set(k, (counts.get(k) || 0) + 1); }));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOPICS_MAX).map(([t]) => t);
  })();
  const questionsSide = sideQuestions.filter((q) => !(page?.type === 'post' && page.id === q.id)).slice(0, SIDE_MAX);
  const playlistsSide = page?.type === 'playlist' ? [] : sidePlaylists.slice(0, SIDE_MAX);
  const peopleSide = suggestedPeople.slice(0, SIDE_MAX);

  return <section className="wc wc3">
    <div className={`wc-head${page ? '' : ` ay3-band ay3-band--sky ay3-zigzag ay3-edge-bottom ay3-commhero${seenBefore ? ' is-compact' : ''}`}`}>
      {page ? <button type="button" className="wc-back" onClick={closePage}>← Community</button> : <div><p className="ay3-kicker is-keep">The powder room</p><h1 className="ay3-title">Ask, review, <em>share.</em></h1><p className="wc-hero-sub">Real talk between women, about the products we actually use.</p></div>}
      {!page && <div className="wc-mirror" aria-hidden="true"><span className="wc-mirror__frame"><img src="/landing/stalls-trio.webp" alt="" /></span><span className="wc-mirror__lip">say it here ♡</span></div>}
      <div className="wc-head-actions"><label className="wc-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4.5 4.5" /></svg><input value={search} onChange={(e) => { setSearch(e.target.value); setSearchResults(null); if (page) closePage(); }} placeholder="Search people, posts, playlists" aria-label="Search Community" />{search && <button type="button" aria-label="Clear search" onClick={() => { setSearch(''); setSearchResults(null); }}>×</button>}</label>
        {user && <button type="button" className="wc-bell" onClick={openUpdates} aria-label={unreadCount ? `Updates, ${unreadCount} new` : 'Updates'}><Icon name="bell" size={20} />{unreadCount > 0 && <span className="wc-bell-dot" aria-hidden="true" />}</button>}
        <button type="button" className="wc-head-me" onClick={openMe} aria-label={profile ? 'Your Community profile' : 'Sign in for a Community profile'}><Avatar size={40} name={profile?.display_name || 'You'} path={profile?.avatar_url} anonymous={!profile} /></button>
      </div>
    </div>
    {error && <p className="wc-error" role="alert">{error}</p>}
    {notice && <p className="wc-notice" role="status">{notice}</p>}
    <div className="wc-layout">
      <nav className="wc-nav" aria-label="Community">
        {page?.type !== 'profile' && <div className="wc-tabs" role="tablist" aria-label="Community feeds">{TABS.map(([k, l]) => <button type="button" role="tab" key={k} aria-selected={onFeed && tab === k} className={onFeed && tab === k ? 'is-on' : ''} onClick={() => switchTab(k)}>{l}</button>)}</div>}
        {user && !profile ? <div className="wc-card wc-join"><h3>Join Community</h3><p className="wc-muted">Your health answers stay private.</p>
          <RuleField as="input" value={profileName} maxLength={50} onChange={(e) => setProfileName(e.target.value)} placeholder="Display name" aria-label="Display name" onShowRules={openRules} />
          <RuleField as="input" value={profileHandle} maxLength={30} onChange={(e) => setProfileHandle(e.target.value.toLowerCase())} placeholder="Username" aria-label="Username" onShowRules={openRules} />
          <button type="button" className="wc-btn" disabled={busy || !profileName.trim() || !profileHandle.trim() || breaksCommunityRules(profileName, profileHandle)} onClick={saveProfile}>Create profile</button></div>
          : <div className="wc-me"><Avatar size={40} name={profile?.display_name || 'Guest'} path={profile?.avatar_url} anonymous={!profile} /><div><strong>{profile?.display_name || 'Guest'}</strong><small>{profile ? `@${profile.username}` : 'Posting anonymously'}</small></div>
            {profile ? <button type="button" className="wc-link wc-me-btn" onClick={() => openProfile(profile.username)}>View profile</button> : <button type="button" className="wc-link wc-me-btn" onClick={() => requireAccount('your Community profile')}>Sign in</button>}</div>}
        <button type="button" className="wc-rules-btn" onClick={openRules}><span aria-hidden="true">§</span>Community rules</button>
      </nav>
      <div className="wc-main">{main}</div>
      <aside className="wc-side" aria-label="More from Community">
        {questionsSide.length > 0 && <section className="wc-mod is-questions"><h2>Recent questions</h2><ul>{questionsSide.map((q) => <li key={q.id}><button type="button" className="wc-mod-q" onClick={() => openPost(q)}><span>{q.body}</span><small>{Number(q.comment_count) ? `${q.comment_count} ${Number(q.comment_count) === 1 ? 'reply' : 'replies'}` : 'No replies yet'}</small></button></li>)}</ul>
          {!(onFeed && tab === 'question') && <button type="button" className="wc-link" onClick={() => switchTab('question')}>All questions</button>}</section>}
        {playlistsSide.length > 0 && <section className="wc-mod is-playlists"><h2>Playlists</h2><ul>{playlistsSide.map((p) => <li key={p.id}><button type="button" className="wc-mod-pl" onClick={() => openPlaylist(p)}><PlaylistCover playlist={p} productsById={productsById} /><span><strong>{p.title}</strong><small>{p.item_count || 0} {(p.item_count || 0) === 1 ? 'product' : 'products'} · {p.owner_display_name || 'ayna community'}</small></span></button></li>)}</ul>
          {!(onFeed && tab === 'playlists') && <button type="button" className="wc-link" onClick={() => switchTab('playlists')}>All playlists</button>}</section>}
        {peopleSide.length > 0 && <section className="wc-mod is-people"><h2>People to follow</h2><ul>{peopleSide.map((p) => <li key={p.user_id} className="wc-mod-person"><button type="button" className="wc-suggest-who" onClick={() => openProfile(p.username)}><Avatar size={32} name={p.display_name || p.username} path={p.avatar_url} /><span><strong>{p.display_name || p.username}</strong><small>@{p.username}</small></span></button><button type="button" className="wc-btn is-small" onClick={() => toggleFollow(p.user_id)}>Follow</button></li>)}</ul></section>}
        {topics.length > 0 && <section className="wc-mod is-topics"><h2>Topics</h2><div className="wc-mod-topics">{topics.map((t) => <button type="button" key={t} onClick={() => { if (page) closePage(); setSearch(t); setSearchResults(null); }}>#{t}</button>)}</div></section>}
      </aside>
    </div>

    {composeSheet}
    {showUpdates && <Sheet title="Updates" onClose={() => setShowUpdates(false)}>
      {!notifications ? <div className="wc-skel-list" aria-busy="true" aria-label="Loading updates"><span className="wc-skel-line" /><span className="wc-skel-line is-mid" /></div>
        : notifications.length ? (() => {
          // People, not system strings: "Eliz accepted your friend request".
          const VERBS = { follow: 'followed you', followed: 'followed you', friend_accepted: 'accepted your friend request', friend_request: 'sent you a friend request', comment: 'replied to your post', reply: 'replied to you', reaction: 'found your post helpful', helpful: 'found your post helpful', recommendation: 'recommended a product to you', recommend: 'recommended a product to you', mention: 'mentioned you' };
          const day = 86400000; const now = Date.now();
          const group = (n) => { const t = new Date(n.created_at).getTime(); return now - t < day ? 'Today' : now - t < 7 * day ? 'This week' : 'Earlier'; };
          const items = notifications.slice(0, 20);
          return ['Today', 'This week', 'Earlier'].map((g) => {
            const list = items.filter((n) => group(n) === g);
            if (!list.length) return null;
            return <div key={g} className="wc-notes-group"><h3 className="wc-notes-h">{g}</h3><ul className="wc-notes">{list.map((n) => {
              const who = n.actor?.display_name || (n.actor?.username ? `@${n.actor.username}` : 'Someone');
              const verb = VERBS[String(n.type || '').toLowerCase()];
              const text = verb ? `${who} ${verb}` : (n.message || n.body || `${who}: ${String(n.type || 'update').replace(/_/g, ' ')}`);
              return <li key={n.id}>
                <span className="wc-notes-av" aria-hidden="true">{String(who).replace('@', '').charAt(0).toUpperCase()}</span>
                {(() => {
                  const postId = n.post_id || n.data?.post_id || n.payload?.post_id || null;
                  const aboutPost = postId && /comment|reply|reaction|helpful|mention/i.test(String(n.type || ''));
                  if (aboutPost) return <button type="button" className="wc-notes-link" onClick={async () => { setShowUpdates(false); try { const post = await community.getFeedPost(supabase, postId); if (post) openPost(post); } catch (e) { notifyError(e); } }}>{text}</button>;
                  if (n.actor?.username) return <button type="button" className="wc-notes-link" onClick={() => { setShowUpdates(false); openProfile(n.actor.username); }}>{text}</button>;
                  return <span>{text}</span>;
                })()}
                <small>{timeLabel(n.created_at)}</small>
              </li>;
            })}</ul></div>;
          });
        })()
        : <p className="wc-muted">You’re all caught up.</p>}
    </Sheet>}
    {showRules && <Sheet title="Community rules" onClose={() => setShowRules(false)} className="wc-rules-sheet"><CommunityRulesList /><button type="button" className="wc-btn" onClick={() => setShowRules(false)}>Got it</button></Sheet>}
    {editPost && <Sheet title="Edit post" onClose={() => setEditPost(null)}>
      <RuleField autoGrow minRows={4} value={editBody} maxLength={POST_MAX} onChange={(e) => setEditBody(e.target.value)} onShowRules={openRules} />
      <div className="wc-compose-foot"><button type="button" className="wc-btn" disabled={busy || !editBody.trim() || breaksCommunityRules(editBody)} onClick={async () => {
        setBusy(true);
        try {
          await community.updatePostBody(supabase, editPost.id, editBody.trim());
          setPosts((prev) => prev.map((p) => (p.id === editPost.id ? { ...p, body: editBody.trim() } : p)));
          if (details?.id === editPost.id) setDetails((d) => ({ ...d, body: editBody.trim() }));
          setEditPost(null); toast('Post updated');
        } catch (e) { notifyError(e); } finally { setBusy(false); }
      }}>{busy ? 'Saving…' : 'Save changes'}</button></div>
    </Sheet>}
    {deleteTarget && <Sheet title="Delete post?" onClose={() => setDeleteTarget(null)}><p className="wc-muted">This removes your post and its replies.</p><button type="button" className="wc-btn" disabled={busy} onClick={confirmDelete}>{busy ? 'Deleting…' : 'Delete post'}</button></Sheet>}
    {reportPost && <Sheet title="Report post" onClose={() => setReportPost(null)}><select data-autofocus value={reportReason} onChange={(e) => setReportReason(e.target.value)} aria-label="Reason"><option value="misinformation">Health misinformation</option><option value="harassment">Harassment</option><option value="spam">Spam</option><option value="other">Something else</option></select><button type="button" className="wc-btn" disabled={busy} onClick={submitReport}>Send report</button></Sheet>}
  </section>;
}
