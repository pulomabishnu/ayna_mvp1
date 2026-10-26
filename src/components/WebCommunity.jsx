import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import { hasWhy, whyLead } from '../utils/whyLine';
import { isSafetyHold } from '../utils/matchDisplay';
import BackLink from './nav/BackLink.jsx';
import { createPortal } from 'react-dom';
import { getSupabaseClient } from '../utils/supabaseClient';
import { getGuestClient, getGuestId, ensureGuestSession } from '../utils/community/guestClient.js';
import * as community from '../utils/community/communityStore.js';
import { rankForYou, postProductIds } from '../utils/community/ranking.js';
import { getRecentActivity } from '../utils/recentActivity.js';
import { extractHashtagTopics, suggestHashtags, suggestTopicsForProducts, COMMUNITY_TOPICS, topicLabel } from '../utils/community/topics.js';
import { useFollowedTopics } from '../mobile/utils/communityTopicFollows.js';
import { uploadCommunityImage, deleteCommunityImage, checkImageFile, MAX_POST_PHOTOS, publicMediaUrl } from '../utils/community/imageUpload.js';
import { makePlaylistCoverFile } from '../mobile/components/playlistCoverImage.js';
import { CATEGORY_LABELS, getProfileMatchPercentForProduct, getProductMatchDetailsForProduct } from '../data/products.js';
import { scoreSearchMatch } from '../utils/search/index.js';
import { searchCommunityTolerant } from '../utils/search/communitySearch.js';
import SmartSearchInput from './search/SmartSearchInput.jsx';
import ProductTileImage, { ProductImageFallback } from './ProductTileImage';
import ProductCard from './ProductCard.jsx';
import { customProductId, customProductName } from '../utils/customProductTag.js';
import { RuleField, CommunityRulesList } from './community/RuleField.jsx';
import { useSheetViewport, backdropTap } from './community/useSheetViewport.js';
import { useComposerDraft } from './community/useComposerDraft.js';
import { draftKey, photosFromDraft, submitDraft } from '../utils/community/composerDraft.js';
// One label for staff everywhere (posts, replies, profiles, people lists): "ayna team · CMO".
function TeamTag({ title }) {
  if (!title) return null;
  return <span className="cm-team-tag">ayna team · {String(title).replace(/,\s*ayna\s*$/i, '')}</span>;
}
import { toast } from '../utils/toast';
import { useTeamBadges } from './community/useTeamBadges.js';
import Announcements from './community/Announcements.jsx';
import { PostStats, LikersList } from './community/PostEngagement.jsx';
import { usePostEngagement } from './community/usePostEngagement.js';
import { listAnnouncements } from '../utils/community/announcementsStore.js';
import { breaksCommunityRules } from '../utils/communityRules.js';
import { markPerf } from '../utils/perfTimings';
import { normalizeRating, ratingLabel } from '../utils/community/reviewRatings.js';
import '../styles/verify-content.css';
import { apiUrl } from '../utils/apiUrl';
import { fetchWithTimeout } from '../utils/network.js';
import { relTime, fullTime, pickTeamQuote, PROMPTS, isOnlyStarter, sharePost, applyToggle, faceTone } from '../utils/community/notes.js';
import { CharRing, DefaultFace } from './community/notesKit.jsx';
import { useMinuteNow as useNow } from '../utils/relativeTime.js';
import { growTransition } from '../utils/viewTransition.js';
import { autofocusTarget } from '../utils/delightRuntime.js';
import './community/community-web.css';
// Topics started by members (docs/community-user-topics.md). Hidden until the migration runs.
import TopicPage from './community/topics/TopicPage.jsx';
import TopicDirectory from './community/topics/TopicDirectory.jsx';
import TopicEditor from './community/topics/TopicEditor.jsx';
import { MyTopicRows, PostInPicker } from './community/topics/TopicBits.jsx';
import { useUserTopics } from './community/topics/useUserTopics.js';
import { joinTopicByCode, parseTopicInviteCode } from '../utils/community/userTopics.js';
import './community/topics/user-topics.css';

// The app's Community, built for the website. Same data and rules (shared
// community store, ranking, topics, guest posting). Three columns on wide
// screens: feeds + you on the left, the feed in the middle, and side modules
// built only from loaded data on the right (each hides when it has nothing).

// New ayna announcements show in Updates (and on the bell) until she opens Updates.
const ANN_SEEN = (userId) => `ayna_ann_seen_v1:${userId}`;
const readAnnSeen = (userId) => { try { return Number(localStorage.getItem(ANN_SEEN(userId))) || 0; } catch { return 0; } };
const writeAnnSeen = (userId) => { try { localStorage.setItem(ANN_SEEN(userId), String(Date.now())); } catch { /* private mode */ } };
async function newAnnouncementsFor(supabase, userId) {
  const { rows } = await listAnnouncements(supabase, { limit: 10 });
  const seen = readAnnSeen(userId) || Date.now() - 7 * 86400000;
  return (rows || []).filter((a) => a.author_id !== userId && new Date(a.created_at).getTime() > seen);
}

const TABS = [['for-you', 'For you'], ['following', 'Following'], ['question', 'Questions'], ['review', 'Reviews'], ['playlists', 'Playlists'], ['announcements', 'Announcements']];
// One line icon per feed, drawn on the folder tabs.
const TAB_ICONS = {
  'for-you': <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />,
  following: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6M18 14.5c1.9.7 3 2.5 3 5" /></>,
  question: <><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.6a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8v.4" /><path d="M12 16.8v.1" /></>,
  review: <path d="M12 4.2l2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1-3.8-3.6 5.2-.8z" />,
  playlists: <><path d="M4 6.5h11M4 11.5h11M4 16.5h7" /><circle cx="17.5" cy="16.5" r="2.5" /><path d="M20 16.5V7l-2.5 1" /></>,
  announcements: <><path d="M4 10v4h3l6 4V6L7 10H4Z" /><path d="M16.5 9a4 4 0 0 1 0 6" /></>,
};
// The one "Post" button opens this sheet (Community audit, issue 2): what she wants to share.
const POST_TYPES = [
  ['post', 'Post', 'A tip, a win or a photo'],
  ['question', 'Question', 'Answers from women who tried it'],
  ['review', 'Review', 'Stars, and how it really went'],
  ['playlist', 'Playlist', 'Collect your favorites in one place'],
];
const TYPE_ICONS = { ...TAB_ICONS, post: <path d="M20 11.5a8 8 0 0 1-8 8 8.4 8.4 0 0 1-3.3-.7L4 20l1.2-4.7A8 8 0 1 1 20 11.5Z" />, playlist: TAB_ICONS.playlists };
function TypeIcon({ kind, size = 16 }) {
  return <svg className="cm-type-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{TYPE_ICONS[kind]}</svg>;
}
// Outlined label with an icon: what kind of post this is (same colour for every kind).
function KindLabel({ kind, children }) {
  return <span className={`cm-kind is-${kind}`}><TypeIcon kind={kind} size={14} />{children}</span>;
}
const VERB = { post: 'Post', question: 'Ask', review: 'Review', playlist: 'Playlist', recommend: 'Recommend' };
const KIND_TITLES = { post: 'New post', question: 'Ask a question', review: 'Write a review', playlist: 'Create a playlist', recommend: 'Recommend a product' };
const COVER_COLORS = ['#3e2723', '#f7badd', '#F7BADD', '#f6e3a1', '#ffedac'];
const AUDIENCE = [['private', 'Only me'], ['friends', 'Friends'], ['public', 'Public']];
const POST_MAX = 2000;
const COMMENT_MAX = 1000;
const BIO_MAX = 160;
const SUGGESTED_MAX = 5;
const PROFILE_LIST_MAX = 30;
const SIDE_MAX = 3;
const TOPICS_MAX = 8;
const loadArticles = () => import('./Articles.jsx').then((m) => m.ARTICLES || []);

function Avatar({ name, path, anonymous = false, size = 40 }) {
  const [failed, setFailed] = useState(false);
  const photo = path && !failed && !anonymous;
  return <span className={`cm-avatar is-${photo ? 'photo' : faceTone(name, anonymous)}`} style={{ width: size, height: size, fontSize: Math.max(13, Math.round(size * 0.34)) }} aria-hidden="true">{photo ? <img src={publicMediaUrl(path)} alt="" onError={() => setFailed(true)} /> : <DefaultFace name={name} anonymous={anonymous} />}</span>;
}

