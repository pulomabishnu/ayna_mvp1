import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import * as communityStore from '../utils/community/communityStore.js';
import WebLanding from './landing/WebLanding.jsx';
// Styles other pages still borrow from the old home (the 404 search, editorial type).
import '../styles/eco-redesign.css';
import '../styles/landing.css';
import '../styles/editorial.css';
import '../styles/home.css';
import '../styles/loop-a-landing.css';
import '../styles/uq-landing.css';

/**
 * The website's / : one landing for everyone (WebLanding, the v2 website home
 * with the raining cut-outs in its hero; founder, Oct 27 10:40: "optimize it
 * for web", not the app's page). The ayna logo opens it signed in or out;
 * signed in with a profile, its main action is "Go to your Home" instead of
 * the quiz. Real community posts (the public feed guests can read) appear in
 * the Community card once loaded.
 */

/**
 * Turn a free-text query into the discovery view's filter options, so the hero
 * search lands on a pre-filtered feed instead of a raw text search.
 */
function discoveryTargetFor(text) {
  const q = String(text || '').trim();
  if (!q) return '';
  const lower = q.toLowerCase();

  if (lower.includes('pad')) {
    const opts = { query: q, initialCategory: 'pad' };
    if (lower.includes('organic')) opts.initialPadPreference = 'organic';
    else if (lower.includes('overnight')) opts.initialPadUseCase = 'overnight';
    else if (lower.includes('heavy')) opts.initialPadFlow = 'heavy';
    return opts;
  }
  if (lower.includes('postpartum') || lower.includes('breastfeeding') || lower.includes('nursing')) {
    return { query: q, initialCategory: 'postpartum' };
  }
  if (lower.includes('prenatal') || (lower.includes('pregnancy') && !lower.includes('postpartum'))) {
    return { query: q, initialCategory: (lower.includes('prenatal') || lower.includes('vitamin')) ? 'supplement' : 'pregnancy' };
  }
  if (lower.includes('supplement')) {
    const opts = { query: q, initialCategory: 'supplement' };
    if (lower.includes('cramps')) opts.initialSymptom = 'cramps';
    else if (lower.includes('pcos') || lower.includes('pmos')) opts.initialSymptom = 'pcos';
    return opts;
  }
  if (lower.includes('pelvic floor')) {
    return { query: q, initialCategory: 'pelvic-floor' };
  }
  return q;
}

function HomeSkeleton() {
  return (
    <div className="mockup-landing ay-home-skeleton" aria-busy="true" aria-label="Loading">
      <section className="ay-home-skeleton__hero"><div className="mockup-page"><i className="is-eyebrow" /><i className="is-title" /><i className="is-sub" /><i className="is-btn" /></div></section>
      <section className="mockup-page ay-home-skeleton__grid">{Array.from({ length: 4 }, (_, i) => <i key={i} />)}</section>
    </div>
  );
}

function usePosts() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    let live = true;
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;
    communityStore.listFeedPosts(supabase, { limit: 12, sort: 'helpful' }).then((rows) => {
      if (live) setPosts((rows || []).filter((r) => String(r.body || '').trim().length >= 20).slice(0, 3));
    }).catch(() => {});
    return () => { live = false; };
  }, []);
  return posts;
}

export default function AynaLanding({
  onStartQuiz, onViewDiscovery, onOpenProduct, onViewArticles, onViewArticle, onViewAbout, onViewCommunity,
  onViewWaitlist, onViewHowItWorks, onViewToday, user, hasProfile = false, loading = false, heroBanner = null,
}) {
  const posts = usePosts();
  // HI01: hold a skeleton until the session and profile resolve, so the main action never flips.
  if (loading) return <HomeSkeleton />;
  return (
    <WebLanding
      signedIn={Boolean(user)}
      hasProfile={hasProfile}
      onStartQuiz={onStartQuiz}
      onGoHome={onViewToday}
      onSearch={(q) => onViewDiscovery?.(discoveryTargetFor(q))}
      onViewDiscovery={onViewDiscovery}
      onOpenProduct={onOpenProduct}
      onViewArticles={onViewArticles}
      onViewArticle={onViewArticle}
      onViewAbout={onViewAbout}
      onViewCommunity={onViewCommunity}
      onViewWaitlist={onViewWaitlist}
      onViewHowItWorks={onViewHowItWorks}
      communityPosts={posts}
      heroBanner={hasProfile ? null : heroBanner}
    />
  );
}
