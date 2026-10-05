import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCommunity, shareLink } from './CommunityContext';
import { CommunityProductPreview, EmptyState, FeedSkeleton, OverflowMenu, Sheet, Toggle, UserAvatar } from './CommunityUI';
import ProductTileImage from '../ProductTileImage';
import ProductPicker from './ProductPicker';
import * as store from '../../utils/community/communityStore';
import { communityHref } from '../../utils/community/route';
import { trackCommunity } from '../../utils/community/analytics';
import { averageMatch } from '../../utils/community/ranking';


function Cover({ playlist, size = 'md' }) {
  const { productsById } = useCommunity();
  if (playlist.cover_url) return <img className={`cm-cover cm-cover--${size}`} src={playlist.cover_url} alt="" loading="lazy" />;
  const products = (playlist.preview_product_ids || []).map((id) => productsById.get(id)).filter(Boolean).slice(0, 4);
  return (
    <div className={`cm-cover cm-cover--${size} cm-cover--grid cm-cover--n${Math.max(1, products.length)}`} aria-hidden="true">
      {products.length === 0 && <span className="cm-cover__empty">ayna</span>}
      {products.map((p) => (
        <span key={p.id} className="cm-cover__cell"><ProductTileImage product={p} alt="" imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span>
      ))}
    </div>
  );
}

export function PlaylistCard({ playlist, layout = 'tile' }) {
  const { navigate, matchFor } = useCommunity();
  const avg = averageMatch(playlist.preview_product_ids, matchFor);
  return (
    <button type="button" className={`cm-plist cm-plist--${layout}`} onClick={() => navigate({ name: 'playlist', id: playlist.id })}>
      <Cover playlist={playlist} size={layout === 'row' ? 'sm' : 'md'} />
      <span className="cm-plist__text">
        <span className="cm-plist__title">{playlist.title}</span>
        <span className="cm-plist__meta">
          {playlist.is_mine ? 'You' : playlist.owner_display_name} · {playlist.item_count} item{playlist.item_count === 1 ? '' : 's'}
          {playlist.visibility === 'private' ? ' · Private' : ''}
        </span>
        {avg != null && <span className="cm-plist__match">{avg}% avg match for you</span>}
      </span>
    </button>
  );
}

function Shelf({ title, items, emptyText, action }) {
  if (!items) return null;
  return (
    <section className="cm-shelf">
      <div className="cm-shelf__head">
        <h3 className="cm-section-title">{title}</h3>
        {action}
      </div>
      {items.length === 0 ? (
        emptyText ? <p className="cm-hint">{emptyText}</p> : null
      ) : (
        <div className="cm-shelf__row">
          {items.map((p) => <PlaylistCard key={p.id} playlist={p} />)}
        </div>
      )}
    </section>
  );
}

