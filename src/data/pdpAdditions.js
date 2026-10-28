/**
 * ayna's own additions to product pages (not team copy). Each one is a fact
 * from a government or regulator page that was read on the date given, shown
 * next to the team's text and labelled as ayna's check. Nothing here changes
 * or replaces a team-written field (src/data/teamCopy.lock.test.js).
 *
 * Added 2026-10-21 for the product page audit. Every URL below was opened
 * and read that day; the quoted facts are from the page itself.
 */

const CHECKED = '2026-10-21';

export const ADDITION_SOURCES = {
  fdaSupplements: { url: 'https://www.fda.gov/news-events/rumor-control/facts-about-dietary-supplements', publisher: 'FDA', title: 'Facts about dietary supplements' },
  fdaSunscreen: { url: 'https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun', publisher: 'FDA', title: 'Sunscreen: how to help protect your skin from the sun' },
  tamponRule: { url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-801/subpart-H/section-801.430', publisher: 'FDA rule (21 CFR 801.430)', title: 'User labeling for menstrual tampons' },
  ftcHbnr: { url: 'https://www.ftc.gov/business-guidance/resources/health-breach-notification-rule-basics-business', publisher: 'FTC', title: 'Health Breach Notification Rule: the basics for business' },
  fdaRecalls: { url: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts', publisher: 'FDA', title: 'Recalls, market withdrawals and safety alerts' },
  odsBasics: { url: 'https://ods.od.nih.gov/factsheets/WYNTK-Consumer/', publisher: 'NIH Office of Dietary Supplements', title: 'What you need to know about dietary supplements' },
  clueHelp: { url: 'https://support.helloclue.com/hc/en-us/articles/29048867548061-How-Clue-handles-data-privacy', publisher: 'Clue Help Center', title: 'How Clue handles data privacy' },
};

// NIH consumer fact sheets that exist on the ODS site map (checked 2026-10-21).
const ODS_SHEETS = [
  { re: /\bchromium\b/i, name: 'Chromium', slug: 'Chromium', note: 'NIH says that if you take medicine for diabetes, including insulin, chromium supplements might cause low blood sugar.' },
  { re: /\bashwagandha\b/i, name: 'Ashwagandha', slug: 'Ashwagandha' },
  { re: /\bbiotin\b/i, name: 'Biotin', slug: 'Biotin' },
  { re: /\bcalcium\b/i, name: 'Calcium', slug: 'Calcium' },
  { re: /\bcholine\b/i, name: 'Choline', slug: 'Choline' },
  { re: /\bboron\b/i, name: 'Boron', slug: 'Boron' },
  { re: /\bcarnitine\b/i, name: 'Carnitine', slug: 'Carnitine' },
];

const isSupplement = (p) => ['supplement', 'vitamin'].includes(p?.category) || /dietary supplement/i.test(String(p?.safety?.fdaStatus || ''));
const isSunscreen = (p) => (p?.tags || []).some((t) => /^(spf|sunscreen)$/i.test(t)) || /\bspf\b|sunscreen/i.test(String(p?.name || ''));
const cites = (p, url) => JSON.stringify(p || {}).includes(url);

/** ayna's additions for one product: [{ id, group, title, items, table, source, checked, tone }]. */
export function pdpAdditionsFor(product) {
  const p = product || {};
  const out = [];
  const add = (x) => out.push({ checked: CHECKED, ...x });

  if (isSupplement(p)) {
    add({
      id: 'fda-supplements', group: 'safety', title: 'How supplements are regulated',
      items: [
        'The FDA does not approve dietary supplements for safety and effectiveness, or their labels, before they are sold.',
        'The company that sells a supplement is responsible for making sure it is safe and accurately labelled.',
      ],
      source: ADDITION_SOURCES.fdaSupplements,
    });
    const text = `${p.ingredients || ''} ${(p.ingredientScience || []).map((i) => i?.name).join(' ')} ${p.name || ''}`;
    const sheets = ODS_SHEETS.filter((s) => s.re.test(text));
    add({
      id: 'ods', group: 'research', title: 'Ingredient fact sheets from the NIH',
      items: [
        ...sheets.filter((s) => s.note).map((s) => s.note),
        'NIH fact sheets explain what an ingredient does, how much adults need, and which medicines it can interact with.',
      ],
      links: [
        ...sheets.map((s) => ({ url: `https://ods.od.nih.gov/factsheets/${s.slug}-Consumer/`, publisher: 'NIH Office of Dietary Supplements', title: `${s.name}: fact sheet for consumers` })),
        ADDITION_SOURCES.odsBasics,
      ],
    });
  }

  if (p.category === 'tampon') {
    add({
      id: 'tampon-absorbency', group: 'how', title: 'What the absorbency words mean',
      intro: 'Every US tampon box uses the same words for how much a tampon holds. Use the lowest one that handles your flow, which lowers the risk of toxic shock syndrome.',
      table: [['Light', '6 g or less'], ['Regular', '6 to 9 g'], ['Super', '9 to 12 g'], ['Super plus', '12 to 15 g'], ['Ultra', '15 to 18 g']],
      source: ADDITION_SOURCES.tamponRule,
    });
  }

  if (isSunscreen(p) && !cites(p, 'sunscreen-how-help-protect-your-skin-sun')) {
    add({
      id: 'fda-sunscreen', group: 'how', title: 'FDA sunscreen basics',
      items: [
        'Choose a broad-spectrum sunscreen with an SPF of at least 15.',
        'Apply it 15 minutes before going in the sun.',
        'Reapply at least every two hours, and more often if you are swimming or sweating.',
        'No sunscreen is waterproof. Water-resistant ones say whether they last 40 or 80 minutes.',
        'Sunscreen is not recommended for babies under six months. Keep them out of the sun instead.',
      ],
      source: ADDITION_SOURCES.fdaSunscreen,
    });
  }

  if (p.type === 'digital') {
    add({
      id: 'ftc-hbnr', group: 'privacy', title: 'If an app’s health data leaks',
      items: [
        'Health apps that HIPAA doesn’t cover can fall under the FTC’s Health Breach Notification Rule instead.',
        'After a breach of people’s identifying health information, the rule requires the company to tell the people affected, the FTC, and sometimes the media.',
      ],
      source: ADDITION_SOURCES.ftcHbnr,
    });
  }

  if (p.id === 'd-clue') {
    add({
      id: 'clue-privacy', group: 'privacy', title: 'What Clue says about your data', tone: 'brand',
      items: [
        'Clue says it has never shared any member’s private health data with ad networks and never will.',
        'Clue says every member’s data, wherever they live, is protected under the EU’s GDPR privacy law.',
      ],
      note: 'From Clue’s own help center (September 2026). ayna hasn’t verified it.',
      source: ADDITION_SOURCES.clueHelp,
    });
  }

  if (p.type !== 'digital' && p.category !== 'telehealth') {
    add({
      id: 'recall-search', group: 'recall', title: 'Check for new recalls',
      items: ['Recalls can happen after we check. The FDA lists current recalls and safety alerts.'],
      source: ADDITION_SOURCES.fdaRecalls,
    });
  }
  return out;
}
