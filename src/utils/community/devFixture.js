// DEV-ONLY sample data for looking at Community without Supabase.
// Open /community?fixture=community (or /mobile-preview?screen=community&fixture=community)
// on `vite` dev. Only reached through `import.meta.env.DEV` branches, so a
// production build drops this whole module (checked by grepping dist for
// "Sample member"). Every name and line here is clearly fake.

const MIN = 60000;
const ago = (m) => new Date(Date.now() - m * MIN).toISOString();

const author = (n) => ({ author_id: `00000000-0000-4000-8000-0000000001${n}0`, author_username: `sample_member_${n}`, author_display_name: `Sample member ${n}` });

// Built on first use (functions, not top-level calls) so a production build can drop all of it.
const posts = () => [
  { id: '00000000-0000-4000-8000-000000000001', kind: 'post', ...author(1), body: 'Sample post: switching to a cup took me three cycles to get right. Fold it smaller than you think, and give it a full minute before you decide it leaks. #periods', topics: ['periods'], helpful_count: 7, comment_count: 3, created_at: ago(12), is_mine: true, tagged_product_ids: ['p-saalt-cup'] },
  { id: '00000000-0000-4000-8000-000000000002', kind: 'question', ...author(2), body: 'Sample question: has anyone tried an iron supplement that does not upset your stomach? What time of day do you take it?', topics: ['nutrition'], helpful_count: 2, comment_count: 4, created_at: ago(55) },
  { id: '00000000-0000-4000-8000-000000000003', kind: 'review', ...author(3), body: 'Sample review: soft, no smell, and the pad stayed put on a long walking day. Runs a little short for overnight.', topics: ['periods'], rating: 4, product_id: 'p-rael-organic-pad', helpful_count: 5, comment_count: 1, created_at: ago(180) },
  { id: '00000000-0000-4000-8000-000000000004', kind: 'post', ...author(4), body: 'Sample post: a heat patch on my lower back during day one of cramps has done more for me than anything else I have tried this year. #cramps', topics: ['cramps'], helpful_count: 3, comment_count: 0, created_at: ago(60 * 26) },
  { id: '00000000-0000-4000-8000-000000000005', kind: 'post', is_anonymous: true, author_id: null, body: 'Sample anonymous post: reminder that it is fine to ask your doctor the same question twice if the first answer did not make sense.', topics: ['wellbeing'], helpful_count: 1, comment_count: 2, created_at: ago(60 * 50) },
].map((p) => ({ media: [], viewer_found_helpful: false, viewer_saved: false, is_anonymous: false, is_mine: false, edited_at: null, rating: null, product_id: null, tagged_product_ids: [], ...p }));

const playlists = () => [
  { id: '00000000-0000-4000-8000-0000000000a1', title: 'Sample playlist: period kit', owner_id: '00000000-0000-4000-8000-000000000110', owner_display_name: 'Sample member 1', item_count: 3, visibility: 'public', preview_product_ids: ['p-saalt-cup', 'p-rael-organic-pad', 'p-honeypot-pad'], cover_url: null, updated_at: ago(90), is_mine: false },
];

// Sample replies, so a post's reply count matches what its page shows.
const REPLY_LINES = ['Sample reply: same here, it got easier after the second cycle.', 'Sample reply: thanks for posting this.', 'Sample reply: I had the opposite experience, but good to know.', 'Sample reply: saving this for later.'];
const comments = () => posts().flatMap((p) => Array.from({ length: p.comment_count || 0 }, (_, i) => {
  const n = ((i + 1) % 4) + 1;
  return { id: `${p.id.slice(0, -3)}${p.id.slice(-1)}c${i}`, post_id: p.id, parent_id: null, ...author(n), body: REPLY_LINES[i % REPLY_LINES.length], product_id: null, is_anonymous: false, is_mine: false, created_at: ago(5 + i * 7), edited_at: null };
}));

// One sample team pick, so the "Picked by the ayna team" quote can be looked at.
const teamPicks = () => [{ post_id: '00000000-0000-4000-8000-000000000001', picked_at: ago(30) }];

