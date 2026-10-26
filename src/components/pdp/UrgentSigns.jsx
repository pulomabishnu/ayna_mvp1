import { urgentSignsFor } from '../../utils/urgentSigns';

// The signs come from .gov pages (MedlinePlus, CDC, FDA, NIMH; founder rule Oct 24 2026), some older wording from NHS pages is kept; the page reads in US English.
const US = [[/diarrhoea/gi, 'diarrhea'], [/haemorrhag/gi, 'hemorrhag'], [/oedema/gi, 'edema'], [/anaemi/gi, 'anemi'], [/paediatric/gi, 'pediatric'], [/oestrogen/gi, 'estrogen'], [/\bfoetus/gi, 'fetus'], [/colour/gi, 'color'], [/\bgrey\b/gi, 'gray'], [/behaviour/gi, 'behavior'], [/\bGP\b/g, 'doctor'], [/\bA&E\b/g, 'the ER'], [/\b999\b/g, '911']];
const us = (t) => US.reduce((acc, [re, to]) => acc.replace(re, (m) => (/^[a-z]/.test(m) || /^[A-Z&0-9]{2,}$/.test(m) ? to : to.charAt(0).toUpperCase() + to.slice(1))), String(t || ''));
const SOURCE_NAMES = { 'nhs.uk': 'NHS (UK health service)', 'mayoclinic.org': 'Mayo Clinic', 'cdc.gov': 'CDC', 'fda.gov': 'FDA', 'acog.org': 'ACOG', 'medlineplus.gov': 'MedlinePlus', 'nimh.nih.gov': 'NIMH', 'nichd.nih.gov': 'NICHD', 'womenshealth.gov': 'womenshealth.gov' };
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
            <p className="ay-urgent__what"><b>{f.action === 'call 911' ? <a href="tel:911">Call 911</a> : (ACTION[f.action] || f.action)}</b> for {us(f.condition.charAt(0).toLowerCase() + f.condition.slice(1))}:</p>
            <ul className="ay-urgent__signs">{f.signs.map((s) => <li key={s}>{us(s)}</li>)}</ul>
            <a className="ay-urgent__src" href={f.source_url} target="_blank" rel="noopener noreferrer">Source: {SOURCE_NAMES[new URL(f.source_url).hostname.replace(/^www\./, '')] || new URL(f.source_url).hostname.replace(/^www\./, '')}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a>
          </li>
        ))}
      </ul>
      {list.some((f) => /psychosis/.test(f.id)) && <p className="ay-urgent__note">Thoughts of harming yourself? Call or text 988, any time.</p>}
    </section>
  );
}
