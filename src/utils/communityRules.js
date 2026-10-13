// Community rules: a small, readable text filter shared by the website and the
// app. It marks the exact spans that break a rule so composers can turn them
// red as people type, and it blocks posting while anything is marked.
//
// Principles:
// - Short lists, whole-word matches, tolerant of simple obfuscation
//   (l33t digits/symbols and letters split by spaces, dots, dashes or stars).
// - Body and health words are always fine (vagina, vulva, breast, sex, period,
//   discharge, orgasm, libido, masturbation, ...). See MEDICAL_ALLOWED and the
//   false-positive guards in communityRules.test.js before adding a word.
// - Crisis language (self-harm) is never censored. It returns `crisis: true`
//   so the UI can show a gentle 988 support line and still allow posting.
// - This is a first line, not moderation. Reports and server checks still apply.

export const COMMUNITY_RULES = [
  { id: 'hate', title: 'No hate or slurs', short: 'no slurs or hate speech', detail: 'No slurs or attacks on anyone for who they are.' },
  { id: 'harassment', title: 'Be kind', short: 'no harassment or threats', detail: 'No insults, threats or telling anyone to hurt themselves.' },
  { id: 'sexual', title: 'Keep it non-explicit', short: 'no sexual content', detail: 'Talk about bodies and sex health freely. No porn, nudes or explicit content.' },
  { id: 'spam', title: 'No selling or self-promo', short: 'no promo, shop links or "DM me"', detail: 'No shop or affiliate links, promo codes, "DM me" or business pitches.' },
  { id: 'contact', title: 'Keep contact info private', short: 'no personal contact info', detail: 'No phone numbers, emails, home addresses or social handles.' },
  { id: 'meds', title: 'No buying or selling meds', short: 'no selling or sourcing prescription meds', detail: 'Never sell, swap or source prescription medicine outside a pharmacy.' },
  { id: 'advice', title: 'Share experiences, not prescriptions', short: 'no telling others to change their meds or doses', detail: 'Say what worked for you. Don’t tell others to stop meds or what dose to take.' },
];

const RULES_BY_ID = Object.fromEntries(COMMUNITY_RULES.map((r) => [r.id, r]));

export const CRISIS_LINE = 'If you’re thinking about hurting yourself, you’re not alone. Call or text 988 (US) any time.';

export function ruleMessage(ruleId) {
  const rule = RULES_BY_ID[ruleId];
  return rule ? `This breaks our community rules: ${rule.short}.` : '';
}

// Words that must never be flagged on their own (documentation + test fixture).
export const MEDICAL_ALLOWED = ['vagina', 'vaginal', 'vulva', 'breast', 'breasts', 'nipple', 'sex', 'sexual health', 'period', 'discharge', 'orgasm', 'libido', 'penis', 'clitoris', 'masturbation', 'intercourse', 'anal', 'cervix', 'uterus', 'ovaries', 'testosterone'];

// ── Pattern building ───────────────────────────────────────────────────────

const LEET = { a: 'a4@', b: 'b8', e: 'e3', g: 'g9', i: 'i1!|', l: 'l1|', o: 'o0', s: 's5$', t: 't7+', z: 'z2' };
const esc = (s) => s.replace(/[\\^$.*+?()[\]{}|/-]/g, '\\$&');
const SEP = '[\\s._*\\-]?';

/** "slut" -> s[sep]?l[sep]?u[sep]?t, each letter accepting its l33t forms. */
function fuzzyWord(word) {
  return [...word].map((ch) => {
    if (ch === ' ') return '\\s+';
    const alts = LEET[ch] || ch;
    return alts.length > 1 ? `[${esc(alts)}]` : esc(alts);
  }).join(SEP);
}

// Word boundaries without lookbehind (older iOS Safari can't parse it): the
// leading group eats one non-word char, and we skip it when reporting spans.
const LEAD = '(^|[^a-z0-9])';
const TAIL = '(?=[^a-z0-9]|$)';
const wordsRe = (words) => new RegExp(`${LEAD}(${words.map(fuzzyWord).join('|')})${TAIL}`, 'gi');
const phraseRe = (src) => new RegExp(`${LEAD}(${src})${TAIL}`, 'gi');

// Slurs are kept as a few stems, stored reversed so this file doesn't read as
// a slur list. Each stem also matches simple suffixes (s, z, ed, y). Add a stem
// here only after checking it can't appear inside an ordinary health word.
const SLUR_STEMS_REVERSED = ['reggin', 'aggin', 'toggaf', 'gaf', 'ekik', 'cips', 'nooc', 'knihc', 'drater', 'ynnart'];
const SLUR_STEMS = SLUR_STEMS_REVERSED.map((s) => [...s].reverse().join(''));
const slurRe = new RegExp(`${LEAD}((?:${SLUR_STEMS.map(fuzzyWord).join('|')})(?:s|z|ed|y|ies)?)${TAIL}`, 'gi');

