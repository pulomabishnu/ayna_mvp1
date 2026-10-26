import { askPromptGroups } from '../../utils/askGroups.js';

/**
 * The slim row of Ask ayna suggestions under the top bar on Today, Shop,
 * Services, Community and Library (founder, Oct 26: "put things around to be
 * like oh u can ask ayna this like suggestions but if it takes too much space
 * like hide it"). The questions are Ask's own starters (askGroups.js), so
 * nothing new is claimed; 3 or 4, one line, and Hide collapses the row for
 * the rest of the session.
 */
export const ASK_SUGGEST_HIDDEN_KEY = 'ayna_ask_suggest_hidden';

export function navAskSuggestions({ signedIn = false, hasProfile = false, max = 4 } = {}) {
  const out = [];
  for (const g of askPromptGroups({ signedIn, hasProfile, max: 5 })) {
    for (const p of g.prompts) if (p?.question && !out.includes(p.question)) out.push(p.question);
  }
  return out.slice(0, Math.max(3, Math.min(4, max)));
}

export function readSuggestHidden() {
  try { return window.sessionStorage.getItem(ASK_SUGGEST_HIDDEN_KEY) === '1'; } catch { return false; }
}

export function writeSuggestHidden() {
  try { window.sessionStorage.setItem(ASK_SUGGEST_HIDDEN_KEY, '1'); } catch { /* storage off: hidden for this page only */ }
}
