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

/* Nov 6 (founder: "quote our focus group … put - beta tester"). Real words from ayna's weekly
   focus group (Google Meet, Gemini transcripts Oct 19, Oct 26, Nov 2 2026), trimmed of filler
   words only ("like", "um"). No names: every one is signed "Beta tester". */
export const BETA_QUOTES = [
  { q: 'Everything is so seamless and easy, and all the information is easy to read. There’s not too much jargon.', tone: 'butter' },
  { q: 'Most of the recommendations are really spot-on.', tone: 'pink' },
  { q: 'It really accounts for different price ranges, which is super helpful.', tone: 'butter' },
  { q: 'The questions were pretty thorough, so I got a lot of good recommendations.', tone: 'pink' },
];

/* What stops her from starting (objections), answered only with what the site already says
   elsewhere: the Pro page, the product page disclosure, the privacy policy and the footer. */
export const LANDING_FAQ = [
  { q: 'Is ayna free?', a: 'Yes. The quiz, your matches, safety notes and the evidence are free. ayna Pro adds a health dashboard, Apple Health and Oura syncing, every Read and more Ask ayna chats.' },
  { q: 'Can brands pay for a better match?', a: 'No. Brands can’t pay to change your match. Some links earn ayna a commission, and the product page always says so.' },
  { q: 'What happens to my health info?', a: 'We use it to match you, and we don’t sell your personal health information. You can delete your account and your answers anytime in Settings.' },
  { q: 'How does the match work?', a: 'You tell us what you want help with, your life stage and your medicines. We check each product against your answers, its safety notes and the research, then show a % and the reason why.' },
  { q: 'Is this medical advice?', a: 'No. ayna shares information to help you choose, not a diagnosis. For anything new, severe or worrying, talk to a clinician.' },
];

/* Nov 6 (founder: "really explanatory, not repetitive, interactive"; pitch brief: "Women collect
   health information. They still have to connect it themselves."). Each pain opens what ayna does
   about it, in words the product already backs (the quiz, the % and reason, safety checks, care). */
export const PAINS = [
  { t: '20 tabs open', d: 'and still no idea what actually works.', icon: 'tabs',
    fix: 'One quiz instead. Tell us what you want help with, your life stage, your medicines and what you’d rather use, and ayna narrows the whole Shop to what fits you.' },
  { t: 'Reviews that disagree', d: 'five stars, one star, same product.', icon: 'stars',
    fix: 'Every match shows a % and the reason behind it: which of your needs it’s for and how strong the research is, with the sources linked.' },
  { t: 'Advice that isn’t for you', d: 'nobody asked your age, stage or meds.', icon: 'person',
    fix: 'Your stage and medicines are checked before anything is matched. If something isn’t right for you, we say why, and point you to care when a product isn’t the answer.' },
];
