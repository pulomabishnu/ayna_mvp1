import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as community from '../../utils/community/communityStore.js';
import * as ann from '../../utils/community/announcementsStore.js';
import { uploadCommunityImage, deleteCommunityImage, checkImageFile, MAX_POST_PHOTOS, publicMediaUrl } from '../../utils/community/imageUpload.js';
import { canPostAnnouncements, teamMemberForEmail } from '../../utils/aynaTeam.js';
import { breaksCommunityRules } from '../../utils/communityRules.js';
import { CATEGORY_LABELS } from '../../data/products.js';
import { buildSearchTextForItem, buildIdentityTextForItem, scoreQueryAgainstProduct } from '../../utils/naturalLanguageSearch.js';
import ProductTileImage, { ProductImageFallback } from '../ProductTileImage';
import { RuleField } from './RuleField.jsx';
import { CharRing } from './notesKit.jsx';
import RelativeTime from '../ui/RelativeTime.jsx';
import { autofocusTarget } from '../../utils/delightRuntime.js';
import { VerifiedBadge } from './VerifiedBadge.jsx';
import { RichText } from './richText.jsx';
import RichEditor from './RichEditor.jsx';
import './community-shared.css';

// Announcements: news from the ayna team. Everyone can read, react and reply;
// only admins, the three founders (src/utils/aynaTeam.js, enforced by RLS), can
// create, edit or delete. Everyone else reads like
// any member. Shared by the website (variant="web") and the app
// (variant="app").

const KIND_LABEL = { playlist: 'Playlist', product: 'Product', read: 'Read', link: 'Link' };
const eventDate = (d) => { if (!d) return ''; const [y, m, day] = d.split('-').map(Number); return new Date(y, m - 1, day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); };
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Icon({ name, size = 18 }) {
  const paths = {
    heart: <path d="M20.5 8.5c0 4.2-8.5 10-8.5 10s-8.5-5.8-8.5-10a4.5 4.5 0 0 1 8.5-2 4.5 4.5 0 0 1 8.5 2Z" />,
    comment: <path d="M20 11.5a8 8 0 0 1-8 8 8.4 8.4 0 0 1-3.3-.7L4 20l1.2-4.7A8 8 0 1 1 20 11.5Z" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    megaphone: <><path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1Z" /><path d="M16 9a4 4 0 0 1 0 6" /></>,
    photo: <><rect x="3.5" y="5" width="17" height="14" rx="2.5" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Initials({ name }) {
  const t = String(name || 'a').split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return <span className="cr-ann-avatar" aria-hidden="true">{t}</span>;
}

// Modal used for the composer, portalled into the site/app root for tokens.
function Dialog({ title, onClose, host, children, footer }) {
  const ref = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const opener = document.activeElement;
    const node = ref.current;
    (autofocusTarget(node) || node)?.focus(); // no surprise keyboard (utils/delightRuntime.js)
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const a = items[0]; const z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); if (opener?.isConnected) opener.focus(); };
  }, []);
  return createPortal(<div className="cr-dialog-backdrop" onClick={onClose}>
    <div ref={ref} tabIndex={-1} className="cr-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
      <header className="cr-dialog-head"><h2 id={titleId}>{title}</h2><button type="button" className="cr-icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" /></button></header>
      <div className="cr-dialog-body">{children}</div>
      {footer && <footer className="cr-dialog-foot">{footer}</footer>}
    </div>
  </div>, host || document.body);
}