export function PlaylistDiscovery({ friendIds, onCreate }) {
  const { supabase, matchFor, hasProfile } = useCommunity();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [mine, recent, popular, friends, saved] = await Promise.all([
          store.listPlaylists(supabase, { section: 'mine', limit: 12 }),
          store.listPlaylists(supabase, { section: 'recent', limit: 24 }),
          store.listPlaylists(supabase, { section: 'popular', limit: 12 }),
          store.listPlaylists(supabase, { section: 'friends', ownerIds: friendIds, limit: 12 }),
          store.listPlaylists(supabase, { section: 'saved', limit: 12 }),
        ]);
        if (active) setData({ mine, recent, popular, friends, saved });
      } catch {
        if (active) setError(true);
      }
    })();
    return () => { active = false; };
  }, [supabase, friendIds]);

  // "For you": public playlists from others, ordered by how well their
  // products match THIS viewer. Same match engine, no extra algorithm.
  const forYou = useMemo(() => {
    if (!data || !hasProfile) return null;
    return [...data.recent, ...data.popular]
      .filter((p, i, arr) => !p.is_mine && arr.findIndex((x) => x.id === p.id) === i)
      .map((p) => ({ p, avg: averageMatch(p.preview_product_ids, matchFor) }))
      // Only playlists that genuinely fit this viewer.
      .filter((x) => x.avg != null && x.avg >= 60)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10)
      .map((x) => x.p);
  }, [data, hasProfile, matchFor]);

  if (error) return <EmptyState title="Couldn’t load playlists">Check your connection and try again.</EmptyState>;
  if (!data) return <FeedSkeleton count={2} />;

  const recentOthers = data.recent.filter((p) => !p.is_mine);
  const nothingPublic = recentOthers.length === 0 && data.popular.filter((p) => !p.is_mine).length === 0;

  return (
    <div className="cm-playlists">
      <Shelf
        title="Your playlists"
        items={data.mine}
        emptyText=""
        action={<button type="button" className="cm-link" onClick={onCreate}>+ New playlist</button>}
      />
      {data.mine.length === 0 && (
        <button type="button" className="cm-create-first" onClick={onCreate}>
          <span>Create your first playlist</span>
          <small>Collect the products that actually helped — period kit, PCOS essentials, anything.</small>
        </button>
      )}
      {forYou && forYou.length > 0 && <Shelf title="For you" items={forYou} />}
      <Shelf title="From friends" items={data.friends} emptyText={friendIds.length ? 'Your friends haven’t shared playlists yet.' : null} />
      {!nothingPublic && <Shelf title="Popular" items={data.popular.filter((p) => !p.is_mine)} />}
      {!nothingPublic && <Shelf title="Recently added" items={recentOthers.slice(0, 12)} />}
      {data.saved.length > 0 && <Shelf title="Saved" items={data.saved} />}
      {nothingPublic && <p className="cm-hint">No public playlists yet. Yours could be the first.</p>}
    </div>
  );
}