const profiles = () => [1, 2, 3, 4].map((n) => ({ user_id: `00000000-0000-4000-8000-0000000001${n}0`, username: `sample_member_${n}`, display_name: `Sample member ${n}`, bio: 'Sample profile for the dev fixture.', avatar_url: null }));

const likers = (postId, n) => Array.from({ length: Math.min(n, 5) }, (_, i) => ({ post_id: postId, user_id: i === 2 ? null : `00000000-0000-4000-8000-0000000001${(i % 4) + 1}0`, username: i === 2 ? null : `sample_member_${(i % 4) + 1}`, display_name: i === 2 ? null : `Sample member ${(i % 4) + 1}`, is_anonymous: i === 2, total_count: n }));

/**
 * Local production builds (`npm run build` served on http://localhost or
 * 127.0.0.1 for design review) can't reach Supabase either, so the switch
 * also works there. Never on a real host: the Capacitor apps use
 * capacitor://localhost and https://localhost, which this excludes.
 */
export function localFixtureHost() {
  if (typeof window === 'undefined') return false;
  try { return window.location.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname); } catch { return false; }
}

/** True with ?fixture=community on `vite` dev or a local http build. Always false on real hosts. */
export function communityFixtureOn() {
  if (typeof window === 'undefined' || !(import.meta.env.DEV || localFixtureHost())) return false;
  try { return new URLSearchParams(window.location.search).get('fixture') === 'community' || sessionStorage.getItem('ayna_dev_fixture') === 'community'; } catch { return false; }
}

function tableRows(table, filters) {
  let rows = [];
  if (table === 'community_feed_posts') rows = posts();
  else if (table === 'community_feed_playlists') rows = playlists();
  else if (table === 'community_playlist_items') rows = playlists()[0].preview_product_ids.map((product_id, position) => ({ product_id, position, note: null, added_at: ago(90), added_by: null }));
  else if (table === 'community_profiles') rows = profiles();
  else if (table === 'community_team_picks') rows = teamPicks();
  else if (table === 'community_feed_comments') rows = comments();
  for (const [col, val] of filters) rows = rows.filter((r) => !(col in r) || r[col] === val);
  return rows;
}

function rpcRows(name, args = {}) {
  const POSTS = posts();
  if (name === 'community_post_view_counts') return POSTS.filter((p) => p.is_mine && (args.p_post_ids || []).includes(p.id)).map((p) => ({ post_id: p.id, view_count: 128, views_today: 9 }));
  if (name === 'community_post_likers_preview') return POSTS.filter((p) => (args.p_post_ids || []).includes(p.id)).flatMap((p) => likers(p.id, p.helpful_count));
  if (name === 'community_post_likers') { const p = POSTS.find((x) => x.id === args.p_post_id); return p ? likers(p.id, p.helpful_count) : []; }
  return [];
}

// A chainable stand-in for the Supabase query builder: every filter call
// returns the builder, and awaiting it resolves to { data, error: null }.
function query(table) {
  const filters = [];
  let single = false;
  const builder = new Proxy({}, {
    get(_, prop) {
      if (prop === 'then') {
        const rows = tableRows(table, filters);
        const result = { data: single ? rows[0] || null : rows, error: null, count: rows.length };
        return (ok, fail) => Promise.resolve(result).then(ok, fail);
      }
      return (...a) => {
        if (prop === 'eq' && a.length === 2 && a[0] !== 'visibility') filters.push([a[0], a[1]]);
        if (prop === 'single' || prop === 'maybeSingle') single = true;
        return builder;
      };
    },
  });
  return builder;
}

/** A fake client: sample rows for the feed, playlists, likers and views; empty for the rest. */
export function makeCommunityFixtureClient() {
  const none = () => Promise.resolve({ data: { session: null, user: null, subscription: { unsubscribe() {} } }, error: null });
  return {
    from: (table) => query(table),
    rpc: (name, args) => Promise.resolve({ data: rpcRows(name, args), error: null }),
    auth: { getSession: none, getUser: none, onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), signInAnonymously: () => Promise.resolve({ data: null, error: { message: 'fixture' } }) },
    storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  };
}
