import React, { useCallback, useEffect, useState } from 'react';
import './community.css';
import { CommunityContext } from './CommunityContext';
import { useCommunityCore } from './useCommunityCore';
import { RecommendSheet } from './Social';
import { AddToPlaylistSheet } from './Playlists';
import CommunityComposer from './CommunityComposer';
import { communityHref } from '../../utils/community/route';
import * as store from '../../utils/community/communityStore';

/**
 * Community entry points on the existing product page: recommend to a friend,
 * add to a playlist, write a review, and a link to community posts that
 * mention this product. Only rendered for real catalog products.
 */
export default function CommunityProductActions({ product, onOpenCommunity, ...coreProps }) {
  const navigate = useCallback((route) => onOpenCommunity?.(communityHref(route)), [onOpenCommunity]);
  const [ctx, overlays] = useCommunityCore({ ...coreProps, navigate, lazy: true });
  const [sheet, setSheet] = useState(null); // 'recommend' | 'playlist' | 'review'
  const [mentions, setMentions] = useState(null);
  const inCatalog = Boolean(product?.id && ctx.productsById.has(product.id));

  useEffect(() => {
    if (!ctx.supabase || !coreProps.user || !inCatalog) return undefined;
    let alive = true;
    store.listFeedPosts(ctx.supabase, { productId: product.id, limit: 20 })
      .then((rows) => { if (alive) setMentions(rows.length); })
      .catch(() => {});
    return () => { alive = false; };
  }, [ctx.supabase, coreProps.user, product?.id, inCatalog]);

  if (!inCatalog || !ctx.supabase) return null;

  const open = (name) => {
    if (ctx.requireProfile(() => setSheet(name))) setSheet(name);
  };

  return (
    <CommunityContext.Provider value={ctx}>
      <div className="cm-pdp-actions" aria-label="Community">
        <button type="button" className="cm-chip-btn" onClick={() => open('recommend')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h12m0 0-4-4m4 4-4 4M20 5v14" /></svg>
          Recommend to a friend
        </button>
        <button type="button" className="cm-chip-btn" onClick={() => open('playlist')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h12M4 12h12M4 18h7M18 15v6m-3-3h6" /></svg>
          Add to playlist
        </button>
        <button type="button" className="cm-chip-btn" onClick={() => open('review')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.6 5.6 6 .6-4.5 4 1.3 6L12 16.3 6.6 19.2l1.3-6-4.5-4 6-.6L12 3Z" /></svg>
          Write a review
        </button>
        {mentions > 0 && (
          <button type="button" className="cm-link" onClick={() => navigate({ name: 'feed', product: product.id })}>
            {mentions >= 20 ? '20+' : mentions} community post{mentions === 1 ? '' : 's'} →
          </button>
        )}
      </div>
      {sheet === 'recommend' && <RecommendSheet productId={product.id} onClose={() => setSheet(null)} />}
      {sheet === 'playlist' && <AddToPlaylistSheet productId={product.id} onClose={() => setSheet(null)} />}
      {sheet === 'review' && (
        <CommunityComposer
          initialKind="review"
          initialProductId={product.id}
          onClose={() => setSheet(null)}
          onCreated={({ type, id }) => { setSheet(null); navigate(type === 'playlist' ? { name: 'playlist', id } : { name: 'post', id }); }}
        />
      )}
      {overlays}
    </CommunityContext.Provider>
  );
}
