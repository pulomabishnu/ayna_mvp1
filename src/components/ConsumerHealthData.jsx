import React, { useEffect, useState } from 'react';
import { EdPage } from './editorial/EdPage';

/**
 * The Consumer Health Data Privacy Notice inside the site's own layout
 * (header, nav, footer), like the Privacy Policy.
 *
 * The legal text has one source: public/consumer-health-data.html, which
 * stays published as-is (it is linked from sign-up and must load without
 * the app). This page reads that same file and shows its body, so the two
 * can never drift apart. Only our own same-origin static file is read, and
 * only plain content elements are kept (no scripts, styles or handlers).
 */
const ALLOWED = new Set(['P', 'H2', 'H3', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'A', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'DIV', 'BR', 'SPAN', 'CODE']);

function clean(node) {
  [...node.querySelectorAll('*')].forEach((el) => {
    if (!ALLOWED.has(el.tagName)) { el.remove(); return; }
    [...el.attributes].forEach((a) => {
      const keep = (el.tagName === 'A' && a.name === 'href' && /^(\/|https:\/\/|mailto:)/i.test(a.value)) || a.name === 'class' || a.name === 'colspan';
      if (!keep) el.removeAttribute(a.name);
    });
    if (el.tagName === 'A' && /^https:\/\//i.test(el.getAttribute('href') || '')) { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
  });
  return node;
}

export default function ConsumerHealthData({ onBack }) {
  const [html, setHtml] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    fetch('/consumer-health-data.html', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('load'))))
      .then((text) => {
        const doc = new DOMParser().parseFromString(text, 'text/html');
        const main = doc.querySelector('main');
        if (!main) throw new Error('shape');
        main.querySelectorAll('.back, .eyebrow, h1, script, style').forEach((el) => el.remove());
        if (live) setHtml(clean(main).innerHTML);
      })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, []);
  return (
    <EdPage title="Consumer health data privacy notice" onBack={onBack} toc tocKey={html ? 'ready' : 'wait'}>
      {html ? <div className="ay-chd" dangerouslySetInnerHTML={{ __html: html }} />
        : failed ? <p>This notice didn’t load. <a href="/consumer-health-data.html">Open the notice on its own page</a>.</p>
          : <p aria-busy="true">Getting the notice…</p>}
    </EdPage>
  );
}