const YOU = '(?:you|u|ya)(?:\\s*(?:’|\')?\\s*(?:re|r))?(?:\\s+(?:are|r))?';
const INSULT = 'bitch|cunt|slut|whore|skank|loser|idiot|moron|retard|pig|cow|ugly|disgusting|worthless|pathetic|trash';
const MEDS = 'adderall|xanax|valium|klonopin|ativan|oxy(?:codone|contin)?|percocet|vicodin|tramadol|codeine|ozempic|wegovy|mounjaro|zepbound|semaglutide|tirzepatide|clomid|letrozole|metformin|spironolactone|accutane|isotretinoin|phentermine|antibiotics|birth control|pills|meds|prescriptions?|rx';
const SOCIAL = '(?:ig|insta|instagram|snap|snapchat|tiktok|telegram|whatsapp|kik|twitter|discord|venmo|cashapp|cash\\s+app)';
const MY_MEDS = '(?:meds|medications?|medicine|pills|birth control|insulin|antidepressants|ssris?|thyroid meds|prescriptions?|treatment|chemo)';

const RULE_PATTERNS = [
  // Hate
  ['hate', slurRe],
  // Harassment and threats
  ['harassment', phraseRe('(?:go\\s+)?kill\\s+(?:your\\s*self|urself|yourselves)|kys|go\\s+die|(?:i\\s*(?:’|\')?ll|i\\s+will|im\\s+gonna|i\\s*(?:’|\')?m\\s+going\\s+to)\\s+(?:kill|hurt|find|beat)\\s+(?:you|u)')],
  ['harassment', phraseRe(`${YOU}\\s+(?:such\\s+)?(?:a\\s+|an\\s+|so\\s+)?(?:stupid\\s+|dumb\\s+|fat\\s+)?(?:${INSULT})`)],
  // Sexual content (not anatomy or sexual health)
  ['sexual', wordsRe(['porn', 'porno', 'nudes', 'nsfw', 'onlyfans', 'sexting', 'blowjob', 'handjob', 'pussy', 'xxx', 'camgirl'])],
  ['sexual', phraseRe('send\\s+(?:me\\s+)?(?:pics|nudes|photos)|dick\\s*pics?|hook\\s*up\\s+with\\s+me')],
  // Spam and self-promotion
  ['spam', phraseRe('dm\\s+me|dm\\s+for|message\\s+me\\s+(?:for|to)|inbox\\s+me|link\\s+in\\s+(?:my\\s+)?bio|check\\s+(?:out\\s+)?my\\s+(?:page|profile|bio|shop|store)|follow\\s+me\\s+(?:on|@)|use\\s+(?:my\\s+)?code|(?:promo|discount|coupon|referral|affiliate)\\s+(?:code|link)|code\\s+[a-z0-9]{3,}\\s+for\\s+\\d+\\s*%')],
  ['spam', phraseRe('business\\s+opportunity|be\\s+your\\s+own\\s+boss|join\\s+my\\s+team|passive\\s+income|work\\s+from\\s+home\\s+and\\s+(?:earn|make)|make\\s+money\\s+from\\s+home|boss\\s*babe')],
  ['spam', /(^|[^a-z0-9])((?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)*(?:amazon\.[a-z.]+|amzn\.to|etsy\.com|ebay\.[a-z.]+|myshopify\.com|linktr\.ee|beacons\.ai|bit\.ly|tinyurl\.com|t\.co|ow\.ly|shopmy\.us|ltk\.app|liketk\.it)(?:\/[^\s]*)?)(?=[^a-z0-9]|$)/gi],
  ['spam', /(^|[^a-z0-9])(https?:\/\/[^\s]*(?:[?&](?:ref|aff|affiliate|coupon|discount)=|\/shop\/)[^\s]*)(?=\s|$)/gi],
  // Personal contact info
  ['contact', /(^|[^a-z0-9._%+-])([a-z0-9._%+-]+(?:@|\s*[([]at[)\]]\s*)[a-z0-9-]+(?:(?:\.|\s*[([]dot[)\]]\s*)[a-z0-9-]+)+)(?=[^a-z0-9]|$)/gi],
  ['contact', /(^|[^0-9+])((?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})(?=[^0-9]|$)/g],
  ['contact', phraseRe('\\d{1,5}\\s+(?:[a-z0-9]+\\s+){1,3}(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|drive|court|terrace)\\.?(?:\\s*(?:apt|apartment|unit|#)\\s*[a-z0-9-]+)?')],
  ['contact', phraseRe(`${SOCIAL}\\s*(?:(?:is|handle|username|name)\\s*)?(?:[:=\\-]\\s*@?|@)[a-z0-9_.]{3,}|add\\s+me\\s+on\\s+(?:ig|insta|instagram|snap|snapchat|tiktok|telegram|whatsapp|discord)|(?:text|call|whatsapp)\\s+me\\s+(?:at|on)`)],
  // Buying, selling or sourcing prescription meds
  ['meds', phraseRe(`sell(?:ing)?\\s+(?:you\\s+|u\\s+)?(?:my|some|extra|spare|leftover|your|ur)\\s+(?:extra\\s+|spare\\s+|leftover\\s+)?(?:${MEDS})|(?:dm|message|hmu|text)\\s+(?:me\\s+)?for\\s+(?:${MEDS})`)],
  ['meds', phraseRe(`(?:extra|spare|leftover)\\s+(?:${MEDS})\\s+(?:for\\s+sale|to\\s+sell|if\\s+any(?:one|body)\\s+(?:needs|wants))|(?:any(?:one|body)|who(?:\\s*(?:’|')?s|\\s+is)?)\\s+(?:selling|got\\s+extra|have\\s+extra|has\\s+extra|have\\s+spare|has\\s+spare)\\s+(?:${MEDS})`)],
  // Dangerous medical advice aimed at someone else
  ['advice', phraseRe(`(?:stop|quit|ditch|skip|come\\s+off|get\\s+off|throw\\s+out|flush)\\s+(?:taking\\s+)?(?:your|ur|all\\s+your)\\s+${MY_MEDS}`)],
  ['advice', phraseRe(`(?:you|u)\\s+(?:don\\s*(?:’|')?t|do\\s+not|dont)\\s+need\\s+(?:your\\s+|ur\\s+|any\\s+)?${MY_MEDS}`)],
  ['advice', phraseRe('(?:you|u)\\s+(?:should|need\\s+to|can|could|must|have\\s+to|gotta)\\s+(?:just\\s+)?(?:take|double|triple|increase|up)\\s+(?:your\\s+|ur\\s+)?(?:dose|dosage|\\d+(?:\\.\\d+)?\\s*(?:mg|mcg|g|ml|iu|units|pills|tablets|capsules))')],
  ['advice', phraseRe('(?:double|triple)\\s+(?:up\\s+)?(?:on\\s+)?(?:your|ur)\\s+(?:dose|dosage|meds|pills|medication)')],
];

