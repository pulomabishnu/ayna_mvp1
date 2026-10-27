import { urgentSignsFor } from '../../utils/urgentSigns';
import SourcesButton from './SourcesButton.jsx';

// The signs come from .gov pages (MedlinePlus, CDC, FDA, NIMH; founder rule Oct 24 2026), some older wording from NHS pages is kept; the page reads in US English.
const US = [[/diarrhoea/gi, 'diarrhea'], [/haemorrhag/gi, 'hemorrhag'], [/oedema/gi, 'edema'], [/anaemi/gi, 'anemi'], [/paediatric/gi, 'pediatric'], [/oestrogen/gi, 'estrogen'], [/\bfoetus/gi, 'fetus'], [/colour/gi, 'color'], [/\bgrey\b/gi, 'gray'], [/behaviour/gi, 'behavior'], [/\bGP\b/g, 'doctor'], [/\bA&E\b/g, 'the ER'], [/\b999\b/g, '911']];
const us = (t) => US.reduce((acc, [re, to]) => acc.replace(re, (m) => (/^[a-z]/.test(m) || /^[A-Z&0-9]{2,}$/.test(m) ? to : to.charAt(0).toUpperCase() + to.slice(1))), String(t || ''));
const SOURCE_NAMES = { 'nhs.uk': 'NHS (UK health service)', 'mayoclinic.org': 'Mayo Clinic', 'cdc.gov': 'CDC', 'fda.gov': 'FDA', 'acog.org': 'ACOG', 'medlineplus.gov': 'MedlinePlus', 'nimh.nih.gov': 'NIMH', 'nichd.nih.gov': 'NICHD', 'womenshealth.gov': 'womenshealth.gov' };
const ACTION = { 'call 911': 'Call 911', 'go to ER': 'Go to the ER', 'call your clinician today': 'Call your clinician today' };

const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };
const sourceName = (url) => SOURCE_NAMES[hostOf(url)] || hostOf(url);

/**
 * "Get help now" signs for this kind of product. Renders nothing for most products.
 * `compact` (the product page, founder Oct 27): its own spot before the tabs, never collapsed;
 * the groups sit side by side on the website and as a tight list in the app; the per-group
 * "Source:" lines become one small Sources button. The wording is the same either way.
 */
export default function UrgentSigns({ product, flags = null, compact = false }) {
  const list = flags || urgentSignsFor(product);
  if (!list.length) return null;
  const what = (f) => <>{f.action === 'call 911' ? <a href="tel:911">Call 911</a> : (ACTION[f.action] || f.action)}</>;
  const condition = (f) => us(f.condition.charAt(0).toLowerCase() + f.condition.slice(1));
  // One entry per page; a page behind two groups names both.
  const sources = [];
  for (const f of list.filter((x) => x.source_url)) {
    const t = `${ACTION[f.action] || f.action} for ${condition(f)}`;
    const had = sources.find((x) => x.url === f.source_url);
    if (had) had.title = `${had.title}; ${t}`; else sources.push({ url: f.source_url, publisher: sourceName(f.source_url), title: t });
  }
  return (
    <section className={`ay-urgent${compact ? ` is-compact is-n${list.length}` : ''}`} aria-label="When to get help now">
      {compact ? (
        <div className="ay-urgent__head">
          <h3 className="ay-urgent__h">When to get help now</h3>
          <SourcesButton items={sources} title="Sources for these signs" />
        </div>
      ) : <h3 className="ay-urgent__h">When to get help now</h3>}
      <ul className="ay-urgent__list">
        {list.map((f) => (
          <li key={f.id}>
            <p className="ay-urgent__what"><b>{what(f)}</b> for {condition(f)}:</p>
            <ul className="ay-urgent__signs">{f.signs.map((s) => <li key={s}>{us(s)}</li>)}</ul>
            {!compact && <a className="ay-urgent__src" href={f.source_url} target="_blank" rel="noopener noreferrer">Source: {sourceName(f.source_url)}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a>}
          </li>
        ))}
      </ul>
      {list.some((f) => /psychosis/.test(f.id)) && <p className="ay-urgent__note">Thoughts of harming yourself? Call or text 988, any time.</p>}
    </section>
  );
}
