// One way to show a price on every card (web and app). Catalog prices are
// free text ("$11.99 (list $16, pack of 4)", "~$20-35", "Free through
// employer / $15-35 per session", "€7.95", "Available in US"); this keeps the
// short, comparable part as the main line and moves the rest to a small
// second line. Nothing is invented: unknown prices say "Price at retailer".

const dash = (t) => t.replace(/(\d)\s*-\s*(\$?\d)/g, '$1–$2');

export function formatPrice(item) {
  const raw = String(item?.price || item?.stage || '').trim();
  if (!raw || !/\d|free|covered/i.test(raw)) return { main: 'Price at retailer', sub: '' };

  // A deposit to join a waitlist is not what the product costs.
  if (/waitlist|deposit/i.test(raw) && !/\bthen\b/i.test(raw)) return { main: 'Waitlist', sub: raw.replace(/\$(\d+)\.00\b/g, '$$$1') };

  // Whole-dollar prices drop the cents ("$49.00" -> "$49").
  let text = dash(raw.replace(/\s+/g, ' ')).replace(/\$(\d[\d,]*)\.00\b/g, '$$$1');
  let sub = '';

  // Approximate prices: "~$20-35" -> "About $20–35"
  text = text.replace(/^~\s*/, 'About ');

  // Several sizes ("$24.99 (50 mL) · $12.99 (trial size)"): the first is the
  // main line, the others go to the second line whole (the old one-group
  // match split them mid-parenthesis: "50 mL) · $12.99 (1.0 fl oz").
  const sizes = text.split(/\s+·\s+/);
  const moreSizes = sizes.length > 1 && /\$/.test(sizes[1]) ? sizes.slice(1).join(' · ') : '';
  if (moreSizes) text = sizes[0];

  // "$12 for 100 softgels" / "$25-40 for 300-500 g": the price is the main
  // line, the size moves to the second line, so cards just show the price.
  const forSize = text.match(/^((?:About\s+)?[$€£][\d.,]+(?:–[$€£]?[\d.,]+)?)\s+for\s+(.+)$/i);
  if (forSize) {
    text = forSize[1];
    sub = forSize[2];
  }

  // Parenthetical detail -> second line
  const paren = text.match(/^(.*?)\s*\(([^()]+)\)\s*(.*)$/);
  if (paren) {
    text = `${paren[1]} ${paren[3]}`.trim();
    sub = paren[2].replace(/,\s*/g, ' · ');
  }

  // Alternatives ("A or B", "A / B", "A; B") -> first one main, rest second line
  const split = text.split(/\s+\/\s+|;\s+|\s+or\s+/i);
  if (split.length > 1) {
    const usedOr = /\s+or\s+/i.test(text);
    text = split[0].trim();
    sub = [`${usedOr ? 'or ' : ''}${split.slice(1).join(' or ')}`, sub].filter(Boolean).join(' · ');
  }
  if (/^covered\b/i.test(text) && text.length > 14) { sub = [text, sub].filter(Boolean).join(' · '); text = 'Often covered'; }

  // Long sentences ("Covered by many employers & health plans") stay short
  if (text.length > 26) {
    const short = text.split(/,\s+|\.\s+/)[0];
    if (short.length < text.length) { sub = [text.slice(short.length).replace(/^[,.]\s*/, ''), sub].filter(Boolean).join(' · '); text = short; }
  }

  if (/€/.test(text) && !/\$/.test(text)) sub = ['EU price', sub].filter(Boolean).join(' · ');
  if (/^free\b/i.test(text) && text.length > 4) { sub = [text.slice(4).trim(), sub].filter(Boolean).join(' · '); text = 'Free'; }

  // Retailer-only notes are not prices.
  if (/^(check|see)\b.*\b(retailer|amazon|price)/i.test(text) || /^see amazon$/i.test(text)) { text = 'Price at retailer'; }
  if (/^varies\b/i.test(text)) { sub = [text, sub].filter(Boolean).join(' · '); text = 'Price varies'; }

  // Cards show just the price. Anything after the price token ("per pair",
  // "on Amazon", "one-time purchase", "+ $6/month", "monitor + strips") moves
  // to the second line, word for word.
  const lead = text.match(/^((?:About\s+)?[$€£][\d,]+(?:\.\d+)?(?:–[$€£]?[\d,]+(?:\.\d+)?)?(?:\s*\/\s*(?:mo|month|visit|session|year|yr|week|wk)\b)?)(?![\d./]|,\d)(?:,?\s+(.+))?$/i);
  if (lead && lead[2]) {
    text = lead[1];
    sub = [lead[2].replace(/^[,·]\s*/, ''), sub].filter(Boolean).join(' · ');
  }

  if (moreSizes) sub = [sub, moreSizes].filter(Boolean).join(' · ');
  // A bare count ("$10 for 18") read as a rating on cards (P1-4): name the unit.
  sub = labelBareCount(sub, item);
  return { main: text, sub };
}

// The unit a pack count is in, from the product's own name and category.
const UNITS = [
  [/liner/i, 'liners'], [/tampon/i, 'tampons'], [/\bpads?\b|pad\b|maxi|overnight/i, 'pads'], [/wipe/i, 'wipes'],
  [/strip/i, 'strips'], [/\btests?\b|ovulation|pregnancy test/i, 'tests'], [/softgel/i, 'softgels'], [/gumm/i, 'gummies'],
  [/capsule|caps\b/i, 'capsules'], [/tablet|caplet/i, 'tablets'], [/patch/i, 'patches'], [/condom/i, 'condoms'],
  [/supposit|insert/i, 'inserts'], [/sachet|packet|stick/i, 'packets'],
];
function unitFor(item) {
  const name = `${item?.name || ''}`;
  const cat = `${item?.category || ''} ${item?.subcategory || ''}`;
  for (const [re, unit] of UNITS) if (re.test(name)) return unit;
  for (const [re, unit] of UNITS) if (re.test(cat)) return unit;
  return '';
}
export function labelBareCount(sub, item) {
  const parts = String(sub || '').split(' · ');
  const m = parts[0].match(/^(\d[\d,]*(?:–\d[\d,]*)?)$/);
  if (!m) return sub;
  const unit = unitFor(item);
  parts[0] = unit ? `${m[1]} ${unit}` : `pack of ${m[1]}`;
  return parts.join(' · ');
}