function Attachment({ a, productsById, articles, onOpenProduct, onOpenPlaylist, onOpenArticle, onRemove }) {
  let title = a.title;
  let sub = KIND_LABEL[a.type];
  let thumb = null;
  let action = null;
  if (a.type === 'product') {
    const p = productsById?.get(String(a.id));
    title = p?.name || a.title || 'Product';
    sub = p?.brand || 'Product';
    thumb = <span className="cr-att-photo">{p ? <ProductTileImage product={p} imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} letterNode={<ProductImageFallback style={{ position: 'absolute', inset: 0 }} />} /> : null}</span>;
    if (p && onOpenProduct) action = () => onOpenProduct(p);
  } else if (a.type === 'playlist') {
    sub = 'Playlist';
    if (onOpenPlaylist) action = () => onOpenPlaylist(a.id);
  } else if (a.type === 'read') {
    const art = (articles || []).find((x) => String(x.id) === String(a.id));
    title = art?.title || a.title || 'Library read';
    sub = 'Library read';
    if (onOpenArticle && art) action = () => onOpenArticle(art);
  } else if (a.type === 'link') {
    sub = [a.date ? eventDate(a.date) : null, hostOf(a.url)].filter(Boolean).join(' · ');
  }
  const inner = <>
    {thumb || <span className={`cr-att-kind is-${a.type}`} aria-hidden="true">{KIND_LABEL[a.type]?.[0]}</span>}
    <span className="cr-att-text"><strong>{title}</strong><small>{sub}</small></span>
  </>;
  if (onRemove) return <li className="cr-att is-edit">{inner}<button type="button" className="cr-text-btn" onClick={onRemove} aria-label={`Remove ${title}`}>Remove</button></li>;
  if (a.type === 'link') return <li><a className="cr-att" href={a.url} target="_blank" rel="noopener noreferrer">{inner}<span className="cr-att-go"><Icon name="arrow" size={16} /></span></a></li>;
  if (a.type === 'read' && !action) return <li><a className="cr-att" href={`/library/${encodeURIComponent(a.id)}`}>{inner}<span className="cr-att-go"><Icon name="arrow" size={16} /></span></a></li>;
  return <li>{action ? <button type="button" className="cr-att" onClick={action}>{inner}<span className="cr-att-go"><Icon name="arrow" size={16} /></span></button> : <span className="cr-att">{inner}</span>}</li>;
}

