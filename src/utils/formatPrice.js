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

  // Parenthetical detail -> second line
  const paren = text.match(/^(.*?)\s*\((.+)\)\s*(.*)$/);
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

  return { main: text, sub };
}
