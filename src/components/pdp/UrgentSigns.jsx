import { urgentSignsFor } from '../../utils/urgentSigns';

const ACTION = { 'call 911': 'Call 911', 'go to ER': 'Go to the ER', 'call your clinician today': 'Call your clinician today' };

/** "Get help now" signs for this kind of product. Renders nothing for most products. */
export default function UrgentSigns({ product, flags = null }) {
  const list = flags || urgentSignsFor(product);
  if (!list.length) return null;
  return (
    <section className="ay-urgent" aria-label="When to get help now">
      <h3 className="ay-urgent__h">When to get help now</h3>
      <ul className="ay-urgent__list">
        {list.map((f) => (
          <li key={f.id}>
            <p className="ay-urgent__what"><b>{ACTION[f.action] || f.action}</b> for {f.condition.charAt(0).toLowerCase() + f.condition.slice(1)}:</p>
            <ul className="ay-urgent__signs">{f.signs.map((s) => <li key={s}>{s}</li>)}</ul>
            <a className="ay-urgent__src" href={f.source_url} target="_blank" rel="noopener noreferrer">Source: {new URL(f.source_url).hostname.replace(/^www\./, '')}</a>
          </li>
        ))}
      </ul>
      {list.some((f) => /psychosis/.test(f.id)) && <p className="ay-urgent__note">Thoughts of harming yourself? Call or text 988, any time.</p>}
    </section>
  );
}