const ICONS = {
  heart: <path d="M20.5 8.5c0 4.2-8.5 10-8.5 10s-8.5-5.8-8.5-10a4.5 4.5 0 0 1 8.5-2 4.5 4.5 0 0 1 8.5 2Z" />,
  comment: <path d="M20 11.5a8 8 0 0 1-8 8 8.4 8.4 0 0 1-3.3-.7L4 20l1.2-4.7A8 8 0 1 1 20 11.5Z" />,
  bookmark: <path d="M6 4.5h12v15l-6-4-6 4v-15Z" />,
  thumb: <path d="M7 10.5v9H4.5v-9H7Zm0 0 4-6.5c1.4 0 2.3 1.1 2 2.4L12.4 10H18a2 2 0 0 1 2 2.3l-1.1 5.6a2 2 0 0 1-2 1.6H7" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9Z" /><path d="M10 21h4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  more: <><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>,
  share: <><path d="M12 15V3.5" /><path d="m7.5 8 4.5-4.5L16.5 8" /><path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 4.5 4.5" /></>,
};
function Icon({ name, size = 18 }) {
  return <svg className="cm-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name]}</svg>;
}
const STAR_PATH = 'M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z';
function Star({ on, size = 18 }) {
  return <svg className={`cm-star${on ? ' is-on' : ''}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d={STAR_PATH} fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}
function Stars({ value = 0, size = 18 }) {
  const n = normalizeRating(value);
  return <span className="cm-stars" role="img" aria-label={ratingLabel(n)} data-rating={n}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} on={i <= n} size={size} />)}</span>;
}
function Check({ checked, onChange, children }) {
  return <label className="cm-check">
    <input type="checkbox" className="cm-check-input" checked={checked} onChange={onChange} />
    <span className="cm-check-box" aria-hidden="true"><Icon name="check" size={14} /></span>
    <span className="cm-check-text">{children}</span>
  </label>;
}
function SkeletonPost({ i = 0 }) {
  return <div className="cm-skel-post" style={{ '--i': i }} aria-hidden="true"><div className="cm-skel-row"><span className="cm-skel-dot" /><span className="cm-skel-line is-short" /></div><span className="cm-skel-line" /><span className="cm-skel-line is-mid" /><span className="cm-skel-line is-tiny" /></div>;
}
function SkeletonPlaylists() {
  return <div className="cm-pl-grid" aria-hidden="true">{[0, 1, 2, 3].map((i) => <div key={i} className="cm-skel-pl"><span className="cm-skel-cover" /><span className="cm-skel-line is-mid" /><span className="cm-skel-line is-short" /></div>)}</div>;
}

function Mention({ productId, productsById, quizResults, healthProfile = null, matchOpts = undefined, onOpenProduct, onSeeMatch = null }) {
  const product = productsById.get(String(productId));
  if (!product) {
    const customName = customProductName(String(productId || ''));
    if (!customName) return null;
    return <span className="cm-mention is-custom">
      <span className="cm-mention-photo" aria-hidden="true">{customName.slice(0, 1).toUpperCase()}</span>
      <span><strong>{customName}</strong><small>Not in the ayna catalog yet</small></span>
    </span>;
  }
  // Same engine inputs as her cards, so the card shows the card's percent.
  const match = quizResults ? getProductMatchDetailsForProduct(product, quizResults, healthProfile, matchOpts) : null;
  const show = match?.matchStatus === 'scored' && Number.isFinite(match.percent);
  // The % explained in plain words ("For your period cramps").
  const why = show && hasWhy(match) ? whyLead(match) : '';
  // The founder's product card (the one in Explore), as a row.
  const card = <ProductCard product={product} className="is-row cm-mention-card" matchPercent={show ? match.percent : null} matchHold={!show && isSafetyHold(match)} why={why} onOpen={onOpenProduct} partnerMark={false} />;
  // No answers yet (signed out, or no quiz): the match is one step away, never a made-up number.
  if (quizResults || !onSeeMatch) return card;
  return <div className="cm-mention-wrap">{card}<button type="button" className="cm-seematch" onClick={onSeeMatch} aria-label={`See your match for ${product.name}`}>See your match</button></div>;
}


// Playlist cover: the uploaded cover, or up to four product photos on white tiles.
function PlaylistCover({ playlist, productsById, big = false }) {
  if (playlist.cover_url) return <span className={`cm-cover${big ? ' is-big' : ''}`}><img src={publicMediaUrl(playlist.cover_url)} alt="" loading="lazy" /></span>;
  const picks = (playlist.preview_product_ids || []).map((id) => productsById.get(String(id))).filter(Boolean).slice(0, 4);
  if (!picks.length) return <span className={`cm-cover${big ? ' is-big' : ''}`}>ayna</span>;
  return <span className={`cm-cover is-mosaic${big ? ' is-big' : ''}`}>{picks.map((p) => <span key={p.id} className="cm-cover-tile"><ProductTileImage product={p} imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} letterNode={<ProductImageFallback style={{ position: 'absolute', inset: 0 }} />} /></span>)}</span>;
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
  if (selectedName) return <div className="cm-picked"><span>{selectedName}</span><button type="button" onClick={() => { onChange(null); setQ(''); }}>Remove</button></div>;
  return <div className="cm-picker">
    <SmartSearchInput value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.length >= 2) { e.preventDefault(); if (matches.length && exact) { onChange(matches[0].id); setQ(''); } else addCustom(); } }} placeholder={placeholder} aria-label="Find a product" />
    {draft.length >= 2 && <div className="cm-results">
      {!exact && <button type="button" className="is-add" onClick={addCustom}>+ Add “{draft}”<small>{matches.length ? 'Not listed? Tag it anyway' : 'Not in the ayna catalog yet'}</small></button>}
      {matches.map((p) => <button type="button" key={p.id} onClick={() => { onChange(p.id); setQ(''); }}>{p.name}<small>{[p.brand, p.category?.replace(/-/g, ' ')].filter(Boolean).join(' · ')}</small></button>)}
    </div>}
  </div>;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Modal dialog: labelled by its title, focus moves in on open (to [data-autofocus]
// when present), Tab stays inside, Escape closes, focus returns on close.
// Rendered inside .app-container so it picks up the site tokens and dark mode.
// Only the topmost sheet answers keys, so Escape in the rules sheet never
// closes the composer under it. `onClose` is a request: the composer uses it
// to ask before throwing a draft away. `overlay` renders above the sheet
// (the "Discard this post?" card) and shares its focus trap.
function Sheet({ title, onClose, children, className = '', overlay = null }) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const opener = document.activeElement;
    const node = ref.current;
    const wrap = wrapRef.current;
    // The main field only after a person opened the sheet (on phones, a tap on
    // a text action): utils/delightRuntime.js, autofocus rules.
    const first = autofocusTarget(node, FOCUSABLE);
    (first || node)?.focus({ preventScroll: true });
    const onKey = (e) => {
      const all = document.querySelectorAll('.cm-sheet-backdrop');
      if (all[all.length - 1] !== wrap) return;
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== 'Tab' || !wrap) return;
      const items = [...wrap.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) { e.preventDefault(); return; }
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === a || !wrap.contains(document.activeElement))) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && (document.activeElement === z || !wrap.contains(document.activeElement))) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, []);
  useSheetViewport(true);
  const host = document.querySelector('.app-container') || document.body;
  return createPortal(<div ref={wrapRef} className="cm-sheet-backdrop" {...backdropTap(onClose)}><div ref={ref} tabIndex={-1} className={`cm-sheet${className ? ` ${className}` : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
    <header><h2 id={titleId}>{title}</h2><button type="button" className="cm-sheet-close" aria-label="Close" onClick={onClose}><Icon name="close" size={18} /></button></header>{children}
  </div>{overlay}</div>, host);
}

export default function WebCommunity({ user, products = [], quizResults = null, healthProfile = null, matchOpts = undefined, myProducts = null, onOpenProduct, onOpenArticle, onRequireAuth, onStartQuiz = null, seedKind = null, seedProductId = null, seedRating = null, initialProfileHandle = null, onProfileChange, initialPostId = null, onPostChange, composeOnly = false, onDone }) {
  const supabase = user ? getSupabaseClient() : (getGuestClient() || getSupabaseClient());
  // Phones: the search box shares its row with Post, so the long placeholder was cut off mid-word.
  const [narrowSearch, setNarrowSearch] = useState(false);
  useEffect(() => {
    const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 600px)') : null;
    if (!mq) return undefined;
    const on = () => setNarrowSearch(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  const productsById = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);
  // Relative times ("5m", "Yesterday") refresh every minute.
  const now = useNow();
  const timeLabel = (v) => relTime(v, now);
  // A prompt tile ("Unpopular opinion: ") puts a starter in the composer.
  const [starter, setStarter] = useState('');
  // Delete is two taps in the post menu: "Delete post", then "Tap again to delete".
  const [armedDelete, setArmedDelete] = useState(null);
  useEffect(() => { if (!armedDelete) return undefined; const t = window.setTimeout(() => setArmedDelete(null), 4000); return () => window.clearTimeout(t); }, [armedDelete]);
  // Bumped after a Helpful tap so the faces row reloads without reloading the feed.
  const [engageTick, setEngageTick] = useState(0);
  // ?tab=announcements (links from emails) opens that feed.
  const [tab, setTab] = useState(() => { try { const t = new URLSearchParams(window.location.search).get('tab'); return TABS.some(([k]) => k === t) ? t : 'for-you'; } catch { return 'for-you'; } });
  // Followed topics, same list and storage as the app (defaults from her quiz,
  // saved on this device). "My topics" filters For you, Questions and Reviews.
  const [followedTopics, toggleTopic] = useFollowedTopics(user?.id, quizResults);
  const followedKey = followedTopics.join(',');
  const [topicScopeChoice, setTopicScope] = useState(null); // 'mine' | 'all' | topic key
  const [topicSheetOpen, setTopicSheetOpen] = useState(false);
  const topicScope = topicScopeChoice === 'mine' && !followedTopics.length ? 'all'
    : topicScopeChoice && topicScopeChoice !== 'mine' && topicScopeChoice !== 'all' && !followedTopics.includes(topicScopeChoice) ? (followedTopics.length ? 'mine' : 'all')
      : topicScopeChoice || (followedTopics.length ? 'mine' : 'all');
  const topicsTab = tab === 'for-you' || tab === 'question' || tab === 'review';
  const scopedTopicsKey = !topicsTab || topicScope === 'all' ? '' : topicScope === 'mine' ? followedKey : topicScope;
  const scopedTopicList = scopedTopicsKey ? scopedTopicsKey.split(',').filter(Boolean) : null;
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
  const [rating, setRating] = useState(() => normalizeRating(seedRating) || null);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [playlistVisibility, setPlaylistVisibility] = useState('public');
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [commentBody, setCommentBody] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  // Search lives in the URL (?q=) so results can be shared and survive a refresh.
  const [search, setSearch] = useState(() => { try { return new URLSearchParams(window.location.search).get('q') || ''; } catch { return ''; } });
  useEffect(() => {
    if (composeOnly) return;
    try {
      const url = new URL(window.location.href);
      const q = search.trim();
      if ((url.searchParams.get('q') || '') === q) return;
      if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    } catch { /* ignore */ }
  }, [search, composeOnly]);
  const [blockedIds, setBlockedIds] = useState([]);
  const [reportUser, setReportUser] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // A confirmation clears itself after a few seconds.
  useEffect(() => { if (!notice) return undefined; const t = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(t); }, [notice]);
  // Followers / Following lists on a profile.
  const [peopleList, setPeopleList] = useState(null);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileById, setProfileById] = useState(new Map());
  const [profileName, setProfileName] = useState('');
  const [profileHandle, setProfileHandle] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [reportPost, setReportPost] = useState(null);
  const [reportReason, setReportReason] = useState('misinformation');
  const [editPost, setEditPost] = useState(null);
  const [editBody, setEditBody] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [notifications, setNotifications] = useState(null);
  const [showUpdates, setShowUpdates] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newAnns, setNewAnns] = useState([]);
  const [pinnedAnn, setPinnedAnn] = useState(null);
  // For you: her matches, who she follows, what's on her shelves, and what she
  // recently opened or searched (that last part stays in her browser).
  const forYouSignals = () => {
    const recent = getRecentActivity();
    return {
      matchFor,
      followingIds: new Set(followingIds),
      ownedProductIds: new Set(Object.keys(myProducts || {})),
      viewedProductIds: new Set(recent.products),
      searchTerms: recent.searches.slice(0, 10),
    };
  };
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
  const [suggestTopic, setSuggestTopic] = useState(false);
  // Shared playlists: who can add products (hidden until the collaborators migration runs).
  const [collab, setCollab] = useState({ available: false, rows: [] });
  const [inviteLink, setInviteLink] = useState('');
  const [topicName, setTopicName] = useState('');
  const [topicWhy, setTopicWhy] = useState('');
  const [topicState, setTopicState] = useState('idle');
  const userTopics = useUserTopics(supabase, user);
  const [startTopic, setStartTopic] = useState(false);
  const [postTopicId, setPostTopicId] = useState(null);
  const coverPreview = useMemo(() => (coverPhoto ? URL.createObjectURL(coverPhoto) : null), [coverPhoto]);
  useEffect(() => () => { if (coverPreview) URL.revokeObjectURL(coverPreview); }, [coverPreview]);
  const teamBadges = useTeamBadges(supabase, user);
  const badgeFor = (authorId, anon = false) => (!anon && authorId ? teamBadges.get(authorId) || null : null);
  const openRules = () => setShowRules(true);
  // Views and "found this helpful" faces for every post on screen (hidden until the migration runs).
  const shownPosts = useMemo(() => [...posts, ...profilePosts, ...(searchResults?.posts || []), ...(page?.type === 'post' && details?.id ? [details] : [])], [posts, profilePosts, searchResults, page, details]);
  const engagement = usePostEngagement({ supabase, posts: shownPosts, userId: user?.id || null, refreshKey: `${refresh}:${engageTick}` });
  const [likersPost, setLikersPost] = useState(null);

  const notifyError = (e) => setError(community.friendlyError(e));
  const requireAccount = (feature = 'this feature') => onRequireAuth?.(feature);
  // "See your match" on a product in a post: the quiz gives her the match (signed out works too).
  const seeMatch = () => (onStartQuiz ? onStartQuiz() : requireAccount('your match'));
  // The one Post button: a sheet to choose Post, Question, Review or Playlist.
  const [typeSheet, setTypeSheet] = useState(false);
  const openPostTypes = () => { if (!user) { requireAccount('posting'); return; } setTypeSheet(true); };
  // Topics live in one sheet on narrow screens (instead of two sideways chip rows).
  const [topicsSheet, setTopicsSheet] = useState(false);
  // Team picks: the pull quote only shows a post the ayna team picked by hand.
  const [teamPicks, setTeamPicks] = useState([]);
  const [pickedPost, setPickedPost] = useState(null);
  const closePage = () => { setPage(null); setDetails(null); setComments([]); setItems([]); setError(''); setEditingProfile(false); setProfileStats(null); };
  const openCompose = (kind = 'post', prompt = null) => {
    // Posting in a health community needs an account (no anonymous guest posts).
    if (!user) { requireAccount(kind === 'review' ? 'reviews' : kind === 'playlist' ? 'playlists' : kind === 'recommend' ? 'friend recommendations' : 'posting'); return; }
    if (prompt?.starter && isOnlyStarter(body, starter)) { setBody(prompt.starter); setStarter(prompt.starter); }
    setCompose(kind); setError('');
  };
  // Names for the Following empty state.
  useEffect(() => {
    if (!supabase || tab !== 'following' || !followingIds.length) return undefined;
    const missing = followingIds.filter((id) => !profileById.has(id)).slice(0, 20);
    if (!missing.length) return undefined;
    let active = true;
    community.getProfilesByIds(supabase, missing).then((m) => { if (active) setProfileById((prev) => new Map([...prev, ...m])); }).catch(() => {});
    return () => { active = false; };
  }, [supabase, tab, followingIds]); // eslint-disable-line react-hooks/exhaustive-deps
  const matchFor = (id) => { const p = productsById.get(String(id)); return p && quizResults ? getProfileMatchPercentForProduct(p, quizResults, healthProfile, matchOpts) : null; };

  useEffect(() => {
    if (!supabase) return undefined;
    const ids = [...new Set([...posts, ...comments, ...(searchResults?.posts || []), ...(page?.type === 'post' && details ? [details] : [])].map((i) => i.author_id).filter(Boolean))];
    if (!ids.length) return undefined;
    let active = true;
    community.getProfilesByIds(supabase, ids).then((m) => { if (active) setProfileById((prev) => new Map([...prev, ...m])); }).catch(() => {});
    return () => { active = false; };
  }, [supabase, posts, comments, searchResults, page, details]);

  // The latest ayna announcement is pinned at the top of For you for everyone.
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    listAnnouncements(supabase, { limit: 1 }).then(({ rows }) => { if (active) setPinnedAnn(rows?.[0] || null); }).catch(() => {});
    return () => { active = false; };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) { setUnreadCount(0); return undefined; }
    let active = true;
    community.countUnreadNotifications(supabase).then((n) => { if (active) setUnreadCount(Number(n) || 0); }).catch(() => {});
    newAnnouncementsFor(supabase, user.id).then((list) => { if (active) setNewAnns(list); }).catch(() => {});
    return () => { active = false; };
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase || !user) return;
    community.getMyCommunityProfile(supabase, user.id).then(setProfile).catch(() => {}).finally(() => setProfileChecked(true));
    community.listFollowingIds(supabase, user.id).then(setFollowingIds).catch(() => {});
    community.listBlockedIds(supabase, user.id).then(setBlockedIds).catch(() => {});
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
        const rows = await community.listFeedPosts(supabase, { kind: tab === 'question' || tab === 'review' ? tab : null, authorIds: tab === 'following' ? followingIds : null, topics: scopedTopicList });
        if (active) { setPosts(tab === 'for-you' ? rankForYou(rows, forYouSignals()) : rows); setCursor(rows.length === community.PAGE_SIZE ? community.nextCursor(rows, 'recent') : null); }
      }
    })().catch((e) => { if (active) notifyError(e); }).finally(() => { if (active) setLoading(false); markPerf('community_feed_loaded'); });
    return () => { active = false; };
  }, [supabase, tab, page, search, refresh, followingIds, productsById, quizResults, playlistSection, scopedTopicsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (search.trim().length < 2 || !supabase) return undefined;
    let active = true;
    const t = window.setTimeout(async () => {
      try { const r = await searchCommunityTolerant(community.searchCommunity, supabase, search); if (active) setSearchResults(r); } catch (e) { if (active) notifyError(e); }
    }, 250);
    return () => { active = false; window.clearTimeout(t); };
  }, [search, supabase]);

  // Team picks (newest first). The picked post comes from the feed when it's
  // loaded, else it's fetched on its own. No picks, no quote.
  useEffect(() => {
    if (!supabase || composeOnly) return undefined;
    let active = true;
    community.listTeamPicks(supabase, { limit: 3 }).then((rows) => { if (active) setTeamPicks(rows || []); }).catch(() => {});
    return () => { active = false; };
  }, [supabase, composeOnly, refresh]);
  const pickId = teamPicks[0]?.post_id || null;
  useEffect(() => {
    if (!supabase || !pickId) { setPickedPost(null); return undefined; }
    let active = true;
    community.getFeedPost(supabase, pickId).then((p) => { if (active) setPickedPost(p || null); }).catch(() => { if (active) setPickedPost(null); });
    return () => { active = false; };
  }, [supabase, pickId]);

  // Side modules: recent questions and community playlists, loaded once.
  useEffect(() => {
    if (!supabase || composeOnly) return undefined;
    let active = true;
    community.listFeedPosts(supabase, { kind: 'question', limit: 6 }).then((rows) => { if (active) setSideQuestions(rows || []); }).catch(() => {});
    community.listPlaylists(supabase, { section: 'recent', limit: 6 }).then((rows) => { if (active) setSidePlaylists(rows || []); }).catch(() => {});
    return () => { active = false; };
  }, [supabase, composeOnly, refresh]);

  // ⌘K (Ctrl K elsewhere) jumps to Community search.
  const searchRef = useRef(null);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  useEffect(() => {
    if (composeOnly) return undefined;
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || String(e.key).toLowerCase() !== 'k') return;
      if (document.querySelector('.cm-sheet-backdrop')) return;
      e.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [composeOnly]);

  // The post "…" menu closes on outside click or Escape.
  useEffect(() => {
    if (!menuId) return undefined;
    const onDown = (e) => { if (!e.target.closest?.('.cm-menu-wrap')) setMenuId(null); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuId(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuId]);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const rows = await community.listFeedPosts(supabase, { kind: tab === 'question' || tab === 'review' ? tab : null, authorIds: tab === 'following' ? followingIds : null, topics: scopedTopicList, cursor });
      setPosts((prev) => [...prev, ...(tab === 'for-you' ? rankForYou(rows, forYouSignals()) : rows)]);
      setCursor(rows.length === community.PAGE_SIZE ? community.nextCursor(rows, 'recent') : null);
    } catch (e) { notifyError(e); } finally { setLoading(false); }
  };
  const openPost = async (post) => {
    // The tapped note grows into the open post (utils/viewTransition.js).
    growTransition(() => { setPage({ type: 'post', id: post.id }); setDetails(post); setError(''); window.scrollTo(0, 0); }, { target: 'post' });
    try { setComments(await community.listComments(supabase, post.id)); } catch (e) { notifyError(e); }
  };
  const openPlaylist = async (pl) => {
    setProductId(null); setPage({ type: 'playlist', id: pl.id }); setDetails(pl); setError(''); window.scrollTo(0, 0);
    setItems((pl.preview_product_ids || []).map((product_id) => ({ product_id })));
    setCollab({ available: false, rows: [] }); setInviteLink('');
    try { setItems(await community.listPlaylistItems(supabase, pl.id)); } catch (e) { if (!pl.preview_product_ids?.length) notifyError(e); }
    if (user) community.listPlaylistCollaborators(supabase, pl.id).then(setCollab).catch(() => {});
  };
  const openTopic = (t) => { if (!t?.id) return; setPage({ type: 'topic', id: t.id }); setDetails(null); setError(''); setSearch(''); setSearchResults(null); window.scrollTo(0, 0); };
  const openTopics = () => { setPage({ type: 'topics', id: 'all' }); setDetails(null); setError(''); setSearch(''); setSearchResults(null); window.scrollTo(0, 0); };
  // ?join-topic=<code> (an invite link someone shared): join, then open the topic.
  useEffect(() => {
    if (!supabase || !userTopics.available) return undefined;
    let code = null;
    try { code = parseTopicInviteCode(new URLSearchParams(window.location.search).get('join-topic')); } catch { /* no URL */ }
    if (!code) return undefined;
    if (!user) { requireAccount('joining this topic'); return undefined; }
    let active = true;
    joinTopicByCode(supabase, code).then((res) => {
      if (!active) return;
      try { const url = new URL(window.location.href); url.searchParams.delete('join-topic'); window.history.replaceState(window.history.state, '', url); } catch { /* keep the URL */ }
      if (res.ok) { userTopics.reload(); openTopic({ id: res.topicId }); toast('Joined'); } else setError(res.message);
    }).catch((e) => { if (active) notifyError(e); });
    return () => { active = false; };
  }, [supabase, user, userTopics.available]); // eslint-disable-line react-hooks/exhaustive-deps
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
        // Only this person's own, signed posts (never an anonymous one, never someone else's).
        if (a.status === 'fulfilled') setProfilePosts((a.value || []).filter((x) => x.author_id === p.user_id && !x.is_anonymous));
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
      let anns = [];
      try {
        const { rows: annRows } = await listAnnouncements(supabase, { limit: 5 });
        const fresh = new Set(newAnns.map((a) => a.id));
        anns = (annRows || []).filter((a) => Date.now() - new Date(a.created_at).getTime() < 30 * 86400000)
          .map((a) => ({ id: `ann-${a.id}`, type: 'announcement', created_at: a.created_at, title: a.title, isNew: fresh.has(a.id) }));
      } catch { /* announcements are optional here */ }
      const merged = [...anns, ...rows.map((n) => ({ ...n, actor: people.get(actorOf(n)) || null }))]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(merged);
      writeAnnSeen(user.id); setNewAnns([]);
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

  // Drafts: what she writes is saved on this device as she types, so a stray
  // tap, a reload or a failed post never loses it. Closing with words or
  // photos in the composer asks first; the draft is cleared only on Discard
  // or after the post has saved.
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const resetComposer = () => {
    setBody(''); setStarter(''); setProductId(seedProductId); setAnonymous(false); setPhotos([]); setRating(normalizeRating(seedRating) || null);
    setPlaylistTitle(''); setPlaylistVisibility('public'); setCoverPhoto(null); setSelectedFriendIds([]); setError(''); setPostTopicId(null);
  };
  const composeDirty = Boolean(!isOnlyStarter(body, starter) || playlistTitle.trim() || photos.length || coverPhoto);
  const draftStoreKey = user ? draftKey('web', user.id, composeOnly ? `pdp-${seedKind || 'post'}-${seedProductId || ''}` : '') : null;
  const { clear: clearStoredDraft } = useComposerDraft({
    key: draftStoreKey,
    enabled: Boolean(user),
    draft: { kind: compose || 'post', body, productId, rating, anonymous, playlistTitle, friendIds: selectedFriendIds, photos },
    restore: (d) => {
      if (body.trim() || playlistTitle.trim()) return;
      if (seedProductId && d.productId && String(d.productId) !== String(seedProductId)) return;
      setBody(d.body); setPlaylistTitle(d.playlistTitle); setAnonymous(d.anonymous); setSelectedFriendIds(d.friendIds);
      if (d.productId) setProductId(d.productId);
      if (d.rating) setRating(d.rating);
      if (d.photos.length) setPhotos(photosFromDraft(d.photos));
    },
  });
  useEffect(() => {
    if (confirmDiscard) document.querySelector('.cm-discard .ay-btn--primary')?.focus({ preventScroll: true });
  }, [confirmDiscard]);
  // Opening the composer with words in it (a prompt starter or a saved draft)
  // puts the caret at the end, so she keeps typing after "Unpopular opinion: ".
  useEffect(() => {
    if (!compose) return undefined;
    const t = window.setTimeout(() => { const el = document.getElementById('cm-compose-body'); if (el && document.activeElement === el) { const n = el.value.length; el.setSelectionRange(n, n); } }, 30);
    return () => window.clearTimeout(t);
  }, [compose]);
  const discardCompose = () => { setConfirmDiscard(false); resetComposer(); clearStoredDraft(); closeCompose(); };
  const requestCloseCompose = () => {
    if (busy) return; // never close while a post is on its way
    if (confirmDiscard) { setConfirmDiscard(false); return; }
    if (composeDirty) { setConfirmDiscard(true); return; }
    discardCompose();
  };

  const submit = async () => {
    if (busy) return;
    if (!user) { requireAccount('posting'); return; }
    if (composeEmpty || composeIssue || composeBlocked) return;
    if (compose === 'review' && !productId) { setError('Choose a product to review.'); return; }
    if (compose === 'recommend' && (!productId || !selectedFriendIds.length)) { setError('Choose a product and at least one friend.'); return; }
    if (user && !profile) { setError('Set up your community profile first.'); return; }
    setBusy(true); setError('');
    const kind = compose;
    const client = supabase;
    const userId = user.id;
    // Step 1: save. Only this decides success; on a failure the composer
    // stays open with everything she wrote and an inline error.
    const saved = await submitDraft({
      key: draftStoreKey,
      save: async () => {
        if (kind === 'recommend') {
          await community.sendRecommendations(client, userId, productId, selectedFriendIds, body);
          return null;
        }
        if (kind === 'playlist') {
          let cover;
          try {
            const file = coverPhoto || await makePlaylistCoverFile(playlistTitle, coverColor);
            cover = await uploadCommunityImage(client, file, { folder: 'covers', userId });
            const result = await community.createPlaylist(client, userId, { title: playlistTitle, visibility: playlistVisibility, coverUrl: cover.url });
            let productAdded = true;
            if (productId) { try { await community.addToPlaylist(client, result.id, productId); } catch { productAdded = false; } }
            return { result, productAdded };
          } catch (e) { if (cover) await deleteCommunityImage(client, cover.path); throw e; }
        }
        const product = productsById.get(String(productId));
        const topics = [...new Set([...extractHashtagTopics(body), ...suggestTopicsForProducts(product ? [product] : [])])].slice(0, 5);
        const media = [];
        try {
          for (const photo of photos) media.push(await uploadCommunityImage(client, photo, { folder: 'posts' }));
          return await community.createPost(client, userId, { kind, body, topics, media, isAnonymous: anonymous, productId: kind === 'review' ? productId : null, rating: kind === 'review' ? rating : null, taggedProductIds: kind === 'review' || !productId ? [] : [productId], topicId: kind === 'review' ? null : postTopicId });
        } catch (e) { await Promise.all(media.map((m) => deleteCommunityImage(client, m.path).catch(() => {}))); throw e; }
      },
    });
    setBusy(false);
    if (!saved.ok) { notifyError(saved.error); return; }
    // Step 2: it's saved. Close, confirm, and refresh. Nothing here can turn
    // a saved post into an error.
    setConfirmDiscard(false); resetComposer(); clearStoredDraft(); setCompose(null); setRefresh((v) => v + 1);
    if (kind === 'recommend') { if (composeOnly) finishCompose('Sent'); else setNotice('Recommendation sent.'); return; }
    if (kind === 'playlist') {
      const { result, productAdded } = saved.result;
      if (composeOnly) { finishCompose('Playlist created'); return; }
      if (!productAdded) setNotice('Playlist created, but the product could not be added.');
      setTab('playlists');
      try { await openPlaylist(result); } catch { /* the playlist is saved; the list will show it */ }
      return;
    }
    if (composeOnly) { finishCompose(kind === 'review' ? 'Review posted' : 'Posted'); return; }
    const postId = saved.result?.id;
    toast(kind === 'question' ? 'Question posted' : kind === 'review' ? 'Review posted' : 'Posted', postId ? { label: 'View', onClick: async () => {
      try { const post = await community.getFeedPost(client, postId); if (post) await openPost(post); } catch { /* still in the feed */ }
    } } : null);
  };
  const submitComment = async () => {
    if (!user) { requireAccount('replying'); return; }
    if (!commentBody.trim() || !details?.id || breaksCommunityRules(commentBody)) return;
    setBusy(true); setError('');
    try {
      const client = user ? supabase : getGuestClient();
      const userId = user?.id || await ensureGuestSession();
      await community.createComment(client, userId, { postId: details.id, parentId: replyTo, body: commentBody, isAnonymous: !user || anonymous, productId });
      setComments(await community.listComments(client, details.id)); setCommentBody(''); setReplyTo(null); setProductId(null); setShowTagPicker(false);
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  // Helpful and Save change on screen at once, everywhere the post shows, and
  // roll back with a toast if the server says no.
  const patchPost = (id, fn) => {
    const map = (list) => list.map((p) => (p.id === id ? fn(p) : p));
    setPosts(map); setProfilePosts(map);
    setSearchResults((r) => (r ? { ...r, posts: map(r.posts || []) } : r));
    setDetails((d) => (d && d.id === id && page?.type === 'post' ? fn(d) : d));
  };
  const inFlight = useRef(new Set());
  const togglePost = async (post, kind) => {
    if (!user) { requireAccount(kind === 'save' ? 'saved posts' : 'reactions'); return; }
    const key = `${kind}:${post.id}`;
    if (inFlight.current.has(key)) return;
    const on = !post[kind === 'save' ? 'viewer_saved' : 'viewer_found_helpful'];
    inFlight.current.add(key);
    patchPost(post.id, (p) => applyToggle(p, kind, on));
    try {
      if (kind === 'save') await community.setSaved(supabase, user.id, post.id, on);
      else await community.setHelpful(supabase, user.id, { postId: post.id }, on);
      if (kind === 'save') toast(on ? 'Saved' : 'Removed from saved');
      else setEngageTick((v) => v + 1);
    } catch {
      patchPost(post.id, (p) => applyToggle(p, kind, !on));
      toast(kind === 'save' ? 'Couldn’t save that. Try again.' : 'Couldn’t mark that helpful. Try again.');
    } finally { inFlight.current.delete(key); }
  };
  const share = async (post) => {
    const r = await sharePost(post);
    if (r === 'copied') toast('Link copied');
    else if (r === 'failed') toast('Couldn’t copy the link');
  };
  // Delete waits 5 seconds with an Undo before it really happens.
  const pendingDelete = useRef(null);
  const confirmDelete = async (target) => {
    if (!target || busy) return;
    setArmedDelete(null); setMenuId(null); setError('');
    setPosts((prev) => prev.filter((p) => p.id !== target.id));
    setProfilePosts((prev) => prev.filter((p) => p.id !== target.id));
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

  const submitUserReport = async () => {
    if (!reportUser || !user) return;
    setBusy(true); setError('');
    try {
      await community.fileReport(supabase, user.id, { targetType: 'user', reportedUserId: reportUser.user_id, reason: reportReason });
      setReportUser(null); setNotice('Report sent. Thank you for helping keep Community safe.');
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  const setBlock = async (target, on) => {
    if (!user || !target) return;
    setBusy(true); setError('');
    try {
      await community.setBlocked(supabase, user.id, target.user_id, on);
      setBlockedIds((ids) => (on ? [...new Set([...ids, target.user_id])] : ids.filter((id) => id !== target.user_id)));
      if (on && followingIds.includes(target.user_id)) {
        await community.setFollowing(supabase, user.id, target.user_id, false).catch(() => {});
        setFollowingIds((ids) => ids.filter((id) => id !== target.user_id));
      }
      setBlockTarget(null);
      setNotice(on ? `Blocked ${target.display_name || target.username}` : `Unblocked ${target.display_name || target.username}`);
    } catch (e) { notifyError(e); } finally { setBusy(false); }
  };
  const removeFriend = async (row) => {
    if (!row) return;
    try { await community.removeFriendship(supabase, row.id); setRefresh((v) => v + 1); } catch (e) { notifyError(e); }
  };
  const isBlocked = (authorId) => Boolean(authorId && blockedIds.includes(authorId));

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
    if (compose === 'review' && !rating) return 'Pick a star rating.';
    if (compose === 'recommend' && !productId) return 'Choose a product to recommend.';
    if (compose === 'recommend' && !selectedFriendIds.length) return 'Pick at least one friend.';
    if (compose !== 'playlist' && body.length > bodyMax) return `Keep it under ${bodyMax} characters.`;
    return '';
  })();
  const composeEmpty = compose === 'playlist' ? !playlistTitle.trim() : compose !== 'recommend' && isOnlyStarter(body, starter);
  const composeBlocked = compose === 'playlist' ? breaksCommunityRules(playlistTitle) : breaksCommunityRules(body);

  const hashtagMatch = body.match(/(?:^|\s)#([A-Za-z][\w-]*)?$/);
  const hashtagSuggestions = hashtagMatch ? suggestHashtags(hashtagMatch[1] || '', 6) : [];

  // ayna team: pick a post for the pull quote, or take the pick back (RLS checks it too).
  const isTeam = Boolean(user && teamBadges.get(user.id));
  const toggleTeamPick = async (post) => {
    const on = !teamPicks.some((t) => t.post_id === post.id);
    try {
      await community.setTeamPick(supabase, post.id, on);
      setTeamPicks((rows) => (on ? [{ post_id: post.id, picked_at: new Date().toISOString() }, ...rows] : rows.filter((t) => t.post_id !== post.id)));
      toast(on ? 'Picked for Community' : 'Team pick removed');
    } catch (e) { notifyError(e); }
  };
  const popIcon = (e) => { const b = e.currentTarget; b.classList.remove('is-pop'); void b.offsetWidth; b.classList.add('is-pop'); };
  const renderPost = (post, full = false, i = 0) => {
    const anon = post.is_anonymous || !post.author_id;
    const name = anon ? 'Anonymous' : post.author_display_name || post.author_username || 'Community member';
    const menuOpen = menuId === post.id;
    const armed = armedDelete === post.id;
    const helpful = Number(post.helpful_count) || 0;
    const replies = Number(post.comment_count) || 0;
    const kind = post.kind === 'question' || post.kind === 'review' ? post.kind : 'post';
    const media = post.media || [];
    const long = !full && String(post.body || '').length > 360;
    const replyWord = kind === 'question' ? 'Answer' : 'Reply';
    return <article ref={engagement.trackView(post.id)} className={`cm-post cm-note is-${kind}${full ? ' is-full' : ''}`} style={{ '--i': Math.min(i, 6) }} data-kind={kind} data-vt-target={full ? 'post' : undefined} key={post.id}>
      {/* What kind of post this is: an outlined label with an icon (Community audit, issue 2). */}
      {kind === 'review' && <KindLabel kind="review">Review</KindLabel>}
      {kind === 'question' && <span className="cm-kindrow"><KindLabel kind="question">Question</KindLabel><span className={`cm-status${replies ? '' : ' is-open'}`}>{replies ? 'Answered' : 'Needs answers'}</span></span>}
      <header className="cm-post-head">
        <Avatar size={40} name={name} path={!anon ? profileById.get(post.author_id)?.avatar_url : null} anonymous={anon} />
        <div className="cm-post-who">
          {anon || !post.author_username ? <strong>{name}</strong> : <button type="button" className="cm-name" onClick={() => openProfile(post.author_username)}>{name}</button>}
          <span className="cm-post-meta"><TeamTag title={badgeFor(post.author_id, anon)} /><time dateTime={post.created_at || undefined} title={fullTime(post.created_at)}>{timeLabel(post.created_at)}</time>{post.edited_at && <span>Edited</span>}</span>
        </div>
        <div className="cm-menu-wrap">
          <button type="button" className="cm-more" aria-label={`More options for ${name}'s post`} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => { setArmedDelete(null); setMenuId(menuOpen ? null : post.id); }}><Icon name="more" size={18} /></button>
          {menuOpen && <div className="cm-menu" role="menu">
            {post.is_mine && user && <button type="button" role="menuitem" onClick={() => { setMenuId(null); setEditPost(post); setEditBody(post.body || ''); setEditRating(normalizeRating(post.rating)); }}>{post.kind === 'review' ? 'Edit review' : 'Edit post'}</button>}
            <button type="button" role="menuitem" onClick={() => { setMenuId(null); share(post); }}>Copy link</button>
            {isTeam && <button type="button" role="menuitem" onClick={() => { setMenuId(null); toggleTeamPick(post); }}>{teamPicks.some((t) => t.post_id === post.id) ? 'Remove team pick' : 'Pick for Community'}</button>}
            {post.is_mine ? <button type="button" role="menuitem" className={armed ? 'is-armed' : undefined} aria-live="polite" disabled={busy} onClick={() => (armed ? confirmDelete(post) : setArmedDelete(post.id))}>{armed ? 'Tap again to delete' : 'Delete post'}</button>
              : <button type="button" role="menuitem" onClick={() => { setMenuId(null); setReportPost(post); }}>Report post</button>}
          </div>}
        </div>
      </header>
      {/* Review highlights in rounded label boxes, only from what she entered (stars, would recommend). */}
      {kind === 'review' && <div className="cm-review-facts">
        <span className="cm-factbox cm-review-stars"><Stars value={post.rating} size={18} /><span aria-hidden="true">{normalizeRating(post.rating) ? `${normalizeRating(post.rating)} of 5` : ''}</span></span>
        {post.would_recommend === true && <span className="cm-factbox">Would recommend</span>}
        {post.would_recommend === false && <span className="cm-factbox">Wouldn’t recommend</span>}
      </div>}
      {full ? <p className="cm-body">{post.body}</p> : <button type="button" className={`cm-body${long ? ' is-clamped' : ''}`} onClick={() => openPost(post)}>{post.body}</button>}
      {long && <button type="button" className="cm-readmore" onClick={() => openPost(post)}>Read the rest</button>}
      {media.length > 0 && <div className={`cm-photos n-${Math.min(media.length, 4)}`}>{media.slice(0, 4).map((m, k) => (full
        ? <span key={m.path} className="cm-polaroid"><img src={publicMediaUrl(m.path)} alt="" loading="lazy" /></span>
        : <button type="button" key={m.path} className="cm-polaroid" onClick={() => openPost(post)} aria-label={`Open ${name}'s post, photo ${k + 1}`}><img src={publicMediaUrl(m.path)} alt="" loading="lazy" /></button>))}</div>}
      {full && postProductIds(post).length > 0 && <p className="cm-modnote">Experiences, not medical advice.</p>}
      {postProductIds(post).slice(0, 1).map((id) => <Mention key={id} productId={id} productsById={productsById} quizResults={quizResults} healthProfile={healthProfile} matchOpts={matchOpts} onOpenProduct={onOpenProduct} onSeeMatch={seeMatch} />)}
      <PostStats post={post} engagement={engagement} onOpenLikers={setLikersPost} />
      <footer className="cm-actions">
        <button type="button" className="cm-act-helpful" aria-pressed={Boolean(post.viewer_found_helpful)} aria-label={`Helpful${helpful ? `, ${helpful}` : ''}`} onClick={(e) => { if (user && !post.viewer_found_helpful) popIcon(e); togglePost(post, 'helpful'); }}><Icon name="thumb" size={18} /><span aria-hidden="true">Helpful{helpful ? <b>{helpful}</b> : null}</span></button>
        <button type="button" aria-label={`${replyWord}${replies ? `, ${replies} ${kind === 'question' ? (replies === 1 ? 'answer' : 'answers') : (replies === 1 ? 'reply' : 'replies')}` : ''}`} onClick={() => openPost(post)}><Icon name="comment" size={18} /><span aria-hidden="true">{replyWord}{replies ? <b>{replies}</b> : null}</span></button>
        <button type="button" aria-label="Share" onClick={() => share(post)}><Icon name="share" size={18} /><span aria-hidden="true">Share</span></button>
        <button type="button" className="cm-save" aria-pressed={Boolean(post.viewer_saved)} aria-label={post.viewer_saved ? 'Saved' : 'Save'} onClick={(e) => { if (user && !post.viewer_saved) popIcon(e); togglePost(post, 'save'); }}><Icon name="bookmark" size={18} /><span aria-hidden="true">{post.viewer_saved ? 'Saved' : 'Save'}</span></button>
      </footer>
    </article>;
  };
  // Playlists are stacked rounded rows: cover, name, count and owner (Community audit v2, Skin Routine boards).
  const playlistCard = (p) => <button type="button" className="cm-playlist cm-pl-rowbtn" key={p.id} onClick={() => openPlaylist(p)}>
    <PlaylistCover playlist={p} productsById={productsById} />
    <span className="cm-playlist-copy"><strong>{p.title}</strong><small>{p.item_count || 0} {(p.item_count || 0) === 1 ? 'product' : 'products'} · by {p.owner_display_name || 'ayna community'}</small></span>
    <svg className="cm-pl-go" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
  </button>;

  const composeLabel = compose === 'question' ? 'Your question' : compose === 'review' ? 'Your review' : compose === 'recommend' ? 'Note to your friends' : 'Your post';
  const discardNoun = compose === 'playlist' ? 'playlist' : compose === 'review' ? 'review' : compose === 'question' ? 'question' : compose === 'recommend' ? 'recommendation' : 'post';
  const discardCard = confirmDiscard && <div className="cm-discard-layer" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDiscard(false); }}>
    <div className="cm-discard" role="alertdialog" aria-modal="true" aria-labelledby="cm-discard-title" aria-describedby="cm-discard-copy">
      <h3 id="cm-discard-title">Discard this {discardNoun}?</h3>
      <p id="cm-discard-copy" className="cm-muted">What you wrote will be deleted.</p>
      <div className="cm-discard-actions">
        <button type="button" className="ay-btn ay-btn--primary" onClick={() => setConfirmDiscard(false)}>Keep editing</button>
        <button type="button" className="ay-btn ay-btn--secondary" onClick={discardCompose}>Discard</button>
      </div>
    </div>
  </div>;
  const composeSheet = compose && <Sheet title={KIND_TITLES[compose]} onClose={requestCloseCompose} className="cm-compose" overlay={discardCard}>
      <div className="cm-seg cm-kinds" role="group" aria-label="What are you sharing?">{Object.keys(KIND_TITLES).map((k) => <button type="button" key={k} aria-pressed={compose === k} onClick={() => openCompose(k)}>{VERB[k] || k}</button>)}</div>
      {composeOnly && user && profileChecked && !profile && <div className="cm-card cm-join"><h3>Pick a name first</h3><p className="cm-muted">Your health answers stay private.</p>
        <RuleField as="input" value={profileName} maxLength={50} onChange={(e) => setProfileName(e.target.value)} placeholder="Display name" aria-label="Display name" onShowRules={openRules} />
        <RuleField as="input" value={profileHandle} maxLength={30} onChange={(e) => setProfileHandle(e.target.value.toLowerCase())} placeholder="Username" aria-label="Username" onShowRules={openRules} />
        <button type="button" className="ay-btn ay-btn--secondary" disabled={busy || !profileName.trim() || !profileHandle.trim() || breaksCommunityRules(profileName, profileHandle)} onClick={saveProfile}>Create profile</button></div>}
      {compose === 'playlist' ? <>
        <section className="cm-group">
          <label className="cm-label" htmlFor="cm-pl-name">Name</label>
          <RuleField as="input" id="cm-pl-name" data-autofocus value={playlistTitle} maxLength={60} onChange={(e) => setPlaylistTitle(e.target.value)} placeholder="e.g. My everyday essentials" onShowRules={openRules} />
        </section>
        <section className="cm-group">
          <h3 className="cm-label">Who can see it</h3>
          <div className="cm-seg cm-seg-fill">{AUDIENCE.map(([v, l]) => <button type="button" key={v} aria-pressed={playlistVisibility === v} onClick={() => setPlaylistVisibility(v)}>{l}</button>)}</div>
        </section>
        <section className="cm-group">
          <h3 className="cm-label">Cover</h3>
          <div className="cm-cover-pick">
            <span className="cm-cover-preview" style={coverPreview ? undefined : { background: coverColor, color: coverColor === COVER_COLORS[0] ? '#ffedac' : '#3e2723' }} aria-hidden="true">{coverPreview ? <img src={coverPreview} alt="" /> : <span>{playlistTitle.trim() || 'ayna'}</span>}</span>
            <div className="cm-cover-opts">
              <div className="cm-colors">{COVER_COLORS.map((c) => <button type="button" key={c} aria-label={`Cover color ${c}`} aria-pressed={!coverPhoto && coverColor === c} style={{ background: c }} onClick={() => { setCoverColor(c); setCoverPhoto(null); }} />)}</div>
              <label className="ay-btn ay-btn--secondary cm-small cm-upload">{coverPhoto ? 'Change photo' : 'Upload a photo'}<input type="file" accept="image/*" className="cm-file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { try { checkImageFile(f); setCoverPhoto(f); } catch (err) { setError(err.message); } } e.target.value = ''; }} /></label>
            </div>
          </div>
        </section>
        <section className="cm-group">
          <h3 className="cm-label">First product <small>Optional</small></h3>
          <Picker products={products} value={productId} onChange={setProductId} placeholder="Search products to add" />
        </section>
      </> : <>
        {/* A review starts with what you're reviewing and how many stars, then the words. */}
        {compose === 'review' && <section className="cm-group">
          <h3 className="cm-label">Product you’re reviewing</h3>
          <Picker products={products} value={productId} onChange={setProductId} placeholder="Search products" />
        </section>}
        {compose === 'review' && <section className="cm-group">
          <h3 className="cm-label" id="cm-rating-label">Your rating</h3>
          <div className="cm-rating" role="radiogroup" aria-labelledby="cm-rating-label">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`} className={rating && n <= rating ? 'is-on' : ''} onClick={() => setRating(n)}><Star on={Boolean(rating) && n <= rating} size={28} /></button>)}</div>
        </section>}
        {userTopics.available && compose !== 'review' && compose !== 'recommend' && <PostInPicker id="cm-post-in" topics={userTopics.mine} value={postTopicId} onChange={setPostTopicId} />}
        <section className="cm-group">
          <label className="cm-label" htmlFor="cm-compose-body">{composeLabel}</label>
          <RuleField id="cm-compose-body" autoGrow data-autofocus={compose !== 'review' || undefined} minRows={4} value={body} maxLength={bodyMax} onChange={(e) => setBody(e.target.value)} placeholder={compose === 'question' ? 'What would you like to ask? Add #topics if helpful.' : compose === 'review' ? 'How was it for you?' : compose === 'recommend' ? 'Add a note (optional)' : 'What’s on your mind? Add #topics if helpful.'} onShowRules={openRules} />
          {compose === 'question' && (() => {
            // Before she asks, show questions already asked that share her words.
            const words = body.toLowerCase().match(/[a-z]{4,}/g) || [];
            if (words.length < 2) return null;
            const seen = new Set();
            const similar = [...sideQuestions, ...posts.filter((x) => x.kind === 'question')]
              .filter((q) => q?.id && !seen.has(q.id) && seen.add(q.id))
              .map((q) => ({ q, n: words.filter((w) => String(q.body || '').toLowerCase().includes(w)).length }))
              .filter((x) => x.n >= 2)
              .sort((a, b) => b.n - a.n)
              .slice(0, 3);
            return similar.length ? <div className="cm-similar"><p className="cm-label">Already asked</p><ul>{similar.map(({ q }) => <li key={q.id}><button type="button" className="ct-link cm-link" onClick={() => { setCompose(null); openPost(q); }}>{String(q.body).slice(0, 120)}</button></li>)}</ul></div> : null;
          })()}
          {hashtagSuggestions.length > 0 && <div className="cm-tags">{hashtagSuggestions.map((t) => <button type="button" key={t.key} onClick={() => setBody((x) => x.replace(/#(?:[A-Za-z][\w-]*)?$/, `${t.tag} `))}>{t.tag}</button>)}</div>}
        </section>
        <section className="cm-group">
          {compose !== 'review' && <>
            <h3 className="cm-label">{compose === 'recommend' ? 'Product to recommend' : <>Product <small>Optional</small></>}</h3>
            <Picker products={products} value={productId} onChange={setProductId} placeholder="Search products" />
          </>}
          {compose !== 'recommend' && <div className="cm-photo-pick">
            <label className="ay-btn ay-btn--secondary cm-small cm-upload">{photos.length ? 'Change photos' : 'Add photos'}<input type="file" accept="image/*" multiple className="cm-file" aria-label="Add photos" onChange={(e) => { try { const f = Array.from(e.target.files || []).slice(0, MAX_POST_PHOTOS); f.forEach(checkImageFile); setPhotos(f); setError(''); } catch (err) { setError(err.message); } e.target.value = ''; }} /></label>
            <small>{photos.length ? photos.map((f) => f.name).join(', ') : `Up to ${MAX_POST_PHOTOS}`}</small>
          </div>}
        </section>
        {compose === 'recommend' && <section className="cm-group cm-friends"><h3 className="cm-label">Send to friends</h3>{friendProfiles.length ? friendProfiles.map((f) => <Check key={f.user_id} checked={selectedFriendIds.includes(f.user_id)} onChange={(e) => setSelectedFriendIds((ids) => (e.target.checked ? [...ids, f.user_id] : ids.filter((id) => id !== f.user_id)))}>{f.display_name || f.username}</Check>) : <p className="cm-muted">Add friends from Community profiles first.</p>}</section>}
      </>}
      <div className="cm-compose-foot">
        {user && compose !== 'playlist' && compose !== 'recommend' && <Check checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}>Post anonymously</Check>}
        {composeIssue && !composeEmpty && (compose !== 'recommend' || body.trim() || productId) && <p className="cm-hint" role="status">{composeIssue}</p>}
        {error && <p className="cm-error" role="alert">{error}</p>}
        <div className="cm-compose-actions">
          <button type="button" className="ct-link cm-link cm-rules-link" onClick={openRules}>Community rules</button>
          {compose !== 'playlist' && <CharRing length={body.length} max={bodyMax} className="ay-ring cm-ring" />}
          <button type="button" className="ay-btn ay-btn--primary" disabled={busy || composeEmpty || Boolean(composeIssue) || composeBlocked} onClick={submit}>{busy ? 'Sharing…' : compose === 'playlist' ? 'Create playlist' : compose === 'recommend' ? 'Send recommendation' : compose === 'question' ? 'Ask question' : compose === 'review' ? 'Post review' : 'Share post'}</button>
        </div>
      </div>
    </Sheet>;

  if (composeOnly && !supabase) return <Sheet title="Community isn’t loading" onClose={() => onDone?.()}><p className="cm-muted">We couldn’t reach the community. Check your connection and reload the page.</p><button type="button" className="ay-btn ay-btn--primary" onClick={() => onDone?.()}>Close</button></Sheet>;
  if (composeOnly) {
    if (!user) return null;
    return <>
      {!doneLabel && composeSheet}
    {showRules && <Sheet title="Community rules" onClose={() => setShowRules(false)} className="cm-rules-sheet"><CommunityRulesList /><button type="button" className="ay-btn ay-btn--primary" onClick={() => setShowRules(false)}>Got it</button></Sheet>}
      {doneLabel && createPortal(<div className="cm-sheet-backdrop cm-done-backdrop" onClick={() => onDone?.()}><div className="cm-done" role="status" aria-live="polite"><span className="cm-done-mark" aria-hidden="true"><Icon name="check" size={22} /></span><strong>{doneLabel}</strong></div></div>, document.querySelector('.app-container') || document.body)}
    </>;
  }
  if (!supabase) return <section className="ct cm ay-container"><div className="cm-empty"><h1>Community isn’t loading</h1><p>We couldn’t reach the community. Check your connection and reload the page.</p></div></section>;

  const openPeopleList = async (kind, owner) => {
    const title = kind === 'followers' ? 'Followers' : 'Following';
    setPeopleList({ title, people: null });
    try {
      const ids = kind === 'followers' ? await community.listFollowers(supabase, owner) : await community.listFollowingIds(supabase, owner);
      const found = ids.length ? await community.getProfilesByIds(supabase, ids) : new Map();
      setPeopleList({ title, people: ids.map((id) => found.get(id)).filter((x) => x && !isBlocked(x.user_id)) });
    } catch (e) { setPeopleList(null); notifyError(e); }
  };
  const ownedProducts = Object.entries(myProducts || {})
    .map(([id, v]) => (v && typeof v === 'object' && v.name ? v : productsById.get(String(id))))
    .filter((x) => x && x.name && !x.userAdded).slice(0, 4);

  const REPLY_BOX = <div className="cm-reply">
        {replyTo && <button type="button" className="ct-link cm-link" onClick={() => setReplyTo(null)}>Replying to a comment · cancel</button>}
        <RuleField autoGrow minRows={3} value={commentBody} maxLength={COMMENT_MAX} onChange={(e) => setCommentBody(e.target.value)} placeholder="Add to the conversation" aria-label="Your reply" onShowRules={openRules} />
        <CharRing length={commentBody.length} max={COMMENT_MAX} className="ay-ring cm-ring is-reply" />
        {showTagPicker || productId ? <Picker products={products} value={productId} onChange={setProductId} placeholder="Search a product to tag" /> : <button type="button" className="ct-link cm-link cm-tag-link" onClick={() => setShowTagPicker(true)}>+ Tag a product</button>}
        {user && <Check checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}>Reply anonymously</Check>}
        <button type="button" className="ay-btn ay-btn--primary" disabled={busy || !commentBody.trim() || breaksCommunityRules(commentBody)} onClick={submitComment}>Post reply</button>
      </div>;
  const replyEmpty = <p className="cm-muted">No replies yet.</p>;

  const visiblePosts = posts.filter((p) => !isBlocked(p.author_id));
  // The pull quote: only a post the ayna team picked by hand, labelled as theirs.
  const memberQuote = pickTeamQuote([...visiblePosts, ...(pickedPost ? [pickedPost] : [])], teamPicks, { isBlocked });
  // Inline (phones), the quote sits a few notes away from the post it quotes.
  const quotedAt = memberQuote ? visiblePosts.findIndex((p) => p.id === memberQuote.post.id) : -1;
  const quoteSlot = quotedAt >= 0 && quotedAt <= 5 ? quotedAt + 4 : 2;
  const quoteBlock = (where) => {
    if (!memberQuote) return null;
    const q = memberQuote.post;
    const anon = q.is_anonymous || !q.author_id;
    const who = anon ? 'A member' : q.author_display_name || q.author_username || 'A member';
    const product = postProductIds(q).map((id) => productsById.get(String(id))).find(Boolean);
    const n = Number(q.helpful_count) || 0;
    return <figure className={`cm-quote ${where}`}>
      <span className="cm-quote__label">Picked by the ayna team</span>
      <blockquote><button type="button" onClick={() => openPost(q)}><mark>{memberQuote.lead}</mark>{memberQuote.rest ? ` ${memberQuote.rest}` : ''}</button></blockquote>
      <figcaption><strong>{who}</strong>{product ? <span>on {product.name}</span> : null}<span>{n} found this helpful</span></figcaption>
    </figure>;
  };
  const peopleBlock = (where) => {
    const list = user ? suggestedPeople.slice(0, SIDE_MAX) : [];
    if (!list.length) return null;
    return <section className={`cm-mod cm-people-mod ${where}`}><div className="cm-mod__head"><h2 className="cm-mod__tab">People to follow</h2></div><ul className="ay-group cm-mod__list">{list.map((p) => <li key={p.user_id} className="cm-mod-person"><button type="button" className="cm-suggest-who" onClick={() => openProfile(p.username)}><Avatar size={32} name={p.display_name || p.username} path={p.avatar_url} /><span><strong>{p.display_name || p.username}</strong><small>@{p.username}</small><TeamTag title={badgeFor(p.user_id)} /></span></button><button type="button" className="ay-btn ay-btn--secondary cm-small" onClick={() => toggleFollow(p.user_id)}>Follow</button></li>)}</ul></section>;
  };

  let main;
  if (page?.type === 'post' && details) {
    main = <>
      {renderPost(details, true)}
      <h2 className="cm-h2">Replies</h2>
      {comments.length === 0 && <>{REPLY_BOX}{replyEmpty}</>}
      {comments.map((c) => <div className="cm-comment" key={c.id}>
        <header><Avatar size={30} name={c.author_display_name || c.author_username} path={!c.is_anonymous && c.author_id ? profileById.get(c.author_id)?.avatar_url : null} anonymous={c.is_anonymous || !c.author_id} /><strong>{c.is_anonymous || !c.author_id ? 'Anonymous' : c.author_display_name || c.author_username}</strong><TeamTag title={badgeFor(c.author_id, c.is_anonymous)} /><small>{timeLabel(c.created_at)}</small></header>
        <p>{c.body}</p>
        {c.product_id && <Mention productId={c.product_id} productsById={productsById} quizResults={quizResults} healthProfile={healthProfile} matchOpts={matchOpts} onOpenProduct={onOpenProduct} onSeeMatch={seeMatch} />}
        <button type="button" className="ct-link cm-link" onClick={() => setReplyTo(c.id)}>Reply</button>
      </div>)}
      {comments.length > 0 && REPLY_BOX}
    </>;
  } else if (page?.type === 'playlist' && details) {
    const mine = user?.id === details.owner_id;
    const canEdit = community.canEditPlaylist(details, user?.id, collab.rows);
    const count = details.item_count ?? items.length;
    const addable = products.filter((p) => !items.some((s) => String(s.product_id) === String(p.id)));
    const deletePl = async () => { setBusy(true); try { await community.deletePlaylist(supabase, details.id); closePage(); setRefresh((v) => v + 1); setNotice('Playlist deleted.'); } catch (e) { notifyError(e); } finally { setBusy(false); } };
    const removeItem = async (pid) => { setBusy(true); try { await community.removeFromPlaylist(supabase, details.id, pid); await refreshPlaylist(details.id); } catch (e) { notifyError(e); } finally { setBusy(false); } };
    const addItem = async () => { setBusy(true); try { await community.addToPlaylist(supabase, details.id, productId); await refreshPlaylist(details.id); setProductId(null); } catch (e) { notifyError(e); } finally { setBusy(false); } };
    const reloadCollab = () => community.listPlaylistCollaborators(supabase, details.id).then(setCollab).catch(() => {});
    const addCollaborator = async (uid) => { setBusy(true); try { await community.addPlaylistCollaborator(supabase, details.id, uid); await reloadCollab(); } catch (e) { notifyError(e); } finally { setBusy(false); } };
    const removeCollaborator = async (uid) => { setBusy(true); try { await community.removePlaylistCollaborator(supabase, details.id, uid); if (uid === user?.id) { closePage(); setRefresh((v) => v + 1); setNotice('You left the playlist.'); } else await reloadCollab(); } catch (e) { notifyError(e); } finally { setBusy(false); } };
    const makeInvite = async () => { try { const code = await community.getPlaylistInviteCode(supabase, details.id); const link = code ? community.playlistInviteLink(code) : null; if (link) setInviteLink(link); else setError('Shared playlists aren’t switched on yet.'); } catch (e) { notifyError(e); } };
    const collaborators = collab.rows.map((c) => profileById.get(c.user_id) || friendProfiles.find((f) => f.user_id === c.user_id) || { user_id: c.user_id });
    const invitable = friendProfiles.filter((f) => f.user_id !== details.owner_id && !collab.rows.some((c) => c.user_id === f.user_id));
    const addedBy = (it) => (it.added_by && it.added_by !== details.owner_id ? (collaborators.find((c) => c.user_id === it.added_by)?.display_name || null) : null);
    main = <section className="cm-pl-detail">
      <div className="cm-pl-hero"><PlaylistCover playlist={{ ...details, preview_product_ids: details.preview_product_ids || items.map((it) => it.product_id) }} productsById={productsById} big />
        <div className="cm-pl-hero-copy">
          <span className="cm-pl-kicker">{collab.rows.length || details.is_collaborator ? 'Shared playlist' : 'Playlist'}</span>
          <h1 className="ay-h1">{details.title}</h1>
          {details.description && <p>{details.description}</p>}
          <small>{count} {count === 1 ? 'product' : 'products'}{details.owner_display_name ? ` · by ${details.owner_display_name}` : ''}{collaborators.length ? ` with ${collaborators.map((c) => c.display_name || (c.username ? `@${c.username}` : 'a friend')).join(', ')}` : ''}</small>
        </div>
      </div>
      <ul className="ay-group cm-pl-list" aria-label="Products in this playlist">
        {items.map((it) => <li key={it.product_id} className="cm-pl-row">
          <Mention productId={it.product_id} productsById={productsById} quizResults={quizResults} healthProfile={healthProfile} matchOpts={matchOpts} onOpenProduct={onOpenProduct} onSeeMatch={seeMatch} />
          {addedBy(it) && <small className="cm-pl-by">Added by {addedBy(it)}</small>}
          {canEdit && <button type="button" className="ct-link cm-pl-remove" disabled={busy} onClick={() => removeItem(it.product_id)} aria-label={`Remove ${productsById.get(String(it.product_id))?.name || customProductName(String(it.product_id)) || 'product'}`}>Remove</button>}
        </li>)}
        {canEdit && <li className="cm-pl-add">
          <Picker products={addable} value={productId} onChange={setProductId} placeholder="Add a product" />
          <button type="button" className="ay-btn ay-btn--secondary cm-small" disabled={busy || !productId} onClick={addItem}>Add</button>
        </li>}
      </ul>
      {items.length === 0 && !canEdit && <p className="cm-muted">No products added yet.</p>}
      {collab.available && (mine || canEdit) && <section className="cm-pl-people" aria-labelledby="cm-pl-people-h">
        <h2 id="cm-pl-people-h" className="ay-h3">Who can add</h2>
        <ul className="ay-group cm-pl-list">
          <li className="cm-pl-row"><span className="cm-person"><Avatar size={32} name={details.owner_display_name || 'Owner'} /><span><strong>{details.owner_display_name || 'Owner'}</strong><small>Made it</small></span></span></li>
          {collaborators.map((c) => <li key={c.user_id} className="cm-pl-row"><span className="cm-person"><Avatar size={32} name={c.display_name || c.username || 'Friend'} path={c.avatar_url} /><span><strong>{c.display_name || (c.username ? `@${c.username}` : 'A friend')}</strong><small>Can add and remove products</small></span></span>
            {mine && <button type="button" className="ct-link" disabled={busy} onClick={() => removeCollaborator(c.user_id)}>Remove</button>}
            {!mine && c.user_id === user?.id && <button type="button" className="ct-link" disabled={busy} onClick={() => removeCollaborator(c.user_id)}>Leave</button>}
          </li>)}
          {mine && invitable.map((f) => <li key={f.user_id} className="cm-pl-row"><span className="cm-person"><Avatar size={32} name={f.display_name || f.username} path={f.avatar_url} /><span><strong>{f.display_name || f.username}</strong><small>Friend</small></span></span><button type="button" className="ay-btn ay-btn--secondary cm-small" disabled={busy} onClick={() => addCollaborator(f.user_id)}>Invite to add</button></li>)}
        </ul>
        {mine && <div className="cm-pl-invite">{inviteLink ? <><input readOnly value={inviteLink} aria-label="Invite link" onFocus={(e) => e.currentTarget.select()} /><button type="button" className="ay-btn ay-btn--secondary cm-small" onClick={() => { navigator.clipboard?.writeText(inviteLink).then(() => toast('Link copied')).catch(() => {}); }}>Copy link</button></> : <button type="button" className="ct-link" onClick={makeInvite}>Get an invite link</button>}</div>}
      </section>}
      {mine && <div className="cm-pl-owner"><button type="button" className="ct-link is-danger" disabled={busy} onClick={deletePl}>Delete playlist</button></div>}
    </section>;
  } else if (page?.type === 'topic') {
    main = <TopicPage variant="web" supabase={supabase} user={user} topicId={page.id} refreshKey={refresh} renderPost={(p, i) => renderPost(p, false, i)}
      onCompose={(t) => { setPostTopicId(t.id); openCompose('post'); }} onRequireAuth={requireAccount} onShowRules={openRules}
      onDeleted={openTopics} onTopicsChanged={userTopics.reload} toast={toast} />;
  } else if (page?.type === 'topics') {
    main = <TopicDirectory variant="web" supabase={supabase} user={user} refreshKey={refresh} onOpen={openTopic} onCreate={() => setStartTopic(true)}
      onSuggest={() => setSuggestTopic(true)} onRequireAuth={requireAccount} onTopicsChanged={userTopics.reload} />;
  } else if (page?.type === 'profile') {
    const own = Boolean(user && details && (details.user_id === user.id || (profile && details.user_id === profile.user_id)));
    const countLabel = (n) => (n >= PROFILE_LIST_MAX ? `${PROFILE_LIST_MAX}+` : String(n));
    const counts = details ? [
      ['Posts', countLabel(profilePosts.length)],
      ['Playlists', countLabel(profilePlaylists.length)],
      ...(profileStats ? [['Followers', String(profileStats.followers ?? 0)], ['Following', String(profileStats.following ?? 0)]] : []),
    ] : [];
    main = !details ? (profileLoading ? <div className="cm-prof-skel" aria-busy="true" aria-label="Loading profile"><span className="cm-skel-dot is-big" /><div><span className="cm-skel-line is-mid" /><span className="cm-skel-line is-short" /></div></div> : <div className="cm-empty"><h2>We couldn’t find {page?.id ? `@${page.id}` : 'that member'}</h2><p>The handle may have changed, or the profile was removed.</p><button type="button" className="ay-btn ay-btn--primary" onClick={closePage}>Back to Community</button></div>) : <section className="cm-profile">
      <div className="cm-prof-hero">
        <Avatar size={88} name={details.display_name} path={details.avatar_url} />
        <div className="cm-prof-id">
          <h1 className="ay-h1">{details.display_name || details.username}</h1>
          <small className="cm-prof-handle">@{details.username}</small>
          <TeamTag title={badgeFor(details.user_id)} />
          {details.bio && <p className="cm-prof-bio">{details.bio}</p>}
          {!details.bio && own && <button type="button" className="cm-prof-bio is-empty" onClick={startEditProfile}>+ Add a short bio so people know what you’re into</button>}
        </div>
      </div>
      <ul className="cm-prof-counts">{counts.map(([l, v]) => <li key={l}><button type="button" onClick={() => {
        if (l === 'Followers') openPeopleList('followers', details.user_id);
        else if (l === 'Following') openPeopleList('following', details.user_id);
        else document.getElementById(l === 'Posts' ? 'cm-prof-posts' : 'cm-prof-playlists')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }}><strong>{v}</strong><span>{l}</span></button></li>)}</ul>
      {own && !editingProfile && <div className="cm-row"><button type="button" className="ay-btn ay-btn--secondary" onClick={startEditProfile}>Edit profile</button></div>}
      {own && editingProfile && <form className="ay-group is-padded cm-prof-edit" onSubmit={(e) => { e.preventDefault(); saveProfileEdits(); }}>
        <h3>Edit profile</h3>
        <label className="cm-field"><span>Display name</span><RuleField as="input" value={editName} maxLength={50} onChange={(e) => setEditName(e.target.value)} required onShowRules={openRules} /></label>
        <label className="cm-field"><span>Username</span><input value={editHandle} maxLength={24} autoCapitalize="none" onChange={(e) => setEditHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} required /></label>
        <label className="cm-field"><span>Bio</span><RuleField autoGrow minRows={2} value={editBio} maxLength={BIO_MAX} onChange={(e) => setEditBio(e.target.value)} placeholder="A little about you" onShowRules={openRules} /><CharRing length={editBio.length} max={BIO_MAX} className="ay-ring cm-ring is-reply" /></label>
        <div className="cm-row"><button type="submit" className="ay-btn ay-btn--primary" disabled={busy || !editName.trim() || !editHandle.trim() || breaksCommunityRules(editName, editBio)}>{busy ? 'Saving…' : 'Save'}</button><button type="button" className="ay-btn ay-btn--secondary" onClick={() => setEditingProfile(false)}>Cancel</button></div>
      </form>}
      {!own && user && (() => {
        const id = details.user_id;
        const following = followingIds.includes(id);
        const fs = community.friendshipState(friendships, user.id, id);
        const who = details.display_name || details.username;
        if (isBlocked(id)) return <div className="cm-row cm-rel"><span className="cm-rel-state">Blocked</span><button type="button" className="ay-btn ay-btn--secondary" disabled={busy} onClick={() => setBlock(details, false)}>Unblock</button></div>;
        const friendAction = async (fn) => { try { await fn(); setRefresh((v) => v + 1); } catch (e) { notifyError(e); } };
        return <div className="cm-row cm-rel">
          {/* Relationship states read as text; actions stay buttons. Undoing one lives in the ⋯ menu. */}
          {following ? <span className="cm-rel-state">✓ Following</span> : <button type="button" className="ay-btn ay-btn--primary" onClick={() => toggleFollow(id)}>Follow</button>}
          {fs.state === 'friends' && <span className="cm-rel-state">✓ Friends</span>}
          {fs.state === 'requested' && <span className="cm-rel-state">Friend request sent</span>}
          {fs.state === 'none' && <button type="button" className="ay-btn ay-btn--secondary" onClick={() => friendAction(() => community.sendFriendRequest(supabase, user.id, id))}>Add friend</button>}
          {fs.state === 'incoming' && <button type="button" className="ay-btn ay-btn--secondary" onClick={() => friendAction(() => community.acceptFriendRequest(supabase, fs.row.id))}>Accept friend request</button>}
          <details className="cm-rel-menu">
            <summary aria-label={`More options for ${who}`}>⋯</summary>
            <div className="cm-rel-list" role="menu">
              {following && <button type="button" role="menuitem" onClick={(e) => { e.currentTarget.closest('details').open = false; toggleFollow(id); }}>Unfollow</button>}
              {fs.state === 'friends' && <button type="button" role="menuitem" onClick={(e) => { e.currentTarget.closest('details').open = false; removeFriend(fs.row); }}>Remove friend</button>}
              {fs.state === 'requested' && <button type="button" role="menuitem" onClick={(e) => { e.currentTarget.closest('details').open = false; removeFriend(fs.row); }}>Cancel friend request</button>}
              <button type="button" role="menuitem" onClick={(e) => { e.currentTarget.closest('details').open = false; setBlockTarget(details); }}>Block</button>
              <button type="button" role="menuitem" onClick={(e) => { e.currentTarget.closest('details').open = false; setReportReason('harassment'); setReportUser(details); }}>Report</button>
            </div>
          </details>
        </div>;
      })()}
      {!user && <div className="cm-row"><button type="button" className="ay-btn ay-btn--primary" onClick={() => requireAccount('following people')}>Follow</button></div>}
      {own && <>
        <h2 className="cm-h2" id="cm-prof-friends">Friends <span className="ct-shelf__count">{friendProfiles.length}</span></h2>
        {friendProfiles.length ? <ul className="ay-group cm-friends">{friendProfiles.map((f) => <li key={f.user_id}><button type="button" className="cm-suggest-who" onClick={() => openProfile(f.username)}><Avatar size={32} name={f.display_name || f.username} path={f.avatar_url} /><span><strong>{f.display_name || f.username}</strong><small>@{f.username}</small></span></button></li>)}</ul>
          : <p className="cm-muted">No friends yet. Open someone’s profile and tap Add friend.</p>}
      </>}
      <h2 className="cm-h2" id="cm-prof-playlists">Playlists</h2>
      {profilePlaylists.length ? <div className="cm-pl-grid">{profilePlaylists.map(playlistCard)}</div> : <p className="cm-muted">No playlists shared yet.</p>}
      <h2 className="cm-h2" id="cm-prof-posts">Posts</h2>
      {isBlocked(details.user_id) ? <p className="cm-muted">You blocked this person, so their posts are hidden.</p> : profilePosts.length ? profilePosts.map((p) => renderPost(p)) : <p className="cm-muted">No posts shared yet.</p>}
    </section>;
  } else if (search) {
    const sr = searchResults ? { ...searchResults, posts: searchResults.posts.filter((p) => !isBlocked(p.author_id)), people: searchResults.people.filter((p) => !isBlocked(p.user_id)) } : null;
    const head = (label, n) => <h2 className="cm-h2 cm-sr-h">{label} <span className="cm-sr-n">{n}</span></h2>;
    main = search.trim().length < 2 ? <p className="cm-muted">Type at least two letters to search Community.</p> : !sr ? <p className="cm-muted">Searching…</p> : <div className="cm-sr" aria-live="polite">
      <p className="cm-sr-sum">{sr.people.length + sr.posts.length + sr.playlists.length} results for “{search.trim()}”</p>
      <section aria-label="People">{head('People', sr.people.length)}{sr.people.length ? <div className="cm-people">{sr.people.map((p) => <button type="button" key={p.user_id} onClick={() => openProfile(p.username)}><Avatar name={p.display_name} path={p.avatar_url} /><span>{p.display_name}<small>@{p.username}</small><TeamTag title={badgeFor(p.user_id)} /></span></button>)}</div> : <p className="cm-muted">No people match.</p>}</section>
      <section aria-label="Posts">{head('Posts', sr.posts.length)}{sr.posts.length ? sr.posts.map((p) => renderPost(p)) : <p className="cm-muted">No posts match.</p>}</section>
      <section aria-label="Playlists">{head('Playlists', sr.playlists.length)}{sr.playlists.length ? <div className="cm-pl-grid">{sr.playlists.map(playlistCard)}</div> : <p className="cm-muted">No playlists match.</p>}</section>
    </div>;
  } else {
    const switchSection = (k) => {
      if (k !== 'recent' && !user) { requireAccount('your playlists'); return; }
      if (k !== playlistSection) setPlaylists([]);
      setPlaylistSection(k);
    };
    const firstLoad = loading && (tab === 'playlists' ? playlists.length === 0 : posts.length === 0);
    main = tab === 'announcements' ? <Announcements supabase={supabase} user={user} products={products} productsById={productsById} loadArticles={loadArticles} teamBadges={teamBadges} variant="web" onOpenProduct={onOpenProduct} onOpenPlaylist={openPlaylistById} onOpenArticle={onOpenArticle} onOpenProfile={openProfile} onRequireAuth={requireAccount} onShowRules={openRules} /> : <>
      {tab === 'playlists' ? <>
        <div className="cm-row is-split cm-subbar"><div className="cm-seg cm-plswitch" role="group" aria-label="Show playlists from">{[['recent', 'Community'], ['friends', 'Friends'], ['mine', 'My playlists']].map(([k, l]) => <button type="button" key={k} aria-pressed={playlistSection === k} onClick={() => switchSection(k)}>{l}</button>)}</div><button type="button" className="ay-btn ay-btn--primary" onClick={() => openCompose('playlist')}>Create playlist</button></div>
        {firstLoad ? <SkeletonPlaylists /> : playlists.length ? <div className="cm-pl-grid">{playlists.map(playlistCard)}</div> : <div className="cm-empty"><h2>{playlistSection === 'mine' ? 'You haven’t made a playlist yet' : playlistSection === 'friends' ? 'No playlists from friends yet' : 'No playlists yet'}</h2><p>Collect your favorites in one place.</p><button type="button" className="ay-btn ay-btn--primary" onClick={() => openCompose('playlist')}>Create playlist</button></div>}
      </> : <>
        {tab === 'for-you' && pinnedAnn && <button type="button" className={`cm-pinned-ann ay-group${newAnns.some((a) => a.id === pinnedAnn.id) ? ' is-new' : ''}`} onClick={() => switchTab('announcements')}>
          <KindLabel kind="announcements">{newAnns.some((a) => a.id === pinnedAnn.id) ? 'New from ayna' : 'From ayna'}</KindLabel>
          <strong>{pinnedAnn.title}</strong>
          <span className="cm-pinned-ann__go">Read the announcement <span aria-hidden="true">→</span></span>
        </button>}
        {firstLoad ? <div className="cm-skel-list" aria-busy="true" aria-label="Loading posts"><SkeletonPost /><SkeletonPost i={1} /><SkeletonPost i={2} /></div> : visiblePosts.map((p, i) => <Fragment key={p.id}>
          {renderPost(p, false, i)}
          {i === quoteSlot && tab === 'for-you' && quoteBlock('is-inline')}
          {i === 5 && tab === 'for-you' && peopleBlock('is-inline')}
        </Fragment>)}
        {!loading && posts.length === 0 && (tab === 'following' ? <div className="cm-empty">
          {(() => {
            const named = followingIds.map((id) => profileById.get(id)).filter(Boolean).slice(0, 3);
            if (!followingIds.length) return <><h2>You’re not following anyone yet</h2><p>Your feed gets better when you follow topics and people you care about.</p></>;
            if (!named.length) return <><h2>People you follow haven’t posted yet</h2><p>Their posts will show up here.</p></>;
            const extra = followingIds.length - named.length;
            return <><h2>{named.map((p, i) => <Fragment key={p.user_id}>{i > 0 && (i === named.length - 1 && !extra ? ' and ' : ', ')}<button type="button" className="cm-inline-name" onClick={() => openProfile(p.username)}>{p.display_name || p.username}</button></Fragment>)}{extra > 0 ? ` and ${extra} more` : ''} {named.length + Math.max(extra, 0) === 1 ? 'hasn’t' : 'haven’t'} posted yet</h2><p>Their posts will show up here.</p></>;
          })()}
          <button type="button" className="ay-btn ay-btn--primary" onClick={() => { const el = document.querySelector('.cm-search input'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus({ preventScroll: true }); } }}>Find people</button>
          {suggestedPeople.length > 0 && <ul className="cm-suggest" aria-label="People to follow">{suggestedPeople.map((p) => <li key={p.user_id}>
            <button type="button" className="cm-suggest-who" onClick={() => openProfile(p.username)}><Avatar name={p.display_name || p.username} path={p.avatar_url} /><span><strong>{p.display_name || p.username}</strong><small>@{p.username}</small></span></button>
            <button type="button" className="ay-btn ay-btn--secondary cm-small" onClick={() => toggleFollow(p.user_id)}>Follow</button>
          </li>)}</ul>}
        </div> : <div className="cm-empty"><h2>{tab === 'question' ? 'No questions yet' : tab === 'review' ? 'No reviews yet' : 'No posts yet'}</h2><p>{tab === 'review' && ownedProducts.length ? 'Review something in your ecosystem:' : 'Be the first.'}</p>
          {tab === 'review' && ownedProducts.length > 0 && <ul className="cm-review-own">{ownedProducts.map((p) => <li key={p.id}><button type="button" className="ay-btn ay-btn--secondary cm-small" onClick={() => { setProductId(p.id); openCompose('review'); }}>{p.brand ? `${p.brand} ` : ''}{p.name}</button></li>)}</ul>}<button type="button" className="ay-btn ay-btn--primary" onClick={() => openCompose(tab === 'question' ? 'question' : tab === 'review' ? 'review' : 'post')}>{tab === 'question' ? 'Ask a question' : tab === 'review' ? 'Write a review' : 'Share a post'}</button></div>)}
        {cursor && <button type="button" className="ay-btn ay-btn--secondary cm-more-btn" disabled={loading} onClick={loadMore}>{loading ? 'Loading…' : 'Show more posts'}</button>}
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

  const tabList = <div className="cm-folders" data-tour="community-tabs" role="tablist" aria-label="Community feeds">{TABS.map(([k, l]) => <button type="button" role="tab" key={k} aria-selected={onFeed && tab === k} className={`cm-folder is-${k}`} onClick={() => switchTab(k)}>
    <svg className="cm-folder__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{TAB_ICONS[k]}</svg>
    <span>{l}</span>{k === 'announcements' && newAnns.length > 0 && <b className="cm-folder__new">{newAnns.length} new</b>}
  </button>)}</div>;
  const topicChips = (where) => <div className={`cm-topicset ${where}`}>
    {topics.map((t) => <button type="button" className="cm-topic" key={t} onClick={() => { if (page) closePage(); setSearch(t); setSearchResults(null); }}>#{t}</button>)}
    {userTopics.available && where === 'is-row' && <button type="button" className="cm-topic" onClick={openTopics}>Topics by members</button>}
    <button type="button" className="cm-topic is-suggest" onClick={() => setSuggestTopic(true)}><Icon name="plus" size={14} />Suggest a topic</button>
  </div>;

  return <section className="ct cm ay-container" data-tour="community">
    {/* Butter title row (Community audit, issue 2): title, search, one Post button. */}
    <header className={`cm-head${page ? ' is-page' : ' cm-titlerow'}`}>
      {page ? <BackLink className="cm-back" label="Community" href="/community" onClick={closePage} />
        : <div className="cm-head__title"><h1 className="ay-h1 cm-title">Community</h1><p className="ct-lede">Ask, review, share. Real talk between women, about the products we actually use.</p></div>}
      <div className="cm-head__actions">
        <label className="ct-search cm-search"><Icon name="search" size={20} /><input ref={searchRef} value={search} onChange={(e) => { setSearch(e.target.value); setSearchResults(null); if (page) closePage(); }} placeholder={narrowSearch ? 'Search' : 'Search people, posts, playlists'} aria-label="Search community" aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'} />{search ? <button type="button" className="cm-search__clear" aria-label="Clear search" onClick={() => { setSearch(''); setSearchResults(null); searchRef.current?.focus(); }}>×</button> : <kbd className="cm-kbd" aria-hidden="true">{isMac ? '⌘K' : 'Ctrl K'}</kbd>}</label>
        {user && <button type="button" className="cm-iconbtn cm-bell" onClick={openUpdates} aria-label={unreadCount + newAnns.length ? `Updates, ${unreadCount + newAnns.length} new` : 'Updates'}><Icon name="bell" size={20} />{unreadCount + newAnns.length > 0 && <span className="cm-bell-dot" aria-hidden="true">{unreadCount + newAnns.length > 9 ? '9+' : unreadCount + newAnns.length}</span>}</button>}
        <button type="button" className="ay-btn ay-btn--primary cm-post-btn" data-tour="community-compose" onClick={openPostTypes}><Icon name="plus" size={18} />Post</button>
        {user && <button type="button" className="cm-iconbtn cm-head-me" onClick={openMe} aria-label={profile ? 'Your Community profile' : 'Set up your Community profile'}><Avatar size={44} name={profile?.display_name || 'You'} path={profile?.avatar_url} /></button>}
      </div>
    </header>
    {error && <p className="cm-error" role="alert">{error}</p>}
    {notice && <p className="cm-notice" role="status">{notice}</p>}
    <div className={`cm-layout${page?.type === 'profile' ? ' is-profile' : ''}`}>
      <nav className="cm-rail" aria-label="Community">
        <div className="cm-navrow">{tabList}<button type="button" className="cm-topics-btn" aria-haspopup="dialog" onClick={() => setTopicsSheet(true)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M7 12h10M10 17h4" /></svg>Topics{onFeed && topicsTab && topicScope !== 'all' ? <span className="cm-topics-btn__on">{topicScope === 'mine' ? 'Mine' : topicLabel(topicScope)}</span> : null}</button></div>
        <div className="cm-rail__more">
          {user && profile && <button type="button" className="cm-me" onClick={() => openProfile(profile.username)}><Avatar size={36} name={profile.display_name || 'You'} path={profile.avatar_url} /><span><strong>{profile.display_name || 'You'}</strong><small>@{profile.username}</small></span></button>}
          <h2 className="cm-rail__h">Topics</h2>
          {topicChips('is-rail')}
          {userTopics.available && <div className="ut-rail">
            <h2 className="cm-rail__h">Topics by members</h2>
            <MyTopicRows topics={userTopics.mine} activeId={page?.type === 'topic' ? page.id : null} onOpen={openTopic} />
            <div className="ut-rail__links">
              <button type="button" className="ct-link" onClick={openTopics}>Browse topics</button>
              <button type="button" className="ct-link" onClick={() => (user ? setStartTopic(true) : requireAccount('starting a topic'))}>Start a topic</button>
            </div>
          </div>}
          <button type="button" className="ct-link cm-rules-btn" onClick={openRules}>Community rules</button>
        </div>
      </nav>
      <div className="cm-main">
        {onFeed && topicsTab && <div className="cm-topicset cm-pods" role="group" aria-label="Filter posts by topic">
          {followedTopics.length > 0 && <button type="button" className="cm-topic" aria-pressed={topicScope === 'mine'} onClick={() => setTopicScope('mine')}>My topics</button>}
          <button type="button" className="cm-topic" aria-pressed={topicScope === 'all'} onClick={() => setTopicScope('all')}>All</button>
          {followedTopics.map((key) => <button type="button" key={key} className="cm-topic" aria-pressed={topicScope === key} onClick={() => setTopicScope(topicScope === key ? 'mine' : key)}>{topicLabel(key)}</button>)}
          <button type="button" className="cm-topic is-suggest" onClick={() => setTopicSheetOpen(true)}>{followedTopics.length ? 'Edit topics' : 'Follow topics'}</button>
        </div>}
        {onFeed && topicsTab && scopedTopicList && !loading && posts.length === 0 && <div className="ay-group is-padded cm-topic-empty"><p className="cm-muted">{topicScope === 'mine' ? 'Nothing in your topics yet. New posts tagged with them show up here.' : `No ${topicLabel(topicScope)} posts yet.`}</p><button type="button" className="ay-btn ay-btn--secondary cm-small" onClick={() => setTopicScope('all')}>See all posts</button></div>}
        {onFeed && (topics.length > 0 || userTopics.available) && tab !== 'announcements' && tab !== 'playlists' && topicChips('is-row')}
        {user && !profile && profileChecked ? <div className="ay-group is-padded cm-join"><h2 className="ay-h3">Join the community</h2><p className="cm-muted">Pick a name people will see. Your health answers stay private.</p>
          <div className="cm-join__fields">
            <RuleField as="input" value={profileName} maxLength={50} onChange={(e) => setProfileName(e.target.value)} placeholder="Display name" aria-label="Display name" onShowRules={openRules} />
            <RuleField as="input" value={profileHandle} maxLength={30} onChange={(e) => setProfileHandle(e.target.value.toLowerCase())} placeholder="Username" aria-label="Username" onShowRules={openRules} />
          </div>
          <button type="button" className="ay-btn ay-btn--primary" disabled={busy || !profileName.trim() || !profileHandle.trim() || breaksCommunityRules(profileName, profileHandle)} onClick={saveProfile}>Create profile</button></div>
          : !user && onFeed ? <div className="cm-guest"><p><strong>Join the conversation.</strong> Reading is open to everyone. An account lets you post, reply and follow people.</p><button type="button" className="ay-btn ay-btn--primary" onClick={() => requireAccount('posting in Community')}>Join or sign in</button></div> : null}
        {main}
        <button type="button" className="ct-link cm-rules-foot" onClick={openRules}>Community rules</button>
      </div>
      <aside className="cm-side" aria-label="More from Community">
        {onFeed && tab === 'for-you' && quoteBlock('is-side')}
        {questionsSide.length > 0 && <section className="cm-mod"><div className="cm-mod__head"><h2 className="cm-mod__tab">Recent questions</h2>{!(onFeed && tab === 'question') && <button type="button" className="ct-shelf__all cm-seeall" onClick={() => switchTab('question')} aria-label="See all questions">See all</button>}</div><ul className="ay-group cm-mod__list">{questionsSide.map((q) => <li key={q.id}><button type="button" className="cm-mod-q" onClick={() => openPost(q)}><span>{q.body}</span><small>{Number(q.comment_count) ? `${q.comment_count} ${Number(q.comment_count) === 1 ? 'answer' : 'answers'}` : 'No answers yet'}</small></button></li>)}</ul></section>}
        {playlistsSide.length > 0 && <section className="cm-mod"><div className="cm-mod__head"><h2 className="cm-mod__tab">Playlists</h2>{!(onFeed && tab === 'playlists') && <button type="button" className="ct-shelf__all cm-seeall" onClick={() => switchTab('playlists')} aria-label="See all playlists">See all</button>}</div><ul className="ay-group cm-mod__list">{playlistsSide.map((p) => <li key={p.id}><button type="button" className="cm-mod-pl" onClick={() => openPlaylist(p)}><PlaylistCover playlist={p} productsById={productsById} /><span><strong>{p.title}</strong><small>{p.item_count || 0} {(p.item_count || 0) === 1 ? 'product' : 'products'} · {p.owner_display_name || 'ayna community'}</small></span></button></li>)}</ul></section>}
        {peopleBlock('is-side')}
      </aside>
    </div>

    {composeSheet}
    {typeSheet && <Sheet title="Share with the community" onClose={() => setTypeSheet(false)} className="cm-types-sheet">
      <ul className="cm-types">{POST_TYPES.map(([k, l, hint]) => <li key={k}><button type="button" className="cm-type" onClick={() => { setTypeSheet(false); openCompose(k); }}>
        <span className="cm-type__icon"><TypeIcon kind={k} size={20} /></span><span className="cm-type__copy"><strong>{l}</strong><small>{hint}</small></span>
      </button></li>)}</ul>
      <div className="cm-group cm-starters"><p className="cm-label">Or start with</p><div className="cm-seg">{PROMPTS.filter((pr) => pr.starter).map((pr) => <button type="button" key={pr.key} onClick={() => { setTypeSheet(false); openCompose(pr.kind, pr); }}>{pr.title}</button>)}</div></div>
    </Sheet>}
    {topicsSheet && <Sheet title="Topics" onClose={() => setTopicsSheet(false)} className="cm-topics-sheet">
      {topicsTab && <section className="cm-group"><h3 className="cm-label">Show</h3><div className="cm-topicset is-grid">
        {followedTopics.length > 0 && <button type="button" className="cm-topic" aria-pressed={topicScope === 'mine'} onClick={() => { setTopicScope('mine'); setTopicsSheet(false); }}>My topics</button>}
        <button type="button" className="cm-topic" aria-pressed={topicScope === 'all'} onClick={() => { setTopicScope('all'); setTopicsSheet(false); }}>All</button>
        {followedTopics.map((key) => <button type="button" key={key} className="cm-topic" aria-pressed={topicScope === key} onClick={() => { setTopicScope(key); setTopicsSheet(false); }}>{topicLabel(key)}</button>)}
      </div></section>}
      <section className="cm-group"><button type="button" className="ay-btn ay-btn--secondary" onClick={() => { setTopicsSheet(false); setTopicSheetOpen(true); }}>{followedTopics.length ? 'Edit topics you follow' : 'Follow topics'}</button></section>
      {topics.length > 0 && <section className="cm-group"><h3 className="cm-label">Talked about now</h3><div className="cm-topicset is-grid">{topics.map((t) => <button type="button" className="cm-topic" key={t} onClick={() => { setTopicsSheet(false); if (page) closePage(); setSearch(t); setSearchResults(null); }}>#{t}</button>)}</div></section>}
      <section className="cm-group cm-topics-links">
        {userTopics.available && <button type="button" className="ct-link" onClick={() => { setTopicsSheet(false); openTopics(); }}>Topics by members</button>}
        <button type="button" className="ct-link" onClick={() => { setTopicsSheet(false); setSuggestTopic(true); }}>Suggest a topic</button>
        <button type="button" className="ct-link" onClick={() => { setTopicsSheet(false); switchTab('announcements'); }}>Announcements from ayna</button>
      </section>
    </Sheet>}
    {showUpdates && <Sheet title="Updates" className="cm-updates" onClose={() => setShowUpdates(false)}>
      {!notifications ? <div className="cm-skel-list" aria-busy="true" aria-label="Loading updates"><span className="cm-skel-line" /><span className="cm-skel-line is-mid" /></div>
        : notifications.length ? (() => {
          // People, not system strings: "Eliz accepted your friend request".
          const VERBS = { follow: 'followed you', followed: 'followed you', friend_accepted: 'accepted your friend request', friend_request: 'sent you a friend request', comment: 'replied to your post', reply: 'replied to you', reaction: 'found your post helpful', helpful: 'found your post helpful', recommendation: 'recommended a product to you', recommend: 'recommended a product to you', mention: 'mentioned you' };
          // Calendar days in her own time zone (a 24-hour window put yesterday under Today).
          const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
          const t0 = startToday.getTime(); const week = t0 - 6 * 86400000;
          const group = (n) => { const t = new Date(n.created_at).getTime(); return t >= t0 ? 'Today' : t >= week ? 'This week' : 'Earlier'; };
          const items = notifications.slice(0, 20);
          return ['Today', 'This week', 'Earlier'].map((g) => {
            const list = items.filter((n) => group(n) === g);
            if (!list.length) return null;
            return <div key={g} className="cm-notes-group"><h3 className="cm-notes-h">{g}</h3><ul className="cm-notes">{list.map((n) => {
              const who = n.actor?.display_name || (n.actor?.username ? `@${n.actor.username}` : 'Someone');
              const verb = VERBS[String(n.type || '').toLowerCase()];
              const text = verb ? `${who} ${verb}` : (n.message || n.body || `${who}: ${String(n.type || 'update').replace(/_/g, ' ')}`);
              if (n.type === 'announcement') return <li key={n.id} className={n.isNew ? 'is-new' : undefined}>
                <Avatar size={32} name="ayna" />
                <button type="button" className="cm-notes-link" onClick={() => { setShowUpdates(false); switchTab('announcements'); }}>New from ayna: {n.title}</button>
                <small>{timeLabel(n.created_at)}</small>
              </li>;
              return <li key={n.id}>
                <Avatar size={32} name={String(who).replace('@', '')} path={n.actor?.avatar_url} />
                {(() => {
                  const postId = n.post_id || n.data?.post_id || n.payload?.post_id || null;
                  const aboutPost = postId && /comment|reply|reaction|helpful|mention/i.test(String(n.type || ''));
                  if (aboutPost) return <button type="button" className="cm-notes-link" onClick={async () => { setShowUpdates(false); try { const post = await community.getFeedPost(supabase, postId); if (post) openPost(post); } catch (e) { notifyError(e); } }}>{text}</button>;
                  if (n.actor?.username) return <button type="button" className="cm-notes-link" onClick={() => { setShowUpdates(false); openProfile(n.actor.username); }}>{text}</button>;
                  return <span>{text}</span>;
                })()}
                <small>{timeLabel(n.created_at)}</small>
              </li>;
            })}</ul></div>;
          });
        })()
        : <p className="cm-muted">You’re all caught up.</p>}
    </Sheet>}
    {startTopic && <TopicEditor variant="web" supabase={supabase} user={user} onShowRules={openRules} onClose={() => setStartTopic(false)}
      onSaved={(t) => { setStartTopic(false); userTopics.reload(); toast(t?.status === 'pending' ? 'Topic started. It shows in Community once the ayna team has checked it.' : 'Topic started'); if (t?.id) openTopic(t); }} />}
    {showRules && <Sheet title="Community rules" onClose={() => setShowRules(false)} className="cm-rules-sheet"><CommunityRulesList /><button type="button" className="ay-btn ay-btn--primary" onClick={() => setShowRules(false)}>Got it</button></Sheet>}
    {topicSheetOpen && <Sheet title="Your topics" onClose={() => setTopicSheetOpen(false)}>
      <p className="cm-muted">Follow topics to see their posts in My topics. Change them any time.</p>
      <div className="cm-topicset is-grid">{COMMUNITY_TOPICS.map((t) => { const on = followedTopics.includes(t.key); return <button type="button" key={t.key} className="cm-topic" aria-pressed={on} onClick={() => toggleTopic(t.key)}>{on ? <Icon name="check" size={14} /> : <Icon name="plus" size={14} />}{t.label}</button>; })}</div>
    </Sheet>}
    {suggestTopic && <Sheet title="Suggest a topic" onClose={() => { setSuggestTopic(false); setTopicState('idle'); }}>
      {topicState === 'sent' ? <><p className="cm-muted">Thanks. The team reads every suggestion.</p><button type="button" className="ay-btn ay-btn--primary" data-autofocus onClick={() => { setSuggestTopic(false); setTopicState('idle'); setTopicName(''); setTopicWhy(''); }}>Done</button></> : <>
        <p className="cm-muted">Tell us which topic you want in Community. The team reads every one.</p>
        <section className="cm-group"><label className="cm-label" htmlFor="cm-topic-name">Topic name</label><RuleField as="input" id="cm-topic-name" data-autofocus value={topicName} maxLength={60} onChange={(e) => setTopicName(e.target.value)} placeholder="e.g. Adenomyosis" onShowRules={openRules} /></section>
        <section className="cm-group"><label className="cm-label" htmlFor="cm-topic-why">Why <small>Optional</small></label><RuleField id="cm-topic-why" value={topicWhy} maxLength={500} onChange={(e) => setTopicWhy(e.target.value)} placeholder="What would you want to talk about there?" onShowRules={openRules} /><CharRing length={topicWhy.length} max={500} className="ay-ring cm-ring is-reply" /></section>
        {topicState === 'error' && <p className="cm-error" role="alert">That didn’t send. Try again in a moment.</p>}
        <div className="cm-compose-actions"><button type="button" className="ay-btn ay-btn--primary" disabled={topicState === 'sending' || topicName.trim().length < 2 || breaksCommunityRules(topicName, topicWhy)} onClick={async () => {
          setTopicState('sending');
          // Same anonymous path as the app (api/suggestions.js, kind 'topic'): no name or account sent.
          try {
            const res = await fetchWithTimeout(apiUrl('/api/suggestions'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', body: JSON.stringify({ kind: 'topic', topic: topicName.trim(), reason: topicWhy.trim(), context: 'community', platform: 'web' }) });
            setTopicState(res.ok ? 'sent' : 'error');
          } catch { setTopicState('error'); }
        }}>{topicState === 'sending' ? 'Sending…' : 'Send suggestion'}</button></div>
      </>}
    </Sheet>}
    {likersPost && <Sheet title="Found this helpful" onClose={() => setLikersPost(null)} className="cm-people-sheet cm-likers-sheet">
      <LikersList supabase={supabase} post={likersPost} user={user} friendships={friendships} refreshKey={refresh}
        onRequireAuth={(f) => { setLikersPost(null); requireAccount(f); }}
        onOpenProfile={(handle) => { setLikersPost(null); openProfile(handle); }}
        onAddFriend={async (l) => { try { await community.sendFriendRequest(supabase, user.id, l.userId); setRefresh((v) => v + 1); } catch (e) { notifyError(e); throw e; } }}
        onAcceptFriend={async (l) => { const fs = community.friendshipState(friendships, user.id, l.userId); if (!fs.row) return; try { await community.acceptFriendRequest(supabase, fs.row.id); setRefresh((v) => v + 1); } catch (e) { notifyError(e); throw e; } }} />
      <p className="ay-likers-note">Who viewed a post is never shown.</p>
    </Sheet>}
    {peopleList && <Sheet title={peopleList.title} onClose={() => setPeopleList(null)} className="cm-people-sheet">
      {!peopleList.people ? <p className="cm-muted">Loading…</p> : peopleList.people.length === 0 ? <p className="cm-muted">{peopleList.title === 'Followers' ? 'No followers yet.' : 'Not following anyone yet.'}</p> : <ul className="cm-suggest">{peopleList.people.map((p) => <li key={p.user_id}>
        <button type="button" className="cm-suggest-who" onClick={() => { setPeopleList(null); openProfile(p.username); }}><Avatar name={p.display_name || p.username} path={p.avatar_url} /><span><strong>{p.display_name || p.username}</strong><small>@{p.username}</small></span></button>
        {user && p.user_id !== user.id && (followingIds.includes(p.user_id) ? <span className="cm-rel-state">✓ Following</span> : <button type="button" className="ay-btn ay-btn--secondary cm-small" onClick={() => toggleFollow(p.user_id)}>{peopleList.title === 'Followers' ? 'Follow back' : 'Follow'}</button>)}
      </li>)}</ul>}
    </Sheet>}
    {editPost && <Sheet title={editPost.kind === 'review' ? 'Edit review' : 'Edit post'} onClose={() => setEditPost(null)}>
      {editPost.kind === 'review' && <section className="cm-group">
        <h3 className="cm-label" id="cm-edit-rating-label">Your rating</h3>
        <div className="cm-rating" role="radiogroup" aria-labelledby="cm-edit-rating-label">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} role="radio" aria-checked={editRating === n} aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`} className={editRating && n <= editRating ? 'is-on' : ''} onClick={() => setEditRating(n)}><Star on={Boolean(editRating) && n <= editRating} size={28} /></button>)}</div>
      </section>}
      <RuleField autoGrow minRows={4} value={editBody} maxLength={POST_MAX} onChange={(e) => setEditBody(e.target.value)} onShowRules={openRules} aria-label={editPost.kind === 'review' ? 'Your review' : 'Your post'} />
      <CharRing length={editBody.length} max={POST_MAX} className="ay-ring cm-ring is-reply" />
      <div className="cm-compose-foot"><button type="button" className="ay-btn ay-btn--primary" disabled={busy || !editBody.trim() || breaksCommunityRules(editBody) || (editPost.kind === 'review' && !normalizeRating(editRating))} onClick={async () => {
        setBusy(true);
        try {
          const isReview = editPost.kind === 'review';
          const patch = { body: editBody.trim(), ...(isReview ? { rating: normalizeRating(editRating) } : {}) };
          await community.updatePost(supabase, editPost.id, patch);
          const apply = (p) => (p.id === editPost.id ? { ...p, ...patch, edited_at: new Date().toISOString() } : p);
          setPosts((prev) => prev.map(apply));
          setProfilePosts((prev) => prev.map(apply));
          if (details?.id === editPost.id) setDetails((d) => apply(d));
          setEditPost(null); toast(isReview ? 'Review updated' : 'Post updated');
        } catch (e) { notifyError(e); } finally { setBusy(false); }
      }}>{busy ? 'Saving…' : 'Save changes'}</button></div>
    </Sheet>}
    {reportUser && <Sheet title={`Report ${reportUser.display_name || reportUser.username}`} onClose={() => setReportUser(null)}><select data-autofocus value={reportReason} onChange={(e) => setReportReason(e.target.value)} aria-label="Reason"><option value="harassment">Harassment</option><option value="spam">Spam</option><option value="impersonation">Pretending to be someone</option><option value="misinformation">Health misinformation</option><option value="other">Something else</option></select><button type="button" className="ay-btn ay-btn--primary" disabled={busy} onClick={submitUserReport}>Send report</button></Sheet>}
    {blockTarget && <Sheet title={`Block ${blockTarget.display_name || blockTarget.username}?`} onClose={() => setBlockTarget(null)}><p className="cm-muted">Their posts will be hidden from your feeds and search, and you’ll stop following them. You can unblock from their profile.</p><div className="cm-row"><button type="button" className="ay-btn ay-btn--primary" data-autofocus disabled={busy} onClick={() => setBlock(blockTarget, true)}>Block</button><button type="button" className="ay-btn ay-btn--secondary" onClick={() => setBlockTarget(null)}>Cancel</button></div></Sheet>}
    {reportPost && <Sheet title="Report post" onClose={() => setReportPost(null)}><select data-autofocus value={reportReason} onChange={(e) => setReportReason(e.target.value)} aria-label="Reason"><option value="misinformation">Health misinformation</option><option value="harassment">Harassment</option><option value="spam">Spam</option><option value="other">Something else</option></select><button type="button" className="ay-btn ay-btn--primary" disabled={busy} onClick={submitReport}>Send report</button></Sheet>}
  </section>;
}
