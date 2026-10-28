/**
 * Search titles, descriptions and indexing rules for the website's own pages
 * (not products or reads, see seoMeta.js and the prerender). One list, used by
 * the page title effect (App.jsx), the build-time prerender
 * (scripts/prerender.mjs) and the sitemap (scripts/gen-sitemap.mjs), so the
 * HTML a crawler gets and the page a browser shows say the same thing.
 *
 * Copy rules: docs/copy-and-seo.md (sentence case, plain words, no em dashes).
 */
export const SITE = 'https://www.aynahealth.co';

export const HOME_TITLE = "ayna | Personalized women's health product discovery";
export const HOME_DESCRIPTION = "Personalized women's health product discovery with cited research, clinical context, safety information, and community experiences.";

/** Public pages: path -> [title, description]. Every one is indexable and in the sitemap. */
export const SEO_PAGES = {
  '/explore': ["Explore women's health products, topics and reads | ayna", "Explore women's health: search products, symptoms, topics, services and plain-language reads."],
  '/explore/products': ["Women's health products matched to you | ayna", "Shop women's health products ranked by how well they fit you: period care, intimate care, fertility, menopause and more."],
  '/explore/services': ["Women's health services and apps | ayna", "Telehealth, at-home tests, apps and programs from women's health companies, each with its own page on ayna."],
  '/explore/topics': ["Women's health topics | ayna", "Pick a women's health topic to see products, services, reads and what the ayna community says about it."],
  '/explore/resources': ["Women's health guides, with sources | ayna", "Plain-language guides to women's health topics, with sources, from the ayna Library."],
  '/community': ["Community: real women's health product experiences | ayna", "Real experiences with women's health products from the ayna community."],
  '/about': ['About ayna', "Women's wellness products matched to your needs, with the research and reviews beside them. Meet ayna's founders and advisors."],
  '/how-it-works': ["How ayna matches women's health products to you", 'How ayna matches products to you: your profile, the market, the evidence and your shop.'],
  '/how-we-make-money': ['How ayna makes money', 'How ayna earns money, and why it never changes your matches.'],
  '/partners': ['Partner brands | ayna', 'The brands ayna works with, and how partnerships are disclosed.'],
  '/contact': ['Contact ayna', 'Get in touch with the ayna team.'],
  '/privacy-policy': ['Privacy policy | ayna', 'How ayna collects, uses and protects your information.'],
  '/terms-of-use': ['Terms of use | ayna', 'The terms for using ayna.'],
  '/consumer-health-data': ['Consumer health data privacy notice | ayna', 'How ayna handles consumer health data.'],
  '/campus-resources': ['Campus resources | ayna', 'Find verified sexual assault support, advocacy, reporting, medical, and campus resources for your college or university.'],
  '/quiz': ["Get matched to women's health products | ayna", 'Answer six questions and get health products matched to your body.'],
};

/**
 * Personal pages: never in search results. Today, Ask and You show her own
 * health information; the rest are account, admin and one-off flows.
 * vercel.json sends `X-Robots-Tag: noindex` for each (a header works even when
 * a crawler doesn't run the page's JavaScript); the app sets the same rule in
 * a robots meta tag. robots.txt must NOT block these, or crawlers never see
 * the noindex (Google: "Block search indexing with noindex").
 */
export const NOINDEX_SECTIONS = [
  'today', 'ask', 'you', 'recommendations', 'compare', 'comparison', 'omitted', 'recalls', 'tracked', 'screenings',
  'appointment-prep', 'profile', 'text-ayna', 'delete-account', 'health-data', 'auth', 'confirmed',
  'admin', 'internal', 'free-product', 'mobile-preview', 'wrapped', 'join', 'a',
];

/**
 * True for an address that must not be indexed: a personal section above, or
 * a Community member page or post (/community/@handle, /community/p/:id).
 * Posts are members' own health experiences under their handle, so they stay
 * out of search until the founders decide otherwise; the Community hub itself
 * is indexable.
 */
export function isNoindexPath(pathname) {
  const p = String(pathname || '/').replace(/\/+$/, '') || '/';
  const first = p.split('/')[1] || '';
  if (NOINDEX_SECTIONS.includes(first)) return true;
  return /^\/community\/.+/.test(p);
}

/** The organization behind the site (home page JSON-LD). Only facts on file: no social profiles are listed in the code. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE}/#organization`,
    name: 'ayna',
    alternateName: 'ayna Health',
    url: `${SITE}/`,
    logo: `${SITE}/ayna-app-icon-512.png`,
  };
}

/**
 * The site itself (home page JSON-LD). The name is what Google shows as the
 * site name. The search action points at Explore's real search (?q= is read
 * on load); Google retired the sitelinks search box in 2024, so this is for
 * other consumers of schema.org, not a Google feature.
 */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    name: 'ayna',
    alternateName: ['ayna Health', 'aynahealth.co'],
    url: `${SITE}/`,
    publisher: { '@id': `${SITE}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/explore?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Explore > Resources > the read, for a Library read's page. */
export function readBreadcrumbJsonLd(id, headline) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Explore', item: `${SITE}/explore` },
      { '@type': 'ListItem', position: 2, name: 'Resources', item: `${SITE}/explore/resources` },
      { '@type': 'ListItem', position: 3, name: headline },
    ],
  };
}
