import { askPromptGroups } from '../../utils/askGroups.js';

/**
 * The slim row of Ask ayna suggestions under the app header. Suggestions are
 * contextual to the screen she is already on, so the row helps with the next
 * decision instead of repeating generic chat starters everywhere.
 */
export const ASK_SUGGEST_HIDDEN_KEY = 'ayna_ask_suggest_hidden_v2';
export const ASK_SUGGEST_EVENT = 'ayna-ask-suggest-pref';

const SURFACE_PROMPTS = {
  explore: [
    'Help me narrow down what fits me',
    'What should I look for in a product?',
    'Compare the options I’m looking at',
    'What should I avoid for my needs?',
  ],
  browse: [
    'Help me choose between these products',
    'Which option fits my needs best?',
    'What should I check before I buy?',
    'Show me a simpler alternative',
  ],
  library: [
    'Explain this in simpler words',
    'What should I ask my doctor about this?',
    'What does the evidence say?',
    'What products or care relate to this?',
  ],
  community: [
    'What should I look for in these reviews?',
    'Help me compare these experiences',
    'What should I ask before trying this?',
    'Summarize what matters for me',
  ],
  services: [
    'Which type of care fits what I need?',
    'What should I ask before booking?',
    'Help me compare these services',
    'What should I prepare before an appointment?',
  ],
  eco: [
    'Why is this in my ecosystem?',
    'Which part of my routine should I focus on?',
    'What could I simplify in my routine?',
    'Help me understand one of my matches',
  ],
  ecointro: [
    'What can my ecosystem help me organize?',
    'How does ayna choose my matches?',
    'What should I tell ayna about myself?',
    'How do I make my matches more useful?',
  ],
  saved: [
    'Help me choose between my saved products',
    'Which saved option fits my needs best?',
    'What should I compare before I buy?',
    'Which saved items do similar things?',
  ],
};

export function navAskSuggestions({ signedIn = false, hasProfile = false, surface = '', max = 4 } = {}) {
  const limit = Math.max(3, Math.min(4, max));
  const contextual = SURFACE_PROMPTS[String(surface || '').toLowerCase()] || [];
  if (contextual.length) return contextual.slice(0, limit);

  const out = [];
  for (const g of askPromptGroups({ signedIn, hasProfile, max: 5 })) {
    for (const p of g.prompts) if (p?.question && !out.includes(p.question)) out.push(p.question);
  }
  return out.slice(0, limit);
}

export function readSuggestHidden() {
  try { return window.localStorage.getItem(ASK_SUGGEST_HIDDEN_KEY) === '1'; } catch { return false; }
}

export function writeSuggestHidden(hidden = true) {
  try {
    if (hidden) window.localStorage.setItem(ASK_SUGGEST_HIDDEN_KEY, '1');
    else window.localStorage.removeItem(ASK_SUGGEST_HIDDEN_KEY);
    window.dispatchEvent(new CustomEvent(ASK_SUGGEST_EVENT, { detail: { hidden: Boolean(hidden) } }));
  } catch { /* storage unavailable: current component state still updates */ }
}