const CRISIS_RE = /(^|[^a-z])(kill(?:ing)?\s+my\s*self|end(?:ing)?\s+my\s+life|end(?:ing)?\s+it\s+all|suicid(?:e|al)|want\s+to\s+die|wanna\s+die|self[\s-]?harm(?:ing)?|harm(?:ing)?\s+my\s*self|no\s+reason\s+to\s+live|don\s*(?:’|')?t\s+want\s+to\s+(?:be\s+here|live)|better\s+off\s+dead)(?=[^a-z]|$)/i;

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Check community text.
 * Returns { issues: [{ start, end, rule }], rule, message, crisis, blocked }.
 * `issues` are sorted, non-overlapping spans in the original string.
 */
export function checkCommunityText(text) {
  const value = String(text || '');
  const found = [];
  if (value.trim()) {
    for (const [rule, re] of RULE_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(value))) {
        const lead = m[1] ? m[1].length : 0;
        const start = m.index + lead;
        const end = start + m[2].length;
        if (end > start) found.push({ start, end, rule });
        if (m[0].length === 0) re.lastIndex += 1;
      }
    }
  }
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  const issues = [];
  for (const f of found) {
    const last = issues[issues.length - 1];
    if (last && f.start < last.end) { last.end = Math.max(last.end, f.end); continue; }
    issues.push({ ...f });
  }
  const rule = issues[0]?.rule || null;
  return { issues, rule, message: rule ? ruleMessage(rule) : '', crisis: CRISIS_RE.test(value), blocked: issues.length > 0 };
}

/** True when any of the given strings breaks a rule (posting stays disabled). */
export function breaksCommunityRules(...texts) {
  return texts.some((t) => checkCommunityText(t).blocked);
}

/** Split text into [{ text, flagged, rule }] segments for the mirror overlay. */
export function segmentCommunityText(text, issues = checkCommunityText(text).issues) {
  const value = String(text || '');
  const out = [];
  let at = 0;
  for (const i of issues) {
    if (i.start > at) out.push({ text: value.slice(at, i.start), flagged: false });
    out.push({ text: value.slice(i.start, i.end), flagged: true, rule: i.rule });
    at = i.end;
  }
  if (at < value.length) out.push({ text: value.slice(at), flagged: false });
  return out;
}
