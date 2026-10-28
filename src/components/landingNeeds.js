import { useEffect, useMemo, useState } from 'react';
import { ALL_PRODUCTS, itemMatchesMacroGroup } from '../data/catalog.js';
import { isPlaceholderProductImage } from '../utils/resolveProductImage';

// Health needs used by the home page: Explore by need and the
// "Build your ecosystem" picker. Each need resolves to real products.

export const hasPhoto = (p) => p?.image && !isPlaceholderProductImage(p.image, p.type === 'digital') && p.type !== 'digital' && p.category !== 'telehealth';

export const NEEDS = [
  { id: 'period', label: 'Period care', group: 'period' },
  { id: 'pcos', label: 'PMOS', keywords: ['pcos', 'pmos', 'inositol', 'spearmint'] },
  { id: 'vaginal', label: 'Vaginal health', group: 'intimate' },
  { id: 'uti', label: 'UTI support', keywords: ['uti', 'urinary', 'cranberry'] },
  { id: 'fertility', label: 'Fertility', group: 'fertility' },
  { id: 'pelvic', label: 'Pelvic health', group: 'pelvic' },
  { id: 'menopause', label: 'Menopause', group: 'menopause' },
  { id: 'postpartum', label: 'Postpartum', group: 'postpartum' },
];
export const TONES = ['pink', 'mint', 'butter', 'peri'];

function textOf(p) {
  return [p?.name, p?.brand, p?.category, p?.summary, ...(p?.tags || []), ...(p?.healthFunctions || [])].filter(Boolean).join(' ').toLowerCase();
}
export function productsForNeed(need) {
  return ALL_PRODUCTS.filter((p) => hasPhoto(p) && (need.group ? itemMatchesMacroGroup(p, need.group) : need.keywords.some((k) => textOf(p).includes(k))));
}

// Tap a need and it lands in one of three orbit slots (oldest replaced).
// Until the first tap, a demo fills the slots on a loop.
const SLOTS = 3;
const DEMO_STEP = 2400;

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

export function useNeeds() {
  return useMemo(
    () => NEEDS.map((n, i) => ({ ...n, tone: TONES[i % TONES.length], product: productsForNeed(n)[0] || null })).filter((n) => n.product),
    [],
  );
}

/** Shared state for the picker + orbit, with the self-playing demo. */
const EMPTY = { slots: Array(SLOTS).fill(null), ages: Array(SLOTS).fill(0), tick: 0 };

function place(state, id) {
  const slots = [...state.slots];
  const ages = [...state.ages];
  let at = slots.indexOf(null);
  if (at === -1) at = ages.indexOf(Math.min(...ages));
  slots[at] = id;
  ages[at] = state.tick + 1;
  return { slots, ages, tick: state.tick + 1 };
}

// loop: false plays the demo once (fills the three slots, then rests).
export function useEcoSlots(needs, { demo = true, loop = true, step: stepMs = DEMO_STEP } = {}) {
  const reduced = useReducedMotion();
  const [state, setState] = useState(EMPTY);
  const [touched, setTouched] = useState(false);
  const demoOrder = useMemo(() => needs.map((n) => n.id), [needs]);

  // Reduced motion: a still, filled preview instead of the demo.
  const still = useMemo(() => demoOrder.slice(0, SLOTS).reduce(place, EMPTY), [demoOrder]);

  useEffect(() => {
    if (!demo || touched || reduced || !demoOrder.length) return undefined;
    let step = 0;
    let timer;
    const run = () => {
      if (!loop && step >= Math.min(SLOTS, demoOrder.length)) { window.clearInterval(timer); return; }
      const id = demoOrder[step % demoOrder.length];
      step += 1;
      setState((prev) => place(prev, id));
    };
    const first = window.setTimeout(run, 500);
    timer = window.setInterval(() => { if (!document.hidden) run(); }, stepMs);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [demo, loop, stepMs, touched, reduced, demoOrder]);

  const toggle = (id) => {
    if (!touched) {
      // First real tap: clear the demo and start from what she picked.
      setTouched(true);
      setState(place(EMPTY, id));
      return;
    }
    setState((prev) => {
      const at = prev.slots.indexOf(id);
      if (at === -1) return place(prev, id);
      const slots = [...prev.slots]; const ages = [...prev.ages];
      slots[at] = null; ages[at] = 0;
      return { ...prev, slots, ages };
    });
  };

  return { slots: (demo && !touched && reduced ? still : state).slots, toggle, touched };
}
