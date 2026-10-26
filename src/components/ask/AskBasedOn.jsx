import { getSelectedNeeds, useCatalogReady } from '../../data/catalog.js';

/**
 * Ask ayna page (web): what ayna is answering from, in her own words (the
 * goals she chose in setup). Real profile data only; nothing when there is none.
 */
export default function AskBasedOn({ quizResults, variant = 'list' }) {
  useCatalogReady();
  let needs = [];
  try { needs = getSelectedNeeds(quizResults).map((n) => n.phrase || n.label).filter(Boolean); } catch { needs = []; }
  const list = [...new Set(needs)].slice(0, 5);
  if (!list.length) return null;
  const cap = (n) => n.charAt(0).toUpperCase() + n.slice(1);
  // Inside Ask's "How Ask works": one plain line, no coloured chips.
  if (variant === 'plain') return <p className="ay-askp-goals" data-tour="ask-based">Your goals ayna keeps in mind: {list.map(cap).join(', ')}.</p>;
  return (
    <div className="wx-ask__based" data-tour="ask-based">
      <p className="wx-ask__basedh">Your goals ayna keeps in mind</p>
      <ul>{list.map((n) => <li key={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</li>)}</ul>
    </div>
  );
}