export function PlaylistPage({ playlistId }) {
  const { supabase, user, navigate, matchFor, toast, requireProfile, openReport, hasProfile, onAddToEcosystem, isInEcosystem, productsById } = useCommunity();
  const [playlist, setPlaylist] = useState(null);
  const [items, setItems] = useState([]);
  const [state, setState] = useState('loading');
  const [sortByMatch, setSortByMatch] = useState(false);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => (
    Promise.all([store.getPlaylist(supabase, playlistId), store.listPlaylistItems(supabase, playlistId)])
      .then(([pl, it]) => {
        setPlaylist(pl);
        setItems(it);
        setState(pl ? 'ready' : 'missing');
      })
      .catch(() => setState('error'))
  ), [supabase, playlistId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (state === 'ready') trackCommunity('playlist_opened', { source: playlist?.is_mine ? 'own' : 'other', item_count: items.length }); }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleItems = useMemo(() => {
    const list = items.filter((i) => productsById.has(i.product_id));
    if (!sortByMatch) return list;
    return [...list].sort((a, b) => (matchFor(b.product_id) ?? -1) - (matchFor(a.product_id) ?? -1));
  }, [items, sortByMatch, matchFor, productsById]);

  if (state === 'loading') return <FeedSkeleton count={2} />;
  if (state !== 'ready') {
    return (
      <EmptyState title="This playlist isn’t available" action={<button type="button" className="btn btn-navy" onClick={() => navigate({ name: 'feed', tab: 'playlists' })}>Browse playlists</button>}>
        It may be private or deleted.
      </EmptyState>
    );
  }

  const knownMatches = items.filter((i) => Number.isFinite(matchFor(i.product_id))).length;
  // An "average" of one product is just that product's number — only worth
  // saying once there are a few to average.
  const avg = knownMatches >= 2 ? averageMatch(items.map((i) => i.product_id), matchFor) : null;

  const toggleSave = async () => {
    if (!requireProfile()) return;
    const next = !playlist.viewer_saved;
    setPlaylist({ ...playlist, viewer_saved: next, save_count: Math.max(0, playlist.save_count + (next ? 1 : -1)) });
    try {
      await store.setPlaylistSaved(supabase, user.id, playlist.id, next);
    } catch (e) {
      setPlaylist(playlist);
      toast(store.friendlyError(e));
    }
  };

  const remove = async (productId) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
    try { await store.removeFromPlaylist(supabase, playlist.id, productId); } catch (e) { toast(store.friendlyError(e)); load(); }
  };

  const menu = playlist.is_mine
    ? [
      { label: 'Edit details', onClick: () => setEditing(true) },
      {
        label: 'Delete playlist',
        danger: true,
        onClick: async () => {
          if (!window.confirm('Delete this playlist?')) return;
          try { await store.deletePlaylist(supabase, playlist.id); navigate({ name: 'feed', tab: 'playlists' }, { replace: true }); } catch (e) { toast(store.friendlyError(e)); }
        },
      },
    ]
    : [{ label: 'Report playlist', onClick: () => openReport({ targetType: 'playlist', playlistId: playlist.id }) }];

  return (
    <div className="cm-playlist-page">
      <header className="cm-playlist-hero">
        <Cover playlist={{ ...playlist, preview_product_ids: items.map((i) => i.product_id) }} size="lg" />
        <div className="cm-playlist-hero__text">
          <p className="ayna-browse__eyebrow">{playlist.visibility === 'private' ? 'Private playlist' : 'Playlist'}</p>
          <h2>{playlist.title}</h2>
          {playlist.description && <p className="cm-playlist-hero__desc">{playlist.description}</p>}
          <button
            type="button"
            className="cm-playlist-hero__owner"
            onClick={() => playlist.owner_username && navigate({ name: 'profile', username: playlist.owner_username })}
          >
            <UserAvatar name={playlist.owner_display_name} url={playlist.owner_avatar_url} size={22} />
            <span>{playlist.is_mine ? 'You' : playlist.owner_display_name}</span>
            <span className="cm-dot">·</span>
            <span>{items.length} item{items.length === 1 ? '' : 's'}</span>
            {playlist.save_count > 0 && <><span className="cm-dot">·</span><span>{playlist.save_count} saved</span></>}
          </button>
          <div className="cm-playlist-hero__actions">
            {!playlist.is_mine && (
              <button type="button" className={`pdp-btn ${playlist.viewer_saved ? 'pdp-btn--outline-on' : 'pdp-btn--outline'} cm-btn-pill`} aria-pressed={!!playlist.viewer_saved} onClick={toggleSave}>
                {playlist.viewer_saved ? 'Saved' : 'Save playlist'}
              </button>
            )}
            {playlist.is_mine && (
              <button type="button" className="pdp-btn pdp-btn--outline cm-btn-pill" onClick={() => setAdding(true)}>Add products</button>
            )}
            {playlist.visibility === 'public' && (
              <button
                type="button"
                className="pdp-btn pdp-btn--outline cm-btn-pill"
                onClick={async () => { const r = await shareLink(communityHref({ name: 'playlist', id: playlist.id }), playlist.title); if (r === 'copied') toast('Link copied'); }}
              >
                Share
              </button>
            )}
            <OverflowMenu items={menu} />
          </div>
        </div>
      </header>

      <div className="cm-playlist-personal">
        {hasProfile ? (
          <p>
            Matches below are for <strong>you</strong>, from your own ayna profile{avg != null ? <> — <strong>{avg}%</strong> average</> : null}.
            {!playlist.is_mine && ' The creator never sees them.'}
          </p>
        ) : (
          <p>Take the ayna quiz to see how each product here matches <strong>you</strong>.</p>
        )}
        {items.length > 1 && hasProfile && (
          <Toggle checked={sortByMatch} onChange={setSortByMatch} label="Best match first" />
        )}
      </div>

      {visibleItems.length === 0 ? (
        <EmptyState title="No products yet" action={playlist.is_mine ? <button type="button" className="btn btn-navy" onClick={() => setAdding(true)}>Add products</button> : null} />
      ) : (
        <ol className="cm-playlist-items">
          {visibleItems.map((item) => (
            <li key={item.product_id}>
              <CommunityProductPreview
                productId={item.product_id}
                variant="row"
                note={item.note}
                onOpened={() => trackCommunity('playlist_product_opened', { source: playlist.is_mine ? 'own' : 'other' })}
                actions={
                  playlist.is_mine ? (
                    <button type="button" className="cm-link cm-link--muted" onClick={() => remove(item.product_id)}>Remove</button>
                  ) : onAddToEcosystem ? (
                    <button
                      type="button"
                      className={`cm-link${isInEcosystem(item.product_id) ? ' cm-link--done' : ''}`}
                      onClick={() => onAddToEcosystem(productsById.get(item.product_id))}
                    >
                      {isInEcosystem(item.product_id) ? 'In ecosystem' : '+ Ecosystem'}
                    </button>
                  ) : null
                }
              />
            </li>
          ))}
        </ol>
      )}

      {editing && <EditPlaylistSheet playlist={playlist} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />}
      {adding && (
        <AddProductsSheet
          playlist={playlist}
          existing={items.map((i) => i.product_id)}
          onClose={() => setAdding(false)}
          onDone={() => { setAdding(false); load(); }}
        />
      )}
    </div>
  );
}

