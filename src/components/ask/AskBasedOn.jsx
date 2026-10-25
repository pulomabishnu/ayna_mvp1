import { getSelectedNeeds, useCatalogReady } from '../../data/catalog.js';

/**
 * Ask ayna page (web): what ayna is answering from, in her own words (the
 * goals she chose in setup). Real profile data only; nothing when there is none.
 */
export default function AskBasedOn({ quizResults }) {
  useCatalogReady();
  let needs = [];
  try { needs = getSelectedNeeds(quizResults).map((n) => n.phrase || n.label).filter(Boolean); } catch { needs = []; }
  const list = [...new Set(needs)].slice(0, 5);
  if (!list.length) return null;
  return (
    <div className="wx-ask__based">
      <p className="wx-ask__basedh">Your goals ayna keeps in mind</p>
      <ul>{list.map((n) => <li key={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</li>)}</ul>
    </div>
  );
}
