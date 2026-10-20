// Topics here are the curated ayna list (src/utils/community/topics.js).
// User-created topics are designed but deliberately not built yet: see
// docs/community-user-topics.md for the plan and when to turn them on.
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { apiUrl } from '../../utils/apiUrl';
import EmptyState from '../components/EmptyState.jsx';
import MobileHeader from '../components/MobileHeader.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { getSupabaseClient } from '../../utils/supabaseClient.js';
import { getGuestClient, getGuestId, ensureGuestSession } from '../../utils/community/guestClient.js';
import * as community from '../../utils/community/communityStore.js';
import { rankForYou, postProductIds } from '../../utils/community/ranking.js';
import { extractHashtagTopics, suggestHashtags, suggestTopicsForProducts, COMMUNITY_TOPICS, topicLabel } from '../../utils/community/topics.js';
import { useFollowedTopics } from '../utils/communityTopicFollows.js';
import { uploadCommunityImage, deleteCommunityImage, checkImageFile, MAX_POST_PHOTOS, publicMediaUrl } from '../../utils/community/imageUpload.js';
import { CATEGORY_LABELS, getProfileMatchPercentForProduct, getProductMatchDetailsForProduct } from '../../data/products.js';
import { scoreSearchMatch } from '../../utils/search/index.js';
import { searchCommunityTolerant } from '../../utils/search/communitySearch.js';
import SmartSearchInput from '../../components/search/SmartSearchInput.jsx';
import { customProductId, customProductName } from '../../utils/customProductTag.js';
import PlaylistCoverPicker from '../components/PlaylistCoverPicker.jsx';
import PlaylistAudiencePicker from '../components/PlaylistAudiencePicker.jsx';
import { makePlaylistCoverFile } from '../components/playlistCoverImage.js';
import { RuleField, CommunityRulesList } from '../../components/community/RuleField.jsx';
import { VerifiedBadge } from '../../components/community/VerifiedBadge.jsx';
import { RatingStars, RatingPicker } from '../../components/community/RatingStars.jsx';
import { normalizeRating } from '../../utils/community/reviewRatings.js';
import { useTeamBadges } from '../../components/community/useTeamBadges.js';
import Announcements from '../../components/community/Announcements.jsx';
import { breaksCommunityRules } from '../../utils/communityRules.js';
import './community-mobile.css';
import '../community-play.css';
import { displayName } from '../utils/displayName.js';

const TABS = [ ['for-you', 'For you'], ['following', 'Following'], ['question', 'Questions'], ['review', 'Reviews'], ['playlists', 'Playlists'], ['announcements', 'Announcements'] ];
const POST_KINDS = { question: 'Question', review: 'Review', post: 'Post' };
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
    people: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.4c2.1.7 3.5 2.7 3.5 5.6" /></>,
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
  if (!product) {
    const customName = customProductName(String(productId || ''));
    if (!customName) return null;
    return <span className="am-product is-custom">
      <span className="am-product-photo" aria-hidden="true">{customName.slice(0, 1).toUpperCase()}</span>
      <span><strong>{customName}</strong><small>Not in the ayna catalog yet</small></span>
    </span>;
  }
  const match = quizAnswers ? getProductMatchDetailsForProduct(product, quizAnswers) : null;
  const showMatch = match?.matchStatus === 'scored' && Number.isFinite(match.percent);
  return <button type="button" className="am-product" onClick={() => onOpenProduct(product)}>
    <span className="am-product-photo"><ProductImage product={product} src={product.image || product.imageUrl || product.images?.[0]} alt="" allowBrandLogo={product.type === 'digital'} style={{ objectFit: 'contain' }} /></span>
    <span><strong>{displayName(product)}</strong><small>{product.brand || 'ayna product'}</small></span>
    <em>{showMatch ? `${match.percent}% match` : 'View'}</em>
  </button>;
}

const THUMB_TONES = ['#769ebe', '#F7BADD', '#769ebe', '#ffedac'];
// Row thumbnail: the uploaded cover, else up to four product photos on white,
// else a branded pastel tile with the title's first letter.
function PlaylistThumb({ playlist, productsById }) {
  if (playlist.cover_url) return <span className="am-pl-thumb"><img src={publicMediaUrl(playlist.cover_url)} alt="" loading="lazy" /></span>;
  const picks = (playlist.preview_product_ids || []).map((id) => productsById.get(String(id))).filter(Boolean).slice(0, 4);
  if (picks.length) return <span className={`am-pl-thumb is-mosaic is-${picks.length}`}>{picks.map((p) => <span key={p.id}><ProductImage product={p} src={p.image || p.imageUrl || p.images?.[0]} alt="" allowBrandLogo={p.type === 'digital'} style={{ objectFit: 'contain' }} /></span>)}</span>;
  const title = String(playlist.title || 'ayna').trim();
  const tone = THUMB_TONES[[...title].reduce((n, c) => n + c.charCodeAt(0), 0) % THUMB_TONES.length];
  return <span className="am-pl-thumb is-brand" style={{ background: tone }}><b>{(title[0] || 'a').toUpperCase()}</b><small>ayna</small></span>;
}

function ProductPicker({ products, value, onChange }) {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    return products.map((product) => ({
      product,
      score: scoreSearchMatch(q, product),
    })).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, 10).map(({ product }) => product);
  }, [products, query]);
  const selected = products.find((p) => String(p.id) === String(value));
  const selectedName = selected?.name || customProductName(String(value || ''));
  const draft = query.trim().replace(/\s+/g, ' ');
  const exact = matches.some((p) => String(p.name || '').trim().toLowerCase() === draft.toLowerCase());
  const addCustom = () => { const id = customProductId(draft); if (id) { onChange(id); setQuery(''); } };
  return <div className="am-picker">
    <label htmlFor="am-product-query">{selectedName ? 'Product' : 'Find a product'}</label>
    {selectedName ? <div className="am-picked"><span>{selectedName}</span><button type="button" onClick={() => { onChange(null); setQuery(''); }}>Remove</button></div> : <>
      <div className="am-product-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg><SmartSearchInput id="am-product-query" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.length >= 2) { e.preventDefault(); if (matches.length && exact) { onChange(matches[0].id); setQuery(''); } else addCustom(); } }} placeholder="Search products" /></div>
      {draft.length >= 2 && <div className="am-results">
        {!exact && <button type="button" className="is-add" onClick={addCustom}>+ Add “{draft}”<small>{matches.length ? 'Not listed? Tag it anyway' : 'Not in the ayna catalog yet'}</small></button>}
        {matches.map((p) => <button type="button" key={p.id} onClick={() => { onChange(p.id); setQuery(''); }}>{p.name}<small>{[p.brand, p.category?.replace(/-/g, ' ')].filter(Boolean).join(' · ')}</small></button>)}
      </div>}
    </>}
  </div>;
}

// Follow or unfollow topics. Followed topics become pods above the feed.
function TopicSheet({ followed, onToggle, onClose, onSuggest }) {
  const sheetRef = useRef(null);
  const doneRef = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    doneRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...(sheetRef.current?.querySelectorAll('button:not(:disabled)') || [])];
      if (focusable.length < 2) return;
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, [onClose]);
  return <div className="am-sheet-backdrop" onClick={onClose}>
    <div ref={sheetRef} className="am-sheet am-topic-sheet" role="dialog" aria-modal="true" aria-labelledby="am-topic-sheet-title" onClick={(e) => e.stopPropagation()}>
      <div className="am-sheet-head am-topic-sheet-head"><h2 id="am-topic-sheet-title">Your topics</h2><button ref={doneRef} type="button" onClick={onClose}>Done</button></div>
      <p>Follow topics to see their posts in My topics. Change them any time.</p>
      <div className="am-topic-grid">{COMMUNITY_TOPICS.map((t) => { const on = followed.includes(t.key); return <button type="button" key={t.key} aria-pressed={on} className={on ? 'is-on' : ''} onClick={() => onToggle(t.key)}><span aria-hidden="true">{on ? '✓' : '+'}</span>{t.label}</button>; })}</div>
      <div className="am-topic-suggest"><span>Missing a topic?</span><button type="button" onClick={onSuggest}>Suggest a topic</button></div>
    </div>
  </div>;
}