function Composer({ supabase, user, products, productsById, articles, playlists, host, onClose, onPosted, onShowRules }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [mode, setMode] = useState(null);
  const [q, setQ] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDate, setLinkDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const previews = useMemo(() => photos.map((f) => ({ f, url: URL.createObjectURL(f) })), [photos]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const add = (a) => { setAttachments((xs) => (xs.some((x) => x.type === a.type && x.id && x.id === a.id) ? xs : [...xs, a].slice(0, ann.ANNOUNCEMENT_ATTACH_MAX))); setQ(''); setMode(null); };
  const term = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (mode === 'product') {
      if (term.length < 2) return [];
      return products.map((p) => ({ p, s: scoreQueryAgainstProduct(term, buildSearchTextForItem(p, CATEGORY_LABELS), buildIdentityTextForItem(p, CATEGORY_LABELS)) }))
        .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 6).map(({ p }) => ({ type: 'product', id: String(p.id), title: p.name, sub: p.brand }));
    }
    if (mode === 'read') return (articles || []).filter((a) => !term || `${a.title} ${(a.tags || []).join(' ')}`.toLowerCase().includes(term)).slice(0, 6).map((a) => ({ type: 'read', id: String(a.id), title: a.title, sub: 'Library read' }));
    if (mode === 'playlist') return (playlists || []).filter((p) => !term || String(p.title).toLowerCase().includes(term)).slice(0, 6).map((p) => ({ type: 'playlist', id: String(p.id), title: p.title, sub: `${p.item_count || 0} products${p.owner_display_name ? ` · ${p.owner_display_name}` : ''}` }));
    return [];
  }, [mode, term, products, articles, playlists]);

  const linkClean = ann.cleanAttachments([{ type: 'link', url: linkUrl, title: linkTitle, date: linkDate }])[0];
  const flagged = breaksCommunityRules(title, body, linkTitle);
  const canPost = title.trim() && !flagged && !busy;

  const submit = async () => {
    if (!canPost) return;
    setBusy(true); setError('');
    const media = [];
    try {
      for (const f of photos) media.push(await uploadCommunityImage(supabase, f, { folder: 'posts' }));
      const row = await ann.createAnnouncement(supabase, user.id, { title, body, media, attachments });
      onPosted(row);
    } catch (e) {
      await Promise.all(media.map((m) => deleteCommunityImage(supabase, m.path)));
      setError(/^(Announcements aren|Please choose|That photo|Photo upload)/.test(e?.message || '') ? e.message : community.friendlyError(e));
    } finally { setBusy(false); }
  };

  return <Dialog title="New announcement" host={host} onClose={onClose} footer={<>
    {error && <p className="cr-error" role="alert">{error}</p>}
    <div className="cr-dialog-actions">
      <button type="button" className="cr-btn is-ghost" onClick={onClose}>Cancel</button>
      <button type="button" className="cr-btn" disabled={!canPost} onClick={submit}>{busy ? 'Posting…' : 'Post announcement'}</button>
    </div>
  </>}>
    <section className="cr-group">
      <label className="cr-label" htmlFor="cr-ann-title">Title</label>
      <RuleField as="input" id="cr-ann-title" data-autofocus value={title} maxLength={ann.ANNOUNCEMENT_TITLE_MAX} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Join our cycle Q&A on Thursday" className="cr-input" onShowRules={onShowRules} />
      <p className="cr-label" id="cr-ann-body-label">Message</p>
      <RichEditor id="cr-ann-body" onChange={setBody} maxLength={ann.ANNOUNCEMENT_BODY_MAX} placeholder="What should the community know?" onShowRules={onShowRules} label="Message" />
    </section>

    <section className="cr-group">
      <div className="cr-group-head"><h3>Photos</h3><small>Up to {MAX_POST_PHOTOS}</small></div>
      <div className="cr-photo-row">
        {previews.map((p, i) => <span key={p.url} className="cr-thumb"><img src={p.url} alt="" /><button type="button" className="cr-thumb-x" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos((xs) => xs.filter((x) => x !== p.f))}><Icon name="close" size={14} /></button></span>)}
        {photos.length < MAX_POST_PHOTOS && <label className="cr-photo-add"><Icon name="photo" size={20} /><span>Add photos</span><input type="file" accept="image/*" multiple className="cr-file" onChange={(e) => { try { const files = Array.from(e.target.files || []); files.forEach(checkImageFile); setPhotos((xs) => [...xs, ...files].slice(0, MAX_POST_PHOTOS)); setError(''); } catch (err) { setError(err.message); } e.target.value = ''; }} /></label>}
      </div>
    </section>

    <section className="cr-group">
      <div className="cr-group-head"><h3>Attach</h3><small>Playlists, products, reads or a link</small></div>
      <div className="cr-seg" role="group" aria-label="Attach">{Object.entries(KIND_LABEL).map(([k, l]) => <button type="button" key={k} aria-pressed={mode === k} onClick={() => { setMode(mode === k ? null : k); setQ(''); }}>{l}</button>)}</div>
      {mode && mode !== 'link' && <div className="cr-attach-panel">
        <input className="cr-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={mode === 'product' ? 'Search products' : mode === 'read' ? 'Search Library reads' : 'Search playlists'} aria-label={`Search ${KIND_LABEL[mode].toLowerCase()}s`} />
        <ul className="cr-pick-list">
          {results.map((r) => <li key={`${r.type}-${r.id}`}><button type="button" onClick={() => add({ type: r.type, id: r.id, title: r.title })}><strong>{r.title}</strong>{r.sub && <small>{r.sub}</small>}</button></li>)}
          {!results.length && <li className="cr-pick-empty">{mode === 'product' && term.length < 2 ? 'Type at least two letters.' : mode === 'read' && !articles ? 'Loading reads…' : 'Nothing found.'}</li>}
        </ul>
      </div>}
      {mode === 'link' && <div className="cr-attach-panel cr-link-form">
        <input className="cr-input" type="url" inputMode="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" aria-label="Link URL" />
        <RuleField as="input" value={linkTitle} maxLength={120} onChange={(e) => setLinkTitle(e.target.value)} placeholder="Label, e.g. Live Q&A sign-up" aria-label="Link label" className="cr-input" onShowRules={onShowRules} />
        <label className="cr-inline-field"><span>Event date (optional)</span><input className="cr-input" type="date" value={linkDate} onChange={(e) => setLinkDate(e.target.value)} /></label>
        <button type="button" className="cr-btn is-small" disabled={!linkClean || breaksCommunityRules(linkTitle)} onClick={() => { add(linkClean); setLinkUrl(''); setLinkTitle(''); setLinkDate(''); }}>Add link</button>
      </div>}
      {attachments.length > 0 && <ul className="cr-att-list">{attachments.map((a, i) => <Attachment key={`${a.type}-${a.id || a.url}-${i}`} a={a} productsById={productsById} articles={articles} onRemove={() => setAttachments((xs) => xs.filter((_, j) => j !== i))} />)}</ul>}
    </section>
  </Dialog>;
}

