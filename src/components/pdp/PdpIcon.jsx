/**
 * The product page's one line-icon set: 24px grid, 1.75 stroke, round caps,
 * currentColor. Decorative only (aria-hidden); the text beside it carries the meaning.
 */
const PATHS = {
  // Format: a box.
  format: <><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></>,
  // Size or count: stacked layers.
  size: <><path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" /><path d="m3 12 9 4.5 9-4.5" /><path d="m3 16.5 9 4.5 9-4.5" /></>,
  // FSA/HSA: a card.
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19M6.5 15h4" /></>,
  // Price per unit: a tag.
  tag: <><path d="M3 12.2V4.5A1.5 1.5 0 0 1 4.5 3h7.7l8.8 8.8a1.5 1.5 0 0 1 0 2.1l-7.1 7.1a1.5 1.5 0 0 1-2.1 0L3 12.2Z" /><circle cx="8" cy="8" r="1.5" /></>,
  // Time.
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  // Who it's for.
  person: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6" /></>,
  // Safety.
  shield: <><path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6L12 3Z" /><path d="M12 8.5v4.5M12 16v.5" /></>,
  // How to use: numbered steps.
  steps: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 5.5 5 5v3M4 11h2l-2 2.5h2M4 17h2l-1 1 1 1H4" /></>,
  // Research paper.
  paper: <><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>,
  // Clinical guidance: stethoscope.
  stethoscope: <><path d="M6 3v6a5 5 0 0 0 10 0V3" /><path d="M11 14v2a4 4 0 0 0 8 0v-1.5" /><circle cx="19" cy="12.5" r="2" /></>,
  // Regulators: a columned building.
  regulator: <><path d="M3 9.5 12 4l9 5.5H3Z" /><path d="M5.5 10v8M10 10v8M14 10v8M18.5 10v8M3 20.5h18" /></>,
  // Community: two people.
  community: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3 20c.8-3.4 3.2-5.2 6-5.2s5.2 1.8 6 5.2" /><path d="M15.5 5.6a3.2 3.2 0 0 1 0 6.1M17.5 14.9c1.8.7 3 2.4 3.5 5.1" /></>,
  // Brand material: a megaphone.
  brand: <><path d="M3.5 10v4h3l8 4.5v-13L6.5 10h-3Z" /><path d="M18 9a4 4 0 0 1 0 6" /></>,
  // Wash or clean: a drop.
  drop: <path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5Z" />,
  // Insert or apply: an arrow in.
  in: <><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" /><path d="M5 20h14" /></>,
  // Remove or empty: an arrow out.
  out: <><path d="M12 15V3M7.5 7.5 12 3l4.5 4.5" /><path d="M5 20h14" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  // PDP audit 8.7: the one SVG set (plus, check, ask, recycle, receipt, calendar, external, alert).
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  ask: <path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.2A7.5 7.5 0 1 1 20 11.5Z" />,
  recycle: <><path d="M7 19H4.5a1.5 1.5 0 0 1-1.3-2.25L5.5 13" /><path d="M12.5 19H20a1.5 1.5 0 0 0 1.3-2.25L19 13" /><path d="m9 5.6 1.7-2.85a1.5 1.5 0 0 1 2.6 0L17 9" /><path d="m10 16-2.5 3 2.5 3M3 10.5l2.5 2.5 3-1M15 8.5l2 .5.5-3" /></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export default function PdpIcon({ name, size = 22, className = '' }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg className={`ay-ico ${className}`.trim()} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {d}
    </svg>
  );
}