// "Suggest a topic": goes to the team through the same anonymous path as
// Suggest a product (api/suggestions.js, kind 'topic'): email plus team text.
async function sendTopicSuggestion({ name, why }) {
  const res = await fetch(apiUrl('/api/suggestions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    body: JSON.stringify({ kind: 'topic', topic: name, reason: why, context: 'app-community', platform: 'app' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'That did not send. Try again in a moment.');
}

function SuggestTopicSheet({ onClose, onSent, onShowRules }) {
  const [name, setName] = useState('');
  const [why, setWhy] = useState('');
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState('');
  const send = async () => {
    if (sending || name.trim().length < 2 || breaksCommunityRules(name, why)) return;
    setSending(true); setProblem('');
    try { await sendTopicSuggestion({ name: name.trim(), why: why.trim() }); onSent(); }
    catch (e) { setProblem(e.message); } finally { setSending(false); }
  };
  return <div className="am-sheet-backdrop" onClick={onClose}><div className="am-sheet am-compose-sheet am-suggest-sheet" role="dialog" aria-modal="true" aria-labelledby="am-suggest-title" onClick={(e) => e.stopPropagation()}>
    <div className="am-sheet-head"><h2 id="am-suggest-title">Suggest a topic</h2><button type="button" aria-label="Close" onClick={onClose}>×</button></div>
    <p className="am-detail-copy">Tell us which topic you want in Community. The team reads every one.</p>
    <label className="am-field-label" htmlFor="am-suggest-name">Topic name</label>
    <RuleField as="input" id="am-suggest-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="e.g. Adenomyosis" onShowRules={onShowRules} />
    <label className="am-field-label" htmlFor="am-suggest-why">Why (optional)</label>
    <RuleField id="am-suggest-why" value={why} maxLength={500} onChange={(e) => setWhy(e.target.value)} placeholder="What would you want to talk about there?" onShowRules={onShowRules} />
    {problem && <p className="am-error" role="alert">{problem}</p>}
    <button type="button" className="am-primary" disabled={sending || name.trim().length < 2 || breaksCommunityRules(name, why)} onClick={send}>{sending ? 'Sending…' : 'Send suggestion'}</button>
  </div></div>;
}

const PENDING_INVITE_KEY = 'ayna_pending_playlist_invite';
const readPendingInvite = () => { try { return sessionStorage.getItem(PENDING_INVITE_KEY) || ''; } catch { return ''; } };
const clearPendingInvite = () => { try { sessionStorage.removeItem(PENDING_INVITE_KEY); } catch { /* storage blocked */ } };

export default function CommunityScreen({ authUser, products = [], articles = null, quizAnswers, headerInitial, onOpenProduct, onOpenArticle, onGoBrowse, onGoEco, onOpenSaved, onOpenProfile, onRequireAuth, seedKind, seedProductId, seedPlaylistId, seedPostId }) {
  const supabase = authUser ? getSupabaseClient() : (getGuestClient() || getSupabaseClient());
  const productsById = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);
  const [tab, setTab] = useState('for-you');
  // Topic pods: followed topics (defaults from her quiz), saved on this device.
  const [followedTopics, toggleTopic] = useFollowedTopics(authUser?.id, quizAnswers);
  const followedKey = followedTopics.join(',');
  const [topicScopeChoice, setTopicScope] = useState(null); // 'mine' | 'all' | topic key
  const [topicSheetOpen, setTopicSheetOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [friendHandle, setFriendHandle] = useState('');
  const [friendshipProfiles, setFriendshipProfiles] = useState(new Map());
  // Collaborative playlists. available: false until the migration has run.
  const [collab, setCollab] = useState({ available: false, rows: [] });
  const [collabSheetOpen, setCollabSheetOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const closeTopicSheet = useCallback(() => setTopicSheetOpen(false), []);
  const topicScope = topicScopeChoice === 'mine' && !followedTopics.length ? 'all'
    : topicScopeChoice && topicScopeChoice !== 'mine' && topicScopeChoice !== 'all' && !followedTopics.includes(topicScopeChoice) ? (followedTopics.length ? 'mine' : 'all')
    : topicScopeChoice || (followedTopics.length ? 'mine' : 'all');
  const topicsTab = tab === 'for-you' || tab === 'question' || tab === 'review';
  const scopedTopics = !topicsTab || topicScope === 'all' ? null : topicScope === 'mine' ? followedKey.split(',').filter(Boolean) : [topicScope];
  const scopedTopicsKey = scopedTopics ? scopedTopics.join(',') : '';
  const [posts, setPosts] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [playlistSection, setPlaylistSection] = useState('recent');
  const [editingPlaylist, setEditingPlaylist] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState('public');
  const [editCoverMode, setEditCoverMode] = useState('photo');
  const [editCoverColor, setEditCoverColor] = useState('#3e2723');
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
  const [profilePosts, setProfilePosts] = useState([]);
  const [profilePlaylists, setProfilePlaylists] = useState([]);
  const [compose, setCompose] = useState(seedKind || null); // 'post' | 'question' | 'review' | 'playlist'
  const [body, setBody] = useState('');
  const [productId, setProductId] = useState(seedProductId || null);
  const [anonymous, setAnonymous] = useState(false);
  const [rating, setRating] = useState(5);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [playlistVisibility, setPlaylistVisibility] = useState('public');
  const [coverMode, setCoverMode] = useState('color');
  const [coverColor, setCoverColor] = useState('#3e2723');
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
  const [editPost, setEditPost] = useState(null);
  const [editBody, setEditBody] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [postMenuId, setPostMenuId] = useState(null);
  const [reportReason, setReportReason] = useState('misinformation');
  const screenRef = useRef(null);
  const [showRules, setShowRules] = useState(false);
  const teamBadges = useTeamBadges(supabase, authUser);
  const badgeFor = (authorId, anon = false) => (!anon && authorId ? teamBadges.get(authorId) || null : null);
  const openRules = () => setShowRules(true);
  const sheetOpen = Boolean(compose || editingPlaylist || editingProfile || reportPost || deleteTarget || deletePlaylistTarget || editPost || showRules || suggestOpen || collabSheetOpen);
  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.activeElement;
    const sheets = screenRef.current?.querySelectorAll('.am-sheet');
    const sheet = sheets?.[sheets.length - 1];
    if (!sheet) return;
    const controls = () => [...sheet.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]')].filter((node) => node.getClientRects().length);
    controls()[0]?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (showRules) { setShowRules(false); return; }
        setCompose(null); setEditingPlaylist(false); setEditingProfile(false); setReportPost(null); setDeleteTarget(null); setDeletePlaylistTarget(null); setEditPost(null); setSuggestOpen(false); setCollabSheetOpen(false);
      }
      if (event.key !== 'Tab') return;
      const nodes = controls();
      const first = nodes[0]; const last = nodes[nodes.length - 1];
      if (!first) return;
      if (!sheet.contains(document.activeElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); if (previous?.isConnected) previous.focus(); };
  }, [sheetOpen, showRules, suggestOpen, collabSheetOpen]);

  useEffect(() => {
    if (!postMenuId) return undefined;
    const onDown = (event) => { if (!event.target.closest?.('.am-post-menu-wrap')) setPostMenuId(null); };
    const onKey = (event) => { if (event.key === 'Escape') setPostMenuId(null); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [postMenuId]);

  const hashtagMatch = body.match(/(?:^|\s)#([A-Za-z][\w-]*)?$/);
  const hashtagSuggestions = hashtagMatch ? suggestHashtags(hashtagMatch[1] || '', 6) : [];

  const notifyError = (e) => setError(community.friendlyError(e));
  const requireAccount = (feature = 'this feature') => onRequireAuth?.(feature);
  const closePage = () => { setEditingPlaylist(false); setCollabSheetOpen(false); setInviteLink(''); setCollab({ available: false, rows: [] }); setPage(null); setDetails(null); setComments([]); setItems([]); setError(''); };
  const openSuggestTopic = () => {
    if (!authUser) { requireAccount('topic suggestions'); return; }
    setTopicSheetOpen(false); setSuggestOpen(true);
  };
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
      const everyone = rows.map((r) => (r.requester_id === authUser.id ? r.addressee_id : r.requester_id));
      const profiles = await community.getProfilesByIds(supabase, everyone);
      setFriendshipProfiles(profiles);
      setFriendProfiles(ids.map((id) => profiles.get(id)).filter(Boolean));
    }).catch(() => {});
  }, [supabase, authUser, refresh]);

  useEffect(() => {
    if (!supabase || page || search) return;
    if (tab === 'announcements') { setPosts([]); setCursor(null); setLoading(false); return; }
    let active = true;
    setLoading(true);
    const run = async () => {
      if (tab === 'playlists') {
        const rows = await community.listPlaylists(supabase, { section: playlistSection });
        if (active) { setPlaylists(rows); setPosts([]); setCursor(null); }
      } else {
        const rows = await community.listFeedPosts(supabase, { kind: tab === 'question' || tab === 'review' ? tab : null, authorIds: tab === 'following' ? followingIds : null, topics: scopedTopicsKey ? scopedTopicsKey.split(',') : null });
        if (active) { setPosts(tab === 'for-you' ? rankForYou(rows, { matchFor: (id) => { const p = productsById.get(String(id)); return p && quizAnswers ? getProfileMatchPercentForProduct(p, quizAnswers) : null; }, followingIds: new Set(followingIds) }) : rows); setCursor(rows.length === community.PAGE_SIZE ? community.nextCursor(rows, 'recent') : null); }
      }
    };
    run().catch((e) => { if (active) notifyError(e); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [supabase, tab, page, search, refresh, followingIds, productsById, quizAnswers, playlistSection, scopedTopicsKey]);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const rows = await community.listFeedPosts(supabase, { kind: tab === 'question' || tab === 'review' ? tab : null, authorIds: tab === 'following' ? followingIds : null, topics: scopedTopicsKey ? scopedTopicsKey.split(',') : null, cursor });
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
    setItems((playlist.preview_product_ids || []).map((product_id) => ({ product_id })));
    setCollab({ available: false, rows: [] }); setInviteLink('');
    try { setItems(await community.listPlaylistItems(supabase, playlist.id)); }
    catch (e) { if (!playlist.preview_product_ids?.length) notifyError(e); }
    loadCollaborators(playlist);
  };
  const loadCollaborators = async (playlist) => {
    try {
      const next = await community.listPlaylistCollaborators(supabase, playlist.id);
      setCollab(next);
      const ids = [playlist.owner_id, ...next.rows.map((r) => r.user_id)].filter(Boolean);
      if (ids.length) { const profiles = await community.getProfilesByIds(supabase, ids); setProfileById((previous) => new Map([...previous, ...profiles])); }
    } catch { setCollab({ available: false, rows: [] }); }
  };
  const isPlaylistOwner = Boolean(authUser && details && page?.type === 'playlist' && details.owner_id === authUser.id);
  const canEditItems = page?.type === 'playlist' && community.canEditPlaylist(details, authUser?.id, collab.rows);
  const addCollaborator = async (friend) => {
    if (!details?.id) return;
    setBusy(true); setError('');
    try { await community.addPlaylistCollaborator(supabase, details.id, friend.user_id); await loadCollaborators(details); setNotice(`${friend.display_name || friend.username} can now add products.`); }
    catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  const removeCollaborator = async (userId) => {
    if (!details?.id) return;
    setBusy(true); setError('');
    try {
      await community.removePlaylistCollaborator(supabase, details.id, userId);
      if (userId === authUser?.id) { setCollabSheetOpen(false); closePage(); setRefresh((v) => v + 1); setNotice('You left the playlist.'); return; }
      await loadCollaborators(details);
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  const shareInviteLink = async () => {
    if (!details?.id) return;
    setBusy(true); setError('');
    try {
      const code = await community.getPlaylistInviteCode(supabase, details.id);
      const link = code ? community.playlistInviteLink(code) : null;
      if (!link) { setError("Invite links aren't switched on yet."); return; }
      setInviteLink(link);
      if (navigator.share) { try { await navigator.share({ title: details.title, text: 'Add products to my ayna playlist with me:', url: link }); return; } catch { /* dismissed: the link stays on screen */ } }
      try { await navigator.clipboard.writeText(link); setNotice('Invite link copied.'); } catch { /* the link is shown to select */ }
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  // Opened from a product page's review list: open that review.
  useEffect(() => {
    if (!seedPostId || !supabase) return;
    community.getFeedPost(supabase, seedPostId).then((post) => { if (post) openPost(post); else setError('This post isn’t available anymore.'); }).catch(notifyError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedPostId]);
  // Opened from elsewhere (Ecosystem -> Save as a playlist -> Open playlist).
  useEffect(() => {
    if (seedPlaylistId && supabase) openPlaylistById(seedPlaylistId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedPlaylistId]);
  // Opened from a shared playlist invite link (MobileApp keeps the code
  // through sign-in in sessionStorage).
  const inviteAsked = useRef(false);
  useEffect(() => {
    const code = readPendingInvite();
    if (!code || !supabase) return;
    if (!authUser) {
      if (!inviteAsked.current) { inviteAsked.current = true; setNotice('Sign in to join the shared playlist.'); requireAccount('shared playlists'); }
      return;
    }
    clearPendingInvite();
    community.joinPlaylistByCode(supabase, code).then(async (result) => {
      if (!result.ok) { setError(result.message); return; }
      setTab('playlists'); setPlaylistSection('mine'); setRefresh((v) => v + 1);
      await openPlaylistById(result.playlistId);
      setNotice('You joined this playlist. You can add and remove products.');
    }).catch(notifyError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, supabase]);
  const openPlaylistById = async (id) => {
    try { const playlist = await community.getPlaylist(supabase, id); if (playlist) await openPlaylist(playlist); else setError('This playlist isn’t available anymore.'); } catch (e) { notifyError(e); }
  };
  const refreshPlaylist = async (id) => {
    const [next, nextItems] = await Promise.all([community.getPlaylist(supabase, id), community.listPlaylistItems(supabase, id)]);
    if (next) setDetails(next);
    setItems(nextItems);
    if (next) loadCollaborators(next);
    setRefresh((value) => value + 1);
  };
  const startPlaylistEdit = () => {
    setEditTitle(details.title || ''); setEditDescription(details.description || '');
    setEditVisibility(details.visibility || 'public'); setEditCoverMode('photo');
    setEditCoverText(''); setEditCoverPhoto(null); setEditingPlaylist(true);
  };
  const savePlaylist = async () => {
    if (!editTitle.trim() || !authUser || !details?.id || breaksCommunityRules(editTitle, editDescription)) return;
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
    setPage({ type: 'profile', id: username }); setDetails(null); setProfilePosts([]); setProfilePlaylists([]); setError('');
    try {
      const nextProfile = await community.getProfileByUsername(supabase, username);
      setDetails(nextProfile);
      if (nextProfile?.user_id) {
        const [postsResult, playlistsResult] = await Promise.allSettled([
          community.listFeedPosts(supabase, { authorIds: [nextProfile.user_id], limit: 8 }),
          community.listPlaylists(supabase, { section: nextProfile.user_id === authUser?.id ? 'mine' : 'owner', ownerIds: [nextProfile.user_id], limit: 8 }),
        ]);
        if (postsResult.status === 'fulfilled') setProfilePosts(postsResult.value);
        if (playlistsResult.status === 'fulfilled') setProfilePlaylists(playlistsResult.value);
      }
    } catch (e) { notifyError(e); }
  };
  const openNotifications = async () => {
    if (!authUser) { requireAccount('notifications'); return; }
    setPage({ type: 'notifications' }); setError('');
    try { const rows = await community.listNotifications(supabase); setDetails(rows); await community.markNotificationsRead(supabase); } catch (e) { notifyError(e); }
  };

  const openFriends = () => {
    if (!authUser) { requireAccount('friends'); return; }
    setPage({ type: 'friends' }); setDetails(true); setError(''); setFriendHandle('');
    setRefresh((v) => v + 1);
  };
  const addFriendByHandle = async () => {
    const handle = community.normalizeHandle(friendHandle);
    if (!handle) { setError('Type their @username, like @maya.k'); return; }
    if (!profile) { setError('Set up your community profile first.'); return; }
    if (handle === profile.username) { setError("That's you."); return; }
    setBusy(true); setError('');
    try {
      const target = await community.getProfileByUsername(supabase, handle);
      if (!target) { setError(`No one is called @${handle} yet.`); return; }
      const state = community.friendshipState(friendships, authUser.id, target.user_id);
      if (state.state === 'friends') { setNotice(`You and @${handle} are already friends.`); return; }
      if (state.state === 'requested') { setNotice(`Request already sent to @${handle}.`); return; }
      if (state.state === 'incoming') await community.acceptFriendRequest(supabase, state.row.id);
      else await community.sendFriendRequest(supabase, authUser.id, target.user_id);
      setFriendHandle(''); setRefresh((v) => v + 1);
      setNotice(state.state === 'incoming' ? `You and @${handle} are now friends.` : `Friend request sent to @${handle}.`);
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  const answerFriendRequest = async (row, accept) => {
    setBusy(true); setError('');
    try {
      if (accept) await community.acceptFriendRequest(supabase, row.id); else await community.removeFriendship(supabase, row.id);
      setRefresh((v) => v + 1);
    } catch (e) { notifyError(e); } finally { setBusy(false); }
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
    if (!authUser || !profileName.trim() || !profileHandle.trim() || breaksCommunityRules(profileName, profileHandle)) return;
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
    if (!authUser || !profile || !editProfileName.trim() || !editProfileHandle.trim() || breaksCommunityRules(editProfileName, editProfileBio)) return;
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
    if (compose === 'playlist' ? breaksCommunityRules(playlistTitle) : breaksCommunityRules(body)) return;
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
    if (!commentBody.trim() || !details?.id || breaksCommunityRules(commentBody)) return;
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

  const startEdit = (post) => {
    setPostMenuId(null); setError('');
    setEditPost(post); setEditBody(post.body || ''); setEditRating(normalizeRating(post.rating));
  };
  const saveEdit = async () => {
    if (!editPost || busy) return;
    const isReview = editPost.kind === 'review';
    if (isReview && !normalizeRating(editRating)) { setError('Pick a star rating.'); return; }
    setBusy(true); setError('');
    try {
      const client = authUser ? supabase : getGuestClient();
      if (!client) throw new Error('Please sign in again to edit this post.');
      const nextBody = editBody.trim();
      const patch = { body: nextBody, ...(isReview ? { rating: normalizeRating(editRating) } : {}) };
      await community.updatePost(client, editPost.id, patch);
      const apply = (p) => (p.id === editPost.id ? { ...p, ...patch, edited_at: new Date().toISOString() } : p);
      setPosts((prev) => prev.map(apply));
      setProfilePosts((prev) => prev.map(apply));
      if (page?.type === 'post' && details?.id === editPost.id) setDetails((d) => apply(d));
      setEditPost(null); setNotice(isReview ? 'Review updated.' : 'Post updated.');
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
        const results = await searchCommunityTolerant(community.searchCommunity, supabase, search);
        if (active) setSearchResults(results);
      } catch (e) { if (active) notifyError(e); }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, supabase]);

  const renderPost = (post) => {
    const anon = post.is_anonymous || !post.author_id;
    const authorName = anon ? 'Anonymous' : post.author_display_name || post.author_username || 'Community member';
    const kind = POST_KINDS[post.kind] ? post.kind : 'post';
    const helpful = Number(post.helpful_count) || 0;
    const replies = Number(post.comment_count) || 0;
    return <article className={`am-card am-post-card is-${kind}`} key={post.id}>
      <div className="am-post-head">
        <CommunityAvatar name={authorName} path={!anon ? profileById.get(post.author_id)?.avatar_url : null} anonymous={anon} />
        <div className="am-author-copy">
          <span className="am-author-line">{anon || !post.author_username ? <strong>{authorName}</strong> : <button type="button" onClick={() => openProfile(post.author_username)}>{authorName}</button>}<VerifiedBadge title={badgeFor(post.author_id, anon)} compact /></span>
          <small>{timeLabel(post.created_at)}</small>
        </div>
        <span className={`am-tag is-${kind}`}>{POST_KINDS[kind]}</span>
        <div className="am-post-menu-wrap">
          <button type="button" className="am-post-more" aria-label={`More options for ${authorName}'s post`} aria-expanded={postMenuId === post.id} onClick={() => setPostMenuId((id) => id === post.id ? null : post.id)}><CommunityIcon name="more" size={18} /></button>
          {postMenuId === post.id && <div className="am-post-menu">{post.is_mine && <button type="button" onClick={() => startEdit(post)}>{post.kind === 'review' ? 'Edit review' : 'Edit post'}</button>}<button type="button" onClick={() => { setPostMenuId(null); if (post.is_mine) setDeleteTarget(post); else setReportPost(post); }}>{post.is_mine ? 'Delete post' : 'Report post'}</button></div>}
        </div>
      </div>
      {post.kind === 'review' && <RatingStars value={post.rating} className="am-post-stars" />}
      <button type="button" className="am-postbody" onClick={() => openPost(post)}>{post.body}</button>
      {(post.media || []).length > 0 && <button type="button" className="am-photo-grid" onClick={() => openPost(post)} aria-label="Open post photos">{post.media.slice(0, 4).map((photo) => <img key={photo.path} src={publicMediaUrl(photo.path)} alt="" loading="lazy" />)}</button>}
      {postProductIds(post).slice(0, 1).map((id) => <ProductMention key={id} productId={id} productsById={productsById} quizAnswers={quizAnswers} onOpenProduct={onOpenProduct} />)}
      <div className="am-actions">
        <button type="button" aria-pressed={Boolean(post.viewer_found_helpful)} onClick={() => togglePost(post, 'helpful')}><CommunityIcon name="heart" size={17} /><span>{post.kind === 'post' ? 'Like' : 'Helpful'}{helpful ? ` ${helpful}` : ''}</span></button>
        <button type="button" onClick={() => openPost(post)}><CommunityIcon name="comment" size={17} /><span>Reply{replies ? ` ${replies}` : ''}</span></button>
        <button type="button" aria-pressed={Boolean(post.viewer_saved)} onClick={() => togglePost(post, 'save')}><CommunityIcon name="bookmark" size={17} /><span>{post.viewer_saved ? 'Saved' : 'Save'}</span></button>
      </div>
    </article>;
  };

  const renderEmpty = () => {
    const copy = {
      'for-you': ['No posts yet', 'Be the first to post.', 'Post', 'post', 'chat', 'pink'],
      following: ['No posts yet', 'Follow someone to see their posts.', 'Explore', null, 'spark', 'peri'],
      question: ['No questions yet', null, 'Ask', 'question', 'chat', 'butter'],
      review: ['No reviews yet', null, 'Review', 'review', 'spark', 'mint'],
      playlists: ['No playlists yet', 'Collect your favorites.', 'Create', 'playlist', 'bookmark', 'pink'],
    }[tab];
    return <div className="am-community-empty-slot"><EmptyState art={copy[4]} tone={copy[5]} title={copy[0]} body={copy[1]} actionLabel={copy[2]} onAction={() => copy[3] ? openCompose(copy[3]) : setTab('for-you')} /></div>;
  };

  if (!supabase) return <div className="am-screen"><MobileHeader activeTab="community" onGoBrowse={onGoBrowse} onGoEco={onGoEco} /><EmptyState art="offline" tone="butter" title="Community isn’t loading" body="We couldn’t reach the community. Check your connection and tap Try again." actionLabel="Try again" onAction={() => setRefresh((n) => n + 1)} secondaryLabel="Shop" onSecondary={onGoBrowse} /></div>;
  return <div className="am-screen" ref={screenRef}>
    <MobileHeader activeTab="community" initial={headerInitial} onGoBrowse={onGoBrowse} onGoEco={onGoEco} onGoCommunity={() => {}} onOpenSaved={onOpenSaved} onOpenProfile={onOpenProfile} />
    <div className="am-scroll">
      {!page && <div className="am-top"><div className="am-title"><h1>Community</h1></div><div className="am-top-actions"><button type="button" className="am-icon-button" onClick={() => authUser ? (profile ? openProfile(profile.username) : setNotice('Create your community profile below.')) : requireAccount('your Community profile')} aria-label="Community profile"><CommunityAvatar name={profile?.display_name || 'You'} path={profile?.avatar_url} /></button><button type="button" className="am-icon-button" onClick={openFriends} aria-label="Friends"><CommunityIcon name="people" /></button><button type="button" className="am-icon-button" onClick={openNotifications} aria-label="Notifications"><CommunityIcon name="bell" /></button></div></div>}
      {error && <p className="am-error" role="alert">{error}</p>}{notice && <p className="am-notice" role="status">{notice}</p>}
      {page ? <div className="am-subpage" key={`${page.type}-${page.id || 'current'}`}>
        <div className="am-subpage-header"><button type="button" className="am-back" onClick={closePage} aria-label="Back to Community"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg></button><span className="am-subpage-title">{({ playlist: 'Playlist', profile: 'Profile', notifications: 'Updates', post: 'Post', friends: 'Friends' })[page.type] || 'Community'}</span></div>
        {!details && <p className="am-empty" role="status">Loading…</p>}
        {page.type === 'post' && details && <>{renderPost(details)}<h2 className="am-section">Replies</h2>{comments.map((c) => <div className="am-comment" key={c.id}><div className="am-meta"><div className="am-author"><CommunityAvatar name={c.author_display_name || c.author_username} path={!c.is_anonymous && c.author_id ? profileById.get(c.author_id)?.avatar_url : null} anonymous={c.is_anonymous || !c.author_id} /><span>{c.is_anonymous || !c.author_id ? 'Anonymous' : c.author_display_name || c.author_username}</span><VerifiedBadge title={badgeFor(c.author_id, c.is_anonymous)} compact /></div><span>{timeLabel(c.created_at)}</span></div><p>{c.body}</p>{c.product_id && <ProductMention productId={c.product_id} productsById={productsById} quizAnswers={quizAnswers} onOpenProduct={onOpenProduct} />}<button type="button" onClick={() => setReplyTo(c.id)}>Reply</button></div>)}<div className="am-compose-inline">{replyTo && <button type="button" onClick={() => setReplyTo(null)}>Replying · cancel</button>}<RuleField value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Add to the conversation" aria-label="Your reply" onShowRules={openRules} /><ProductPicker products={products} value={productId} onChange={setProductId} /><button type="button" className="am-primary" disabled={busy || !commentBody.trim() || breaksCommunityRules(commentBody)} onClick={submitComment}>Post reply</button></div></>}
        {page.type === 'playlist' && details && <section className="am-playlist-detail">
          <div className="am-playlist-detail-hero">{details.cover_url ? <img className="am-cover-detail" src={publicMediaUrl(details.cover_url)} alt="Playlist cover" /> : <span className="am-mosaic" aria-hidden="true">{[0, 1, 2, 3].map((slot) => { const product = productsById.get(String(items[slot]?.product_id)); return <span key={slot} className={`am-mosaic-tile is-${slot}`}>{product && <ProductImage product={product} src={product.image || product.imageUrl || product.images?.[0]} alt="" allowBrandLogo={product.type === 'digital'} style={{ objectFit: 'contain' }} />}</span>; })}</span>}<div className="am-playlist-detail-copy"><small>{details.item_count ?? items.length} {(details.item_count ?? items.length) === 1 ? 'pick' : 'picks'}{collab.rows.length > 0 && <span className="am-collab-label">Collaborative</span>}</small><h2 className="am-detail-title">{details.title}</h2>{details.description && <p className="am-detail-copy">{details.description}</p>}</div></div>
          {authUser?.id === details.owner_id && <div className="am-playlist-owner-actions">
            <button type="button" className="am-secondary" onClick={startPlaylistEdit}>Edit</button>
            <button type="button" className="am-secondary" onClick={() => setDeletePlaylistTarget(details)}>Delete</button>
          </div>}
          {collab.available && (isPlaylistOwner || collab.rows.length > 0) && <div className="am-collab">
            <div className="am-collab-copy">
              <span className="am-collab-title">Collaborators</span>
              <span className="am-collab-avatars" aria-hidden="true">{[details.owner_id, ...collab.rows.map((r) => r.user_id)].slice(0, 5).map((id) => { const who = profileById.get(id); return <CommunityAvatar key={id} name={who?.display_name || who?.username || 'Member'} path={who?.avatar_url} />; })}</span>
              <small>{collab.rows.length ? `${[details.owner_id, ...collab.rows.map((r) => r.user_id)].map((id) => profileById.get(id)?.display_name || profileById.get(id)?.username).filter(Boolean).slice(0, 3).join(', ')}${collab.rows.length + 1 > 3 ? ` and ${collab.rows.length + 1 - 3} more` : ''}` : 'Invite friends to add products with you.'}</small>
            </div>
            {isPlaylistOwner ? <button type="button" className="am-secondary" onClick={() => { setCollabSheetOpen(true); setError(''); }}>{collab.rows.length ? 'Manage' : 'Add a friend'}</button>
              : canEditItems ? <button type="button" className="am-secondary" disabled={busy} onClick={() => removeCollaborator(authUser.id)}>Leave</button> : null}
          </div>}
          <div className="am-playlist-section-heading"><span>Products</span><strong>{details.item_count ?? items.length}</strong></div>
          {items.map((item) => { const by = collab.rows.length && item.added_by ? profileById.get(item.added_by) : null; return <div className="am-playlist-item" key={item.product_id}>
            <ProductMention productId={item.product_id} productsById={productsById} quizAnswers={quizAnswers} onOpenProduct={onOpenProduct} />
            {by && <small className="am-item-by">Added by {item.added_by === authUser?.id ? 'you' : by.display_name || `@${by.username}`}</small>}
            {canEditItems && <button type="button" disabled={busy} onClick={() => removePlaylistProduct(item.product_id)}>Remove</button>}
          </div>; })}
          {items.length === 0 && !error && <p className="am-empty">No products added yet.</p>}
          {canEditItems && <div className="am-card am-playlist-add">
            <h3>Add a product</h3><ProductPicker products={products.filter((item) => !items.some((saved) => String(saved.product_id) === String(item.id)))} value={productId} onChange={setProductId} />
            <button type="button" className="am-primary" disabled={busy || !productId} onClick={addPlaylistProduct}>Add to playlist</button>
          </div>}
        </section>}
        {page.type === 'profile' && details && <section className="am-profile-detail"><div className="am-profile-hero"><CommunityAvatar name={details.display_name} path={details.avatar_url} /><div><h2 className="am-detail-title">{details.display_name}</h2><p className="am-detail-copy am-handle-line">@{details.username}<VerifiedBadge title={badgeFor(details.user_id)} /></p></div></div>{details.bio && <p className="am-profile-bio">{details.bio}</p>}{authUser?.id === details.user_id && <div className="am-profile-owner"><button type="button" className="am-secondary" onClick={startProfileEdit}>Edit profile</button><label className="am-avatar-upload"><span>Change photo</span><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadAvatar(file); event.target.value = ''; }} /></label></div>}{authUser && details.user_id !== authUser.id && <div className="am-profile-actions"><button type="button" className="am-primary" onClick={async () => { try { const on = !followingIds.includes(details.user_id); await community.setFollowing(supabase, authUser.id, details.user_id, on); setFollowingIds((ids) => on ? [...ids, details.user_id] : ids.filter((id) => id !== details.user_id)); } catch (e) { notifyError(e); } }}>{followingIds.includes(details.user_id) ? 'Following' : 'Follow'}</button><button type="button" className="am-secondary" onClick={async () => { try { const state = community.friendshipState(friendships, authUser.id, details.user_id); if (state.state === 'none') await community.sendFriendRequest(supabase, authUser.id, details.user_id); else if (state.state === 'incoming') await community.acceptFriendRequest(supabase, state.row.id); else return; setRefresh((v) => v + 1); } catch (e) { notifyError(e); } }}>{({ none: 'Add friend', incoming: 'Accept request', requested: 'Requested', friends: 'Friends' })[community.friendshipState(friendships, authUser.id, details.user_id).state]}</button></div>}<div className="am-profile-content"><div className="am-playlist-section-heading"><span>Playlists</span><strong>{profilePlaylists.length}</strong></div>{profilePlaylists.length ? <div className="am-profile-playlists">{profilePlaylists.map((list) => <button type="button" key={list.id} onClick={() => openPlaylist(list)}><span className="am-profile-playlist-cover">{list.cover_url ? <img src={publicMediaUrl(list.cover_url)} alt="" /> : 'ayna'}</span><span><strong>{list.title}</strong><small>{list.item_count || 0} {(list.item_count || 0) === 1 ? 'product' : 'products'}</small></span><span aria-hidden="true">→</span></button>)}</div> : <p className="am-profile-empty">No playlists shared yet.</p>}<div className="am-playlist-section-heading"><span>Posts</span><strong>{profilePosts.length}</strong></div>{profilePosts.length ? profilePosts.map(renderPost) : <p className="am-profile-empty">No posts shared yet.</p>}</div></section>}
        {page.type === 'friends' && authUser && (() => {
          const others = (rows, status, mine) => rows.filter((r) => r.status === status && (mine === null || (r.requester_id === authUser.id) === mine));
          const incoming = others(friendships, 'pending', false);
          const sent = others(friendships, 'pending', true);
          const friendsRows = others(friendships, 'accepted', null);
          const who = (r) => friendshipProfiles.get(r.requester_id === authUser.id ? r.addressee_id : r.requester_id);
          const row = (r, actions) => { const p = who(r); return <div className="am-friend-row" key={r.id}>
            <button type="button" className="am-friend-open" disabled={!p} onClick={() => p && openProfile(p.username)}><CommunityAvatar name={p?.display_name || 'Member'} path={p?.avatar_url} /><span><strong>{p?.display_name || 'Community member'}</strong>{p?.username && <small>@{p.username}</small>}</span></button>
            {actions}
          </div>; };
          return <section className="am-friends-page">
            <h2 className="am-detail-title">Friends</h2>
            <p className="am-detail-copy">Friends are mutual: you both say yes. Friends can open playlists you share with Friends, and you can add them as collaborators.</p>
            <form className="am-friend-add" onSubmit={(e) => { e.preventDefault(); addFriendByHandle(); }}>
              <label className="am-field-label" htmlFor="am-friend-handle">Add a friend by username</label>
              <div className="am-friend-add-row"><span aria-hidden="true">@</span><input id="am-friend-handle" value={friendHandle.replace(/^@+/, '')} onChange={(e) => setFriendHandle(e.target.value)} placeholder="username" autoCapitalize="none" autoCorrect="off" spellCheck="false" maxLength={25} /><button type="submit" className="am-primary" disabled={busy || friendHandle.trim().replace(/^@+/, '').length < 3}>Send request</button></div>
            </form>
            {incoming.length > 0 && <><h3 className="am-friends-heading">Requests <span>{incoming.length}</span></h3>{incoming.map((r) => row(r, <span className="am-friend-actions"><button type="button" className="am-primary" disabled={busy} onClick={() => answerFriendRequest(r, true)}>Accept</button><button type="button" className="am-secondary" disabled={busy} onClick={() => answerFriendRequest(r, false)}>Decline</button></span>))}</>}
            <h3 className="am-friends-heading">Your friends <span>{friendsRows.length}</span></h3>
            {friendsRows.length ? friendsRows.map((r) => row(r, null)) : <p className="am-collab-empty">No friends yet. Add someone by their @username, or from their profile.</p>}
            {sent.length > 0 && <><h3 className="am-friends-heading">Sent <span>{sent.length}</span></h3>{sent.map((r) => row(r, <button type="button" className="am-secondary" disabled={busy} onClick={() => answerFriendRequest(r, false)}>Cancel</button>))}</>}
          </section>;
        })()}
        {page.type === 'notifications' && (details || []).map((n) => <div className="am-card" key={n.id}><p>{n.message || n.body || n.type?.replace(/_/g, ' ')}</p><small>{timeLabel(n.created_at)}</small></div>)}
        {page.type === 'profile' && details && !authUser && <div className="am-profile-actions"><button type="button" className="am-primary" onClick={() => requireAccount('following people')}>Follow</button><button type="button" className="am-secondary" onClick={() => requireAccount('friends')}>Add friend</button></div>}
      </div> : <>
        {authUser && !profile && <div className="am-card am-profile-setup"><strong>Join Community</strong><p>Health answers stay private.</p><div className="am-profile-setup-fields"><RuleField as="input" aria-label="Display name" value={profileName} maxLength={50} onChange={(e) => setProfileName(e.target.value)} placeholder="Display name" onShowRules={openRules} /><RuleField as="input" aria-label="Username" value={profileHandle} maxLength={30} onChange={(e) => setProfileHandle(e.target.value)} placeholder="Username" onShowRules={openRules} /></div><button type="button" disabled={busy || !profileName.trim() || !profileHandle.trim() || breaksCommunityRules(profileName, profileHandle)} onClick={saveProfile}>Create profile</button></div>}
        <div className="am-search"><CommunityIcon name="search" size={19} /><input value={search} onChange={(e) => { setSearch(e.target.value); setSearchResults(null); }} placeholder="Search people, posts, playlists" aria-label="Search community" />{search && <button type="button" aria-label="Clear search" onClick={() => { setSearch(''); setSearchResults(null); }}>×</button>}</div>
        {search ? <div className="am-search-results">{search.trim().length < 2 ? <p className="am-search-message">Type at least two letters to search Community.</p> : !searchResults ? <p className="am-search-message">Searching Community…</p> : <>
          {searchResults.people.length > 0 && <section><h2>People</h2>{searchResults.people.map((p) => <button type="button" className="am-list-row" key={p.user_id} onClick={() => openProfile(p.username)}><CommunityAvatar name={p.display_name} path={p.avatar_url} /><span>{p.display_name}<small>@{p.username}</small></span></button>)}</section>}
          {searchResults.posts.length > 0 && <section><h2>Posts</h2>{searchResults.posts.map(renderPost)}</section>}
          {searchResults.playlists.length > 0 && <section><h2>Playlists</h2>{searchResults.playlists.map((p) => <button type="button" className="am-list-row" key={p.id} onClick={() => openPlaylist(p)}><span className="am-cover">{p.cover_url ? <img src={publicMediaUrl(p.cover_url)} alt="" /> : 'ayna'}</span><span>{p.title}<small>{p.item_count || 0} {(p.item_count || 0) === 1 ? 'product' : 'products'}</small></span></button>)}</section>}
          {!searchResults.people.length && !searchResults.posts.length && !searchResults.playlists.length && <EmptyState compact art="search" tone="mint" title="No results" body="Try a name, topic, or playlist." />}
        </>}</div> : <>
          <div className="am-tabs" role="tablist" aria-label="Community sections">{TABS.map(([key, label]) => <button type="button" role="tab" aria-selected={tab === key} key={key} className={tab === key ? 'is-active' : ''} onClick={() => key === 'following' && !authUser ? requireAccount('your following feed') : setTab(key)}>{label}</button>)}</div>
          {topicsTab && <div className="am-pods" role="group" aria-label="Filter posts by topic">
            {followedTopics.length > 0 && <button type="button" className="am-pod" aria-pressed={topicScope === 'mine'} onClick={() => setTopicScope('mine')}>My topics</button>}
            <button type="button" className="am-pod" aria-pressed={topicScope === 'all'} onClick={() => setTopicScope('all')}>All</button>
            {followedTopics.map((key) => <button type="button" key={key} className="am-pod" aria-pressed={topicScope === key} onClick={() => setTopicScope(topicScope === key ? 'mine' : key)}>{topicLabel(key)}</button>)}
            <button type="button" className="am-pod is-edit" onClick={() => setTopicSheetOpen(true)}>{followedTopics.length ? 'Edit topics' : '+ Follow topics'}</button>
            <button type="button" className="am-pod is-suggest" onClick={openSuggestTopic}>Suggest a topic</button>
          </div>}
          {topicsTab && scopedTopics && posts.length === 0 && !loading && <div className="am-community-empty-slot"><EmptyState art="chat" tone="pink" title={topicScope === 'mine' ? 'Nothing in your topics yet' : `No ${topicLabel(topicScope)} posts yet`} body="New posts tagged with these topics show up here." actionLabel="See all posts" onAction={() => setTopicScope('all')} /></div>}
          {tab === 'announcements' && <Announcements supabase={supabase} user={authUser} products={products} productsById={productsById} articles={articles} teamBadges={teamBadges} variant="app" onOpenProduct={onOpenProduct} onOpenPlaylist={openPlaylistById} onOpenArticle={onOpenArticle} onOpenProfile={openProfile} onRequireAuth={requireAccount} onShowRules={openRules} />}
          {tab === 'for-you' && !scopedTopics && posts.length === 0 && !loading && <div className="am-community-empty-slot"><EmptyState art="chat" tone="pink" title="No posts yet" body="Be the first to post." actionLabel={authUser ? 'Post' : 'See questions'} onAction={() => authUser ? openCompose('post') : setTab('question')} /></div>}
          {tab === 'for-you' && posts.length > 0 && <button type="button" className="am-share-prompt" onClick={() => openCompose('post')}><CommunityAvatar name={profile?.display_name || 'You'} path={profile?.avatar_url} /><span>Share with the community</span><span className="am-share-plus"><CommunityIcon name="plus" size={18} /></span></button>}
          {tab === 'playlists' ? <><div className="am-list-heading"><h2>{playlistSection === 'mine' ? 'My playlists' : playlistSection === 'friends' ? 'Shared by friends' : 'Made by the community'}</h2><button type="button" onClick={() => openCompose('playlist')}>Create playlist</button></div><div className="am-playlist-switch"><button type="button" aria-pressed={playlistSection === 'recent'} onClick={() => setPlaylistSection('recent')}>Community</button><button type="button" aria-pressed={playlistSection === 'friends'} onClick={() => authUser ? setPlaylistSection('friends') : requireAccount('friends-only playlists')}>Friends</button><button type="button" aria-pressed={playlistSection === 'mine'} onClick={() => authUser ? setPlaylistSection('mine') : requireAccount('your playlists')}>My playlists</button></div><ul className="am-playlist-rows">{playlists.map((p) => <li key={p.id}><button type="button" className="am-playlist-row" onClick={() => openPlaylist(p)}><PlaylistThumb playlist={p} productsById={productsById} /><span className="am-playlist-row-copy"><strong>{p.title}</strong><small>{p.item_count || 0} {(p.item_count || 0) === 1 ? 'product' : 'products'} · by {p.owner_display_name || 'ayna community'}{p.collaborator_count > 0 || p.is_collaborator ? ' · Collaborative' : ''}</small></span><span className="am-playlist-row-go" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg></span></button></li>)}</ul>{!loading && playlists.length === 0 && renderEmpty()}</> : <>{posts.map(renderPost)}{!loading && posts.length === 0 && tab !== 'for-you' && tab !== 'announcements' && !(topicsTab && scopedTopics) && renderEmpty()}{cursor && <button type="button" className="am-more" disabled={loading} onClick={loadMore}>Show more posts</button>}</>}
          {loading && <p className="am-empty">Loading…</p>}
          <button type="button" className="am-rules-foot" onClick={openRules}>Community rules</button>
        </>}
      </>}
    </div>
    {editingPlaylist && <div className="am-sheet-backdrop" onClick={() => setEditingPlaylist(false)}><div className="am-sheet am-compose-sheet" role="dialog" aria-modal="true" aria-label="Edit playlist" onClick={(e) => e.stopPropagation()}>
      <div className="am-sheet-head"><h2>Edit playlist</h2><button type="button" aria-label="Close" onClick={() => setEditingPlaylist(false)}>×</button></div>
      <label className="am-field-label" htmlFor="am-edit-playlist-title">Playlist name</label><RuleField as="input" id="am-edit-playlist-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onShowRules={openRules} />
      <label className="am-field-label" htmlFor="am-edit-playlist-description">Description</label><RuleField id="am-edit-playlist-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="What is this collection for?" onShowRules={openRules} />
      <PlaylistAudiencePicker id="am-edit-playlist-visibility" value={editVisibility} onChange={setEditVisibility} />
      <PlaylistCoverPicker title={editTitle} mode={editCoverMode} onMode={setEditCoverMode} color={editCoverColor} onColor={setEditCoverColor} text={editCoverText} onText={setEditCoverText} photo={editCoverPhoto} onPhoto={setEditCoverPhoto} existingCoverUrl={publicMediaUrl(details?.cover_url)} />
      <button type="button" className="am-primary" disabled={busy || !editTitle.trim() || breaksCommunityRules(editTitle, editDescription)} onClick={savePlaylist}>{busy ? 'Saving…' : 'Save changes'}</button>
    </div></div>}
    {editingProfile && <div className="am-sheet-backdrop" onClick={() => setEditingProfile(false)}><div className="am-sheet am-compose-sheet" role="dialog" aria-modal="true" aria-label="Edit community profile" onClick={(e) => e.stopPropagation()}>
      <div className="am-sheet-head"><h2>Edit profile</h2><button type="button" aria-label="Close" onClick={() => setEditingProfile(false)}>×</button></div>
      <p className="am-detail-copy">This is your public Community profile. Your health answers stay private.</p>
      <label className="am-field-label" htmlFor="am-profile-display-name">Display name</label>
      <RuleField as="input" id="am-profile-display-name" value={editProfileName} maxLength={50} onChange={(event) => setEditProfileName(event.target.value)} onShowRules={openRules} />
      <label className="am-field-label" htmlFor="am-profile-username">Username</label>
      <input id="am-profile-username" value={editProfileHandle} maxLength={24} autoCapitalize="none" onChange={(event) => setEditProfileHandle(event.target.value.toLowerCase())} />
      <small className="am-profile-help">You can change your username once every 30 days.</small>
      <label className="am-field-label" htmlFor="am-profile-bio">Bio</label>
      <RuleField id="am-profile-bio" value={editProfileBio} maxLength={160} onChange={(event) => setEditProfileBio(event.target.value)} placeholder="A little about you" onShowRules={openRules} />
      <small className="am-profile-help">{editProfileBio.length}/160</small>
      {error && <p className="am-error" role="alert">{error}</p>}
      <button type="button" className="am-primary" disabled={busy || !editProfileName.trim() || !editProfileHandle.trim() || breaksCommunityRules(editProfileName, editProfileBio)} onClick={saveProfileEdit}>{busy ? 'Saving…' : 'Save profile'}</button>
    </div></div>}
    {deletePlaylistTarget && <div className="am-sheet-backdrop" onClick={() => setDeletePlaylistTarget(null)}><div className="am-sheet" role="dialog" aria-modal="true" aria-label="Delete playlist" onClick={(e) => e.stopPropagation()}><div className="am-sheet-head"><h2>Delete playlist?</h2><button type="button" aria-label="Close" onClick={() => setDeletePlaylistTarget(null)}>×</button></div><p className="am-detail-copy">This removes the playlist and its product list. This cannot be undone.</p><button type="button" className="am-primary" disabled={busy} onClick={confirmDeletePlaylist}>{busy ? 'Deleting…' : 'Delete playlist'}</button><button type="button" className="am-secondary" onClick={() => setDeletePlaylistTarget(null)}>Cancel</button></div></div>}
    {topicSheetOpen && <TopicSheet followed={followedTopics} onToggle={toggleTopic} onClose={closeTopicSheet} onSuggest={openSuggestTopic} />}
    {suggestOpen && <SuggestTopicSheet onClose={() => setSuggestOpen(false)} onShowRules={openRules} onSent={() => { setSuggestOpen(false); setNotice('Thanks. The team reads every suggestion.'); }} />}
    {collabSheetOpen && details && page?.type === 'playlist' && <div className="am-sheet-backdrop" onClick={() => setCollabSheetOpen(false)}><div className="am-sheet am-compose-sheet am-collab-sheet" role="dialog" aria-modal="true" aria-labelledby="am-collab-title" onClick={(e) => e.stopPropagation()}>
      <div className="am-sheet-head"><h2 id="am-collab-title">Collaborators</h2><button type="button" aria-label="Close" onClick={() => setCollabSheetOpen(false)}>×</button></div>
      <p className="am-detail-copy">Collaborators can add and remove products. Only you can change the name, cover and who can see it.</p>
      {collab.rows.length > 0 && <div className="am-collab-list">{collab.rows.map((r) => { const p = profileById.get(r.user_id); return <div className="am-friend-row" key={r.user_id}><span className="am-friend-open"><CommunityAvatar name={p?.display_name || 'Member'} path={p?.avatar_url} /><span><strong>{p?.display_name || 'Community member'}</strong>{p?.username && <small>@{p.username}</small>}</span></span><button type="button" className="am-secondary" disabled={busy} onClick={() => removeCollaborator(r.user_id)}>Remove</button></div>; })}</div>}
      <h3 className="am-friends-heading">Add a friend</h3>
      {(() => { const open = friendProfiles.filter((f) => !collab.rows.some((r) => r.user_id === f.user_id)); return open.length ? <div className="am-collab-list">{open.map((f) => <div className="am-friend-row" key={f.user_id}><span className="am-friend-open"><CommunityAvatar name={f.display_name || f.username} path={f.avatar_url} /><span><strong>{f.display_name || f.username}</strong><small>@{f.username}</small></span></span><button type="button" className="am-primary" disabled={busy} onClick={() => addCollaborator(f)}>Add</button></div>)}</div> : <p className="am-collab-empty">{friendProfiles.length ? 'All your friends are already on this playlist.' : 'No friends yet. Share the invite link instead, or add friends from Friends.'}</p>; })()}
      <h3 className="am-friends-heading">Invite link</h3>
      <p className="am-detail-copy">Anyone with the link can join as a collaborator after signing in.</p>
      {inviteLink && <input className="am-invite-link" readOnly value={inviteLink} aria-label="Invite link" onFocus={(e) => e.target.select()} />}
      <button type="button" className="am-primary" disabled={busy} onClick={shareInviteLink}>{inviteLink ? 'Share the link again' : 'Share invite link'}</button>
      {error && <p className="am-error" role="alert">{error}</p>}
    </div></div>}
    {deleteTarget && <div className="am-sheet-backdrop" onClick={() => setDeleteTarget(null)}><div className="am-sheet" role="dialog" aria-modal="true" aria-label="Delete post" onClick={(e) => e.stopPropagation()}><div className="am-sheet-head"><h2>Delete post?</h2><button type="button" onClick={() => setDeleteTarget(null)}>×</button></div><p className="am-detail-copy">This will remove your post and its replies from Community.</p><button type="button" className="am-primary" disabled={busy} onClick={confirmDelete}>{busy ? 'Deleting…' : 'Delete post'}</button><button type="button" className="am-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button></div></div>}
    {editPost && <div className="am-sheet-backdrop" onClick={() => setEditPost(null)}><div className="am-sheet am-compose-sheet" role="dialog" aria-modal="true" aria-label={editPost.kind === 'review' ? 'Edit review' : 'Edit post'} onClick={(e) => e.stopPropagation()}>
      <div className="am-sheet-head"><h2>{editPost.kind === 'review' ? 'Edit review' : 'Edit post'}</h2><button type="button" aria-label="Close" onClick={() => setEditPost(null)}>×</button></div>
      {editPost.kind === 'review' && <div className="am-rating"><span id="am-edit-rating-label">Your rating</span><RatingPicker value={editRating} onChange={setEditRating} label="Your rating" /></div>}
      <label className="am-field-label" htmlFor="am-edit-text">{editPost.kind === 'review' ? 'Your experience' : 'Your post'}</label>
      <RuleField id="am-edit-text" value={editBody} onChange={(e) => setEditBody(e.target.value)} onShowRules={openRules} />
      {error && <p className="am-error" role="alert">{error}</p>}
      <button type="button" className="am-primary am-submit" disabled={busy || !editBody.trim() || breaksCommunityRules(editBody) || (editPost.kind === 'review' && !normalizeRating(editRating))} onClick={saveEdit}>{busy ? 'Saving…' : 'Save changes'}</button>
    </div></div>}
    {reportPost && <div className="am-sheet-backdrop" onClick={() => setReportPost(null)}><div className="am-sheet" role="dialog" aria-modal="true" aria-label="Report post" onClick={(e) => e.stopPropagation()}><div className="am-sheet-head"><h2>Report post</h2><button type="button" onClick={() => setReportPost(null)}>×</button></div><p className="am-detail-copy">Tell us what needs review.</p><select value={reportReason} onChange={(e) => setReportReason(e.target.value)}><option value="misinformation">Health misinformation</option><option value="harassment">Harassment</option><option value="spam">Spam</option><option value="other">Something else</option></select><button type="button" className="am-primary" disabled={busy} onClick={submitReport}>Send report</button></div></div>}
    {compose && <div className="am-sheet-backdrop" onClick={() => setCompose(null)}><div className="am-sheet am-compose-sheet" role="dialog" aria-modal="true" aria-label="Create in Community" onClick={(e) => e.stopPropagation()}>
      <div className="am-sheet-head"><div><h2>{({ post: 'New post', question: 'Ask a question', review: 'Write a review', playlist: 'Create a playlist', recommend: 'Recommend a product' })[compose]}</h2></div><button type="button" aria-label="Close" onClick={() => setCompose(null)}>×</button></div>
      <div className="am-type-row" aria-label="What would you like to share?">{[['post','Post'],['question','Question'],['review','Review'],['playlist','Playlist'],['recommend','Recommend']].map(([kind,label]) => <button type="button" key={kind} className={compose === kind ? 'is-active' : ''} aria-pressed={compose === kind} onClick={() => { if (!authUser && ['review','playlist','recommend'].includes(kind)) { requireAccount(kind === 'review' ? 'reviews' : kind === 'playlist' ? 'playlists' : 'friend recommendations'); return; } setCompose(kind); setError(''); }}>{label}</button>)}</div>
      {compose === 'playlist' ? <><label className="am-field-label" htmlFor="am-playlist-name">Playlist name</label><RuleField as="input" id="am-playlist-name" value={playlistTitle} onChange={(e) => setPlaylistTitle(e.target.value)} placeholder="e.g. My everyday essentials" onShowRules={openRules} /><PlaylistAudiencePicker id="am-new-playlist-visibility" value={playlistVisibility} onChange={setPlaylistVisibility} /><PlaylistCoverPicker title={playlistTitle} mode={coverMode} onMode={setCoverMode} color={coverColor} onColor={setCoverColor} text={coverText} onText={setCoverText} photo={coverPhoto} onPhoto={setCoverPhoto} /></> : <><label className="am-field-label" htmlFor="am-post-text">{compose === 'question' ? 'Your question' : compose === 'review' ? 'Your experience' : compose === 'recommend' ? 'A note to your friends' : 'Your post'}</label><RuleField id="am-post-text" value={body} onChange={(e) => setBody(e.target.value)} onShowRules={openRules} placeholder={compose === 'question' ? 'What would you like to ask? Add #topics if helpful.' : compose === 'review' ? 'How was it for you?' : compose === 'recommend' ? 'Add a note (optional)' : 'What’s on your mind? Add #topics if helpful.'} />{hashtagSuggestions.length > 0 && <div className="am-hashtags" aria-label="Suggested hashtags">{hashtagSuggestions.map((tag) => <button type="button" key={tag.key} onClick={() => setBody((text) => text.replace(/#(?:[A-Za-z][\w-]*)?$/, `${tag.tag} `))}>{tag.tag}</button>)}</div>}</>}
      {compose === 'review' && <div className="am-rating" role="radiogroup" aria-label="Your rating"><span>Your rating</span><div className="am-stars">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} out of 5`} className={n <= rating ? 'is-on' : ''} onClick={() => setRating(n)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" /></svg></button>)}</div></div>}
      <ProductPicker products={products} value={productId} onChange={setProductId} />
      {compose !== 'playlist' && compose !== 'recommend' && <label className="am-photo-input"><strong>Add photos</strong><span>Up to 4 images</span><span className="am-photo-cta">Choose photos</span><input type="file" accept="image/*" multiple onChange={(e) => { try { const files = Array.from(e.target.files || []).slice(0, MAX_POST_PHOTOS); files.forEach(checkImageFile); setPhotos(files); setError(''); } catch (error) { setError(error.message); } }} />{photos.length > 0 && <small>{photos.map((file) => file.name).join(', ')}</small>}</label>}
      {compose === 'recommend' && <div className="am-friends"><strong>Send to friends</strong>{friendProfiles.length ? friendProfiles.map((friend) => <label key={friend.user_id}><input type="checkbox" checked={selectedFriendIds.includes(friend.user_id)} onChange={(e) => setSelectedFriendIds((ids) => e.target.checked ? [...ids, friend.user_id] : ids.filter((id) => id !== friend.user_id))} /> {friend.display_name || friend.username}</label>) : <p>Add friends in Community profiles first.</p>}</div>}
      {authUser && compose !== 'playlist' && compose !== 'recommend' && <label className="am-anon"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Post anonymously</label>}
      {error && <p className="am-error" role="alert">{error}</p>}
      <button type="button" className="am-rules-link" onClick={openRules}>Community rules</button>
      <button type="button" className={`am-primary am-submit${compose === 'playlist' ? ' am-submit-static' : ''}`} disabled={busy || (compose === 'playlist' ? breaksCommunityRules(playlistTitle) : breaksCommunityRules(body))} onClick={submit}>{busy ? 'Sharing…' : compose === 'playlist' ? 'Create playlist' : compose === 'recommend' ? 'Send recommendation' : compose === 'question' ? 'Ask question' : compose === 'review' ? 'Post review' : 'Share post'}</button>
    </div></div>}
    {showRules && <div className="am-sheet-backdrop am-rules-backdrop" onClick={() => setShowRules(false)}><div className="am-sheet am-rules-sheet" role="dialog" aria-modal="true" aria-label="Community rules" onClick={(e) => e.stopPropagation()}>
      <div className="am-sheet-head"><h2>Community rules</h2><button type="button" aria-label="Close" onClick={() => setShowRules(false)}>×</button></div>
      <CommunityRulesList />
      <button type="button" className="am-primary" onClick={() => setShowRules(false)}>Got it</button>
    </div></div>}
  </div>;
}