export default function Announcements({ supabase, user, products = [], productsById, articles: articlesProp = null, loadArticles = null, teamBadges, variant = 'web', onOpenProduct, onOpenPlaylist, onOpenArticle, onOpenProfile, onRequireAuth, onShowRules }) {
  const canPost = canPostAnnouncements(user);
  const [rows, setRows] = useState(null);
  const [available, setAvailable] = useState(true);
  const [authors, setAuthors] = useState(new Map());
  const [reactions, setReactions] = useState({});
  const [replyCounts, setReplyCounts] = useState({});
  const [open, setOpen] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyBody, setReplyBody] = useState('');
  const [composing, setComposing] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [articles, setArticles] = useState(articlesProp);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const host = typeof document !== 'undefined' ? document.querySelector(variant === 'app' ? '.ayna-mobile' : '.app-container') : null;
  const map = useMemo(() => productsById || new Map(products.map((p) => [String(p.id), p])), [productsById, products]);

  useEffect(() => { if (articlesProp) setArticles(articlesProp); }, [articlesProp]);
  const needsReads = composing || (rows || []).some((r) => (r.attachments || []).some((a) => a.type === 'read'));
  useEffect(() => {
    if (articles || !loadArticles || !needsReads) return undefined;
    let active = true;
    Promise.resolve(loadArticles()).then((list) => { if (active) setArticles(Array.isArray(list) ? list : []); }).catch(() => { if (active) setArticles([]); });
    return () => { active = false; };
  }, [articles, loadArticles, needsReads]);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    (async () => {
      const { rows: list, available: ok } = await ann.listAnnouncements(supabase);
      if (!active) return;
      setRows(list); setAvailable(ok);
      if (!list.length) return;
      const ids = list.map((r) => r.id);
      const [profiles, rx, rc] = await Promise.allSettled([
        community.getProfilesByIds(supabase, list.map((r) => r.author_id)),
        ann.listAnnouncementReactions(supabase, ids, user?.id),
        ann.countAnnouncementReplies(supabase, ids),
      ]);
      if (!active) return;
      if (profiles.status === 'fulfilled') setAuthors((prev) => new Map([...prev, ...profiles.value]));
      if (rx.status === 'fulfilled') setReactions(rx.value);
      if (rc.status === 'fulfilled') setReplyCounts(rc.value);
    })().catch(() => { if (active) { setRows([]); } });
    return () => { active = false; };
  }, [supabase, user?.id, refresh]);

  useEffect(() => {
    if (!composing || !supabase) return undefined;
    let active = true;
    Promise.allSettled([community.listPlaylists(supabase, { section: 'recent', limit: 40 }), user ? community.listPlaylists(supabase, { section: 'mine', limit: 40 }) : Promise.resolve([])])
      .then((res) => {
        if (!active) return;
        const all = res.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
        setPlaylists([...new Map(all.map((p) => [p.id, p])).values()]);
      });
    return () => { active = false; };
  }, [composing, supabase, user]);

  const nameFor = (uid) => {
    const p = authors.get(uid);
    if (p?.display_name || p?.username) return p.display_name || p.username;
    if (uid && uid === user?.id) return teamMemberForEmail(user.email)?.firstName || 'ayna team';
    return 'ayna team';
  };

  const toggleReaction = async (row) => {
    if (!user) { onRequireAuth?.('reactions'); return; }
    const cur = reactions[row.id] || { count: 0, mine: false };
    const next = { count: Math.max(0, cur.count + (cur.mine ? -1 : 1)), mine: !cur.mine };
    setReactions((r) => ({ ...r, [row.id]: next }));
    try { await ann.setAnnouncementReaction(supabase, user.id, row.id, next.mine); }
    catch (e) { setReactions((r) => ({ ...r, [row.id]: cur })); setError(community.friendlyError(e)); }
  };
  const toggleReplies = async (row) => {
    if (open === row.id) { setOpen(null); return; }
    setOpen(row.id); setReplies([]); setReplyBody(''); setError('');
    try {
      const list = await ann.listAnnouncementReplies(supabase, row.id);
      setReplies(list);
      const m = await community.getProfilesByIds(supabase, list.map((r) => r.author_id));
      setAuthors((prev) => new Map([...prev, ...m]));
    } catch (e) { setError(community.friendlyError(e)); }
  };
  const sendReply = async (row) => {
    if (!user) { onRequireAuth?.('replies'); return; }
    if (!replyBody.trim() || breaksCommunityRules(replyBody) || busy) return;
    setBusy(true); setError('');
    try {
      await ann.createAnnouncementReply(supabase, user.id, row.id, replyBody);
      setReplies(await ann.listAnnouncementReplies(supabase, row.id));
      setReplyCounts((c) => ({ ...c, [row.id]: (c[row.id] || 0) + 1 }));
      setReplyBody('');
    } catch (e) { setError(community.friendlyError(e)); } finally { setBusy(false); }
  };
  const remove = async (row) => {
    if (!canPost || busy) return;
    setBusy(true);
    try { await ann.deleteAnnouncement(supabase, row.id); setRefresh((v) => v + 1); } catch (e) { setError(community.friendlyError(e)); } finally { setBusy(false); }
  };

  const author = (uid, compact = false) => {
    const p = authors.get(uid);
    const name = nameFor(uid);
    const title = teamBadges?.get(uid) || (uid === user?.id ? teamMemberForEmail(user?.email)?.title : null);
    return <span className="cr-ann-who">
      {p?.username && onOpenProfile ? <button type="button" className="cr-ann-name" onClick={() => onOpenProfile(p.username)}>{name}</button> : <strong className="cr-ann-name">{name}</strong>}
      <VerifiedBadge title={title} compact={compact} />
    </span>;
  };

  return <section className={`cr-ann is-${variant}`} aria-label="Announcements">
    <div className="cr-ann-intro">
      <span className="cr-ann-intro-icon" aria-hidden="true"><Icon name="megaphone" size={20} /></span>
      <p><strong>From the ayna team</strong><small>{canPost ? 'You’re on the team, so you can post here.' : 'News, events and picks. Only the team posts here.'}</small></p>
      {canPost && <button type="button" className="cr-btn is-small" onClick={() => setComposing(true)}>New announcement</button>}
    </div>
    {error && <p className="cr-error" role="alert">{error}</p>}
    {rows === null ? <div className="cr-ann-skel" aria-busy="true" aria-label="Loading announcements"><span /><span /></div>
      : rows.length === 0 ? (variant === 'web' ? null : <div className="cr-ann-empty"><h2>No announcements yet</h2><p>{available ? 'News from the ayna team will show up here.' : 'Announcements are coming soon.'}</p></div>)
        : <ol className="cr-ann-list">{rows.map((row) => {
          const rx = reactions[row.id] || { count: 0, mine: false };
          const nReplies = replyCounts[row.id] || 0;
          const media = Array.isArray(row.media) ? row.media : [];
          const atts = Array.isArray(row.attachments) ? row.attachments : [];
          return <li key={row.id} className="cr-ann-card">
            <header className="cr-ann-head">
              <Initials name={nameFor(row.author_id)} />
              <div className="cr-ann-meta">{author(row.author_id)}<RelativeTime at={row.created_at} /></div>
              {canPost && <button type="button" className="cr-text-btn" disabled={busy} onClick={() => remove(row)}>Delete</button>}
            </header>
            <h3 className="cr-ann-title">{row.title}</h3>
            {row.body && <RichText text={row.body} className="cr-ann-body" />}
            {media.length > 0 && <div className={`cr-ann-photos is-${Math.min(media.length, 4)}`}>{media.slice(0, 4).map((m) => <img key={m.path} src={publicMediaUrl(m.path)} alt="" loading="lazy" />)}</div>}
            {atts.length > 0 && <ul className="cr-att-list">{atts.map((a, i) => <Attachment key={`${a.type}-${a.id || a.url}-${i}`} a={a} productsById={map} articles={articles} onOpenProduct={onOpenProduct} onOpenPlaylist={onOpenPlaylist} onOpenArticle={onOpenArticle} />)}</ul>}
            <footer className="cr-ann-actions">
              <button type="button" aria-pressed={rx.mine} onClick={() => toggleReaction(row)} aria-label={`Love${rx.count ? `, ${rx.count}` : ''}`}><Icon name="heart" size={17} /><span aria-hidden="true">{rx.count ? rx.count : 'Love'}</span></button>
              <button type="button" aria-expanded={open === row.id} onClick={() => toggleReplies(row)}><Icon name="comment" size={17} /><span>{nReplies ? `Replies ${nReplies}` : 'Reply'}</span></button>
            </footer>
            {open === row.id && <div className="cr-ann-thread">
              {replies.map((r) => <div key={r.id} className="cr-ann-reply">
                <div className="cr-ann-reply-head">{author(r.author_id, true)}<RelativeTime at={r.created_at} /></div>
                <p>{r.body}</p>
              </div>)}
              {user ? <div className="cr-ann-reply-box">
                <RuleField value={replyBody} maxLength={ann.ANNOUNCEMENT_REPLY_MAX} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write a reply" aria-label="Your reply" className="cr-input" autoGrow minRows={2} maxGrowPx={240} onShowRules={onShowRules} />
                <CharRing length={replyBody.length} max={ann.ANNOUNCEMENT_REPLY_MAX} className="ay-ring cr-ring" />
                <button type="button" className="cr-btn is-small" disabled={busy || !replyBody.trim() || breaksCommunityRules(replyBody)} onClick={() => sendReply(row)}>Post reply</button>
              </div> : <button type="button" className="cr-btn is-ghost is-small" onClick={() => onRequireAuth?.('replies')}>Sign in to reply</button>}
            </div>}
          </li>;
        })}</ol>}
    {composing && <Composer supabase={supabase} user={user} products={products} productsById={map} articles={articles} playlists={playlists} host={host} onShowRules={onShowRules} onClose={() => setComposing(false)} onPosted={() => { setComposing(false); setRefresh((v) => v + 1); }} />}
  </section>;
}
