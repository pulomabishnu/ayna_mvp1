import { useState } from 'react';
import { getProductById, getSelectedNeeds } from '../../data/catalog.js';
import ProductTileImage from '../ProductTileImage.jsx';
import './starter-routine.css';

/**
 * A starter routine for anxiety (Notion AYNA-334, the team's list, Nov 12): offered to anyone who picked
 * Anxiety, as the ayna team's suggestions, not a treatment. She adds what she likes, takes out what she
 * doesn't, or hides the whole routine. Products come from the catalog by id and only show when listed;
 * the two items that are habits, not products, are written as habits.
 */
const HIDE_KEY = 'ayna_starter_routine_anxiety_hidden';
const ITEMS = [
  { key: 'roller', title: 'A scent you like, on your wrists', text: 'An essential-oil roll-on to keep in your bag.' },
  { key: 'diffuser', title: 'A diffuser at home', text: 'A scent in the room when you wind down.', productId: 'p-aura-cacia-aura-cacia-aromatherapy-room-diffuser' },
  { key: 'sour', title: 'Something sour or minty to focus on', text: 'A sour candy or a breath strip gives your senses one strong thing to notice.' },
  { key: 'journal', title: 'A few minutes of journaling', text: 'Write down what is on your mind.', productId: 'p-intelligent-change-the-five-minute-journal' },
  { key: 'meditate', title: 'A guided meditation app', text: 'A short session, whenever you want one.', productIds: ['d-headspace', 'd-calm'] },
];
const NIMH = 'https://www.nimh.nih.gov/health/topics/anxiety-disorders';

const readHidden = () => { try { return JSON.parse(localStorage.getItem(HIDE_KEY) || 'null'); } catch { return null; } };

export function wantsAnxietyRoutine(quizAnswers) {
  try { return getSelectedNeeds(quizAnswers || {}).some((n) => n.id === 'mood.general_anxiety'); } catch { return false; }
}

export default function StarterRoutine({ quizAnswers, myProductIds = [], onAddToRoutine = null, onOpenProduct = null }) {
  const [hidden, setHidden] = useState(readHidden);
  const save = (next) => { setHidden(next); try { localStorage.setItem(HIDE_KEY, JSON.stringify(next)); } catch { /* private mode */ } };
  if (!wantsAnxietyRoutine(quizAnswers) || hidden === true) return null;
  const removed = new Set(Array.isArray(hidden) ? hidden : []);
  const owned = new Set(myProductIds);
  const rows = ITEMS.filter((it) => !removed.has(it.key)).map((it) => ({ ...it, products: [it.productId, ...(it.productIds || [])].filter(Boolean).map((id) => getProductById(id)).filter(Boolean) }));
  return (
    <section className="ay-sr" aria-labelledby="ay-sr-h">
      <div className="ay-sr__head">
        <h3 id="ay-sr-h">A starter routine for anxiety</h3>
        <button type="button" className="ay-sr__hide" onClick={() => save(true)}>Hide</button>
      </div>
      <p className="ay-sr__lead">Ideas from the ayna team. Keep what you like and take out the rest.</p>
      <ul className="ay-sr__list">
        {rows.map((it) => (
          <li key={it.key} className="ay-sr__item">
            <div className="ay-sr__txt"><b>{it.title}</b><span>{it.text}</span></div>
            {it.products.map((p) => (
              <div key={p.id} className="ay-sr__prod">
                <button type="button" className="ay-sr__open" onClick={() => onOpenProduct?.(p)}>
                  <span className="ay-sr__img"><ProductTileImage product={p} alt="" letterNode={<span aria-hidden="true">{(p.brand || p.name || '?').slice(0, 1)}</span>} /></span>
                  <span className="ay-sr__name">{p.name}</span>
                </button>
                {onAddToRoutine && <button type="button" className="ay-sr__add" disabled={owned.has(p.id)} onClick={() => onAddToRoutine(p)}>{owned.has(p.id) ? 'In your routine' : 'Add'}</button>}
              </div>
            ))}
            <button type="button" className="ay-sr__remove" aria-label={`Take “${it.title}” out of the routine`} onClick={() => save([...removed, it.key])}>Not for me</button>
          </li>
        ))}
      </ul>
      <p className="ay-sr__fine">Not medical advice. If anxiety gets in the way of your day, talk to a clinician. <a href={NIMH} target="_blank" rel="noopener noreferrer">About anxiety (NIMH)</a></p>
    </section>
  );
}
