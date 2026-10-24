// Dark mode (brand dark) swaps the two accent colours, the way it already
// swaps butter and espresso: whatever is sky blue in light mode turns rose
// pink, and whatever is rose pink turns sky blue (Ameera, Oct 17).
//
// The site's CSS writes these colours directly in hundreds of rules, so this
// reads the loaded stylesheets once, and for every rule that uses either
// colour adds a copy of that rule (same selector, same !important) with the
// colours swapped, in one extra stylesheet at the end. Same selector + later
// position = the copy wins, nothing else changes. Rules written specifically
// for brand dark are left alone (they were designed for the dark page).
// Removing the extra sheet restores light mode exactly.

const SKY = [118, 158, 190];
const ROSE = [247, 186, 221];
const SHEET_ID = 'ay-dark-accent-swap';

const rgbRe = (c) => new RegExp(`rgba?\\(\\s*${c[0]}\\s*,\\s*${c[1]}\\s*,\\s*${c[2]}\\s*([,)])`, 'gi');
const HEX_SKY = /#769ebe\b/gi;
const HEX_ROSE = /#f7badd\b/gi;
const MARK = '\u0000';
const SAFETY_SEL = /safety|alert|warn|caution|recall|sensitivity|danger|-err\b|error/i;

/** Swap sky and rose in one CSS value (hex or rgb/rgba). Exported for tests. */
export function swapAccents(value) {
  const v = String(value);
  if (!/769ebe|f7badd|118,\s*158,\s*190|247,\s*186,\s*221/i.test(v)) return null;
  return v
    .replace(HEX_SKY, `${MARK}R`).replace(HEX_ROSE, '#769ebe').replace(new RegExp(`${MARK}R`, 'g'), '#f7badd')
    .replace(rgbRe(SKY), (m, end) => `${m.startsWith('rgba') ? 'rgba' : 'rgb'}(${MARK}ROSE${end}`)
    .replace(rgbRe(ROSE), (m, end) => `${m.startsWith('rgba') ? 'rgba' : 'rgb'}(${SKY.join(', ')}${end}`)
    .replace(new RegExp(`${MARK}ROSE`, 'g'), ROSE.join(', '));
}

function swappedRule(rule) {
  const sel = rule.selectorText;
  if (!sel || /brand-dark/.test(sel)) return '';
  // Safety alerts stay pink-family in both themes (pink means "careful"
  // everywhere, matching the app), so their rules are never swapped.
  if (SAFETY_SEL.test(sel)) return '';
  const style = rule.style;
  const decls = [];
  for (let i = 0; i < style.length; i += 1) {
    const prop = style[i];
    const val = style.getPropertyValue(prop);
    const swapped = swapAccents(val);
    if (swapped == null || swapped === val) continue;
    const imp = style.getPropertyPriority(prop) ? ' !important' : '';
    decls.push(`${prop}: ${swapped}${imp}`);
  }
  return decls.length ? `${sel} { ${decls.join('; ')}; }` : '';
}

function collect(rules, out) {
  for (const rule of rules) {
    if (rule.selectorText !== undefined && rule.style) {
      const css = swappedRule(rule);
      if (css) out.push(css);
    } else if (rule.cssRules && (rule.media || rule.conditionText !== undefined)) {
      const inner = [];
      collect(rule.cssRules, inner);
      if (inner.length) {
        const cond = rule.media ? `@media ${rule.media.mediaText}` : `@supports ${rule.conditionText}`;
        out.push(`${cond} { ${inner.join('\n')} }`);
      }
    }
  }
}

function build() {
  const out = [];
  for (const sheet of Array.from(document.styleSheets)) {
    if (sheet.ownerNode?.id === SHEET_ID) continue;
    let rules;
    try { rules = sheet.cssRules; } catch { continue; } // cross-origin (fonts)
    if (rules) collect(rules, out);
  }
  return out.join('\n');
}

let observer = null;
let timer = null;

function render() {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(SHEET_ID);
  const css = build();
  if (!el) { el = document.createElement('style'); el.id = SHEET_ID; }
  el.textContent = css;
  document.head.appendChild(el); // always last
}

/** Turn the swap on (brand dark) or off (light). Safe to call repeatedly. */
export function setDarkAccentSwap(on) {
  if (typeof document === 'undefined') return;
  if (!on) {
    observer?.disconnect(); observer = null;
    document.getElementById(SHEET_ID)?.remove();
    return;
  }
  render();
  if (!observer && typeof MutationObserver !== 'undefined') {
    // Lazy-loaded pages bring their own CSS; rebuild when a stylesheet arrives.
    observer = new MutationObserver((muts) => {
      const added = muts.some((m) => [...m.addedNodes].some((n) => n.id !== SHEET_ID && (n.tagName === 'STYLE' || n.tagName === 'LINK')));
      if (!added) return;
      clearTimeout(timer);
      timer = setTimeout(render, 120);
    });
    observer.observe(document.head, { childList: true });
  }
}
