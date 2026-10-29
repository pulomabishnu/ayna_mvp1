import { getProductById } from '../../data/catalog.js';

/* Shared by the website landing body and LandingV2. */
export const LEAD_READS = [
  { id: 'heavy-bleeding', title: 'Heavy menstrual bleeding', teaser: 'What counts as heavy bleeding, possible causes, when to seek care, and how it’s evaluated.', source: 'UpToDate · ACOG · CDC', src: '/landing/articles-heavy-bleeding-satin.webp', alt: 'Pads and tampons scattered on red satin', tone: 'pink' },
  { id: 'period-pain-when-to-seek-care', title: 'Period Pain: When to Seek Care', teaser: 'Normal cramps vs. signs that something else may be going on, and what clinicians may suggest.', source: 'ACOG · UpToDate · Mayo Clinic', src: '/landing/articles-period-pain-hotwater.webp', alt: 'A woman in striped pajamas holding a hot water bottle', tone: 'sky' },
  { id: 'pcos-basics', title: 'PMOS: What It Is and How It’s Managed', teaser: 'Diagnosis, symptoms, and evidence-based treatment, including lifestyle and medication.', source: 'ACOG · Endocrine Society · UpToDate', src: '/landing/articles-pcos-mirror.webp', alt: 'Red lips reflected in a small red compact mirror', tone: 'butter' },
];

/** One Community post with its context: a positive review that names the product, else a question. */
export function pickCommunityPost(posts = []) {
  const productOf = (p) => (p?.product_id ? getProductById(p.product_id) : null);
  const post = posts.find((p) => p.kind === 'review' && productOf(p) && (Number(p.rating) >= 4 || p.would_recommend === true) && String(p.body || '').length > 30)
    || posts.find((p) => p.kind === 'question' && String(p.body || '').length > 20)
    || null;
  if (!post) return null;
  const product = productOf(post);
  const anon = post.is_anonymous || !post.author_id;
  const who = anon ? 'Anonymous' : post.author_display_name || post.author_username || 'Community member';
  return { body: post.body, meta: post.kind === 'review' && product ? `${who} on ${product.name}` : `Question from ${who}` };
}