function EditPlaylistSheet({ playlist, onClose, onSaved }) {
  const { supabase, toast } = useCommunity();
  const [title, setTitle] = useState(playlist.title);
  const [description, setDescription] = useState(playlist.description || '');
  const [isPublic, setIsPublic] = useState(playlist.visibility === 'public');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await store.updatePlaylist(supabase, playlist.id, { title, description, visibility: isPublic ? 'public' : 'private' });
      onSaved();
    } catch (e) {
      toast(store.friendlyError(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Sheet title="Edit playlist" onClose={onClose} footer={<button type="button" className="btn btn-navy cm-btn-block" disabled={!title.trim() || saving} onClick={save}>Save</button>}>
      <div className="cm-form">
        <label className="cm-field"><span>Name</span><input className="cm-input" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="cm-field"><span>Description</span><textarea className="cm-input" rows={2} maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <Toggle checked={isPublic} onChange={setIsPublic} label="Public" hint="Anyone on ayna can find it." />
      </div>
    </Sheet>
  );
}

function AddProductsSheet({ playlist, existing, onClose, onDone }) {
  const { supabase, toast } = useCommunity();
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      for (const id of selected) await store.addToPlaylist(supabase, playlist.id, id);
      onDone();
    } catch (e) {
      toast(store.friendlyError(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Sheet
      title={`Add to “${playlist.title}”`}
      onClose={onClose}
      footer={<button type="button" className="btn btn-navy cm-btn-block" disabled={!selected.length || saving} onClick={save}>Add {selected.length || ''}</button>}
    >
      <ProductPicker
        selected={selected}
        onToggle={(id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : existing.includes(id) ? prev : [...prev, id]))}
        max={Math.max(0, 50 - existing.length)}
        autoFocus
      />
    </Sheet>
  );
}

/** "Add to playlist" from a product page or a product preview. */
export function AddToPlaylistSheet({ productId, onClose }) {
  const { supabase, user, productsById, toast } = useCommunity();
  const [mine, setMine] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const product = productsById.get(productId);

  useEffect(() => {
    store.listPlaylists(supabase, { section: 'mine', limit: 50 }).then(setMine).catch(() => setMine([]));
  }, [supabase]);

  const add = async (playlist) => {
    setBusy(true);
    try {
      await store.addToPlaylist(supabase, playlist.id, productId);
      toast(`Added to “${playlist.title}”`);
      onClose();
    } catch (e) {
      toast(store.friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const createAndAdd = async () => {
    if (!newTitle.trim()) return;
    setBusy(true);
    try {
      const pl = await store.createPlaylist(supabase, user.id, { title: newTitle });
      await store.addToPlaylist(supabase, pl.id, productId);
      trackCommunity('playlist_created', { item_count: 1, source: 'product_page' });
      toast(`Added to “${pl.title}”`);
      onClose();
    } catch (e) {
      toast(store.friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Add to playlist" onClose={onClose}>
      {product && <p className="cm-hint">{product.name}</p>}
      {mine === null ? <FeedSkeleton count={1} /> : (
        <ul className="cm-pick-list">
          {mine.map((pl) => (
            <li key={pl.id}>
              <button type="button" disabled={busy || pl.preview_product_ids?.includes(productId)} onClick={() => add(pl)}>
                <span>{pl.title}</span>
                <small>{pl.preview_product_ids?.includes(productId) ? 'Already added' : `${pl.item_count} item${pl.item_count === 1 ? '' : 's'}`}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="cm-inline-form">
        <input className="cm-input" maxLength={80} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New playlist name" aria-label="New playlist name" />
        <button type="button" className="btn btn-navy cm-btn-sm" disabled={!newTitle.trim() || busy} onClick={createAndAdd}>Create</button>
      </div>
    </Sheet>
  );
}
