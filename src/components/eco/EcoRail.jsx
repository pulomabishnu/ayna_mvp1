import { useEffect, useState } from 'react';
import { useLatestAnnouncement } from '../../hooks/useLatestAnnouncement';
import { useDismissed } from './ecoMotion';

/* "For you" on the website Ecosystem: the small things that are not her
   shelves (a life-stage check, the optional questions, ayna news). On a wide
   screen they sit in a slim sticky side rail; on smaller screens they fold
   into one strip ("3 things for you") that opens on tap. Each can be closed
   and stays closed in this browser. The shelves stay the hero. */
const X = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>;

function goShelf(e, key) {
  e.preventDefault();
  document.getElementById(`eco-area-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function EcoRail({ clash, onFixStages, quizSlot, quizKey = 'quiz', onShownChange, shelves = [] }) {
  const news = useLatestAnnouncement();
  const [gone, dismiss] = useDismissed('ayna_eco_rail_closed_v1');
  const [open, setOpen] = useState(false);

  const items = [];
  if (clash && !gone.has(clash.key)) {
    items.push({
      key: clash.key,
      short: 'Check your life stages',
      node: (
        <section className="eco-rail__card is-stages" aria-labelledby="eco-rail-stages">
          <p className="eco-rail__tab">Needs a quick check</p>
          <h2 id="eco-rail-stages" className="eco-rail__title">Check your life stages</h2>
          <p className="eco-rail__body"><b>{clash.picked}</b> {clash.why} {clash.effect}</p>
          <div className="eco-rail__acts">
            <button type="button" className="eco-rail__go" onClick={onFixStages}>Update life stages<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
            <button type="button" className="eco-rail__quiet" onClick={() => dismiss(clash.key)}>Not now</button>
          </div>
        </section>
      ),
    });
  }
  if (quizSlot && !gone.has(quizKey)) {
    items.push({
      key: quizKey,
      short: quizKey === 'finish' ? 'Finish your quiz' : 'Make my matches more personal',
      node: (
        <div className="eco-rail__slot">
          {quizSlot}
          {quizKey !== 'finish' && <button type="button" className="eco-rail__x" onClick={() => dismiss(quizKey)} aria-label="Hide this card">{X}</button>}
        </div>
      ),
    });
  }
  const newsKey = news ? `ann:${news.title}` : '';
  if (news && !gone.has(newsKey)) {
    items.push({
      key: newsKey,
      short: news.title,
      node: (
        <section className="eco-rail__card is-news" aria-labelledby="eco-rail-news">
          <p className="eco-rail__tab">New from ayna</p>
          <h2 id="eco-rail-news" className="eco-rail__title eco-rail__title--sm">{news.title}</h2>
          <a className="eco-rail__link" href="/community?tab=announcements">Read the announcement<span aria-hidden="true"> →</span></a>
          <button type="button" className="eco-rail__x" onClick={() => dismiss(newsKey)} aria-label="Hide this announcement">{X}</button>
        </section>
      ),
    });
  }
  const shown = items.length > 0 || shelves.length > 1;
  useEffect(() => { onShownChange?.(shown); }, [shown, onShownChange]);
  if (!shown) return null;

  const count = items.length;
  return (
    <aside className={`eco-rail${open ? ' is-open' : ''}${count ? '' : ' is-toc-only'}`} aria-label="For you">
      {/* Wide screens: a table of contents for her shelves (dotted leaders to the count). */}
      {shelves.length > 1 && (
        <nav className="eco-toc" aria-label="Your shelves">
          <h2 className="eco-toc__h">Your shelves</h2>
          <ol>
            {shelves.map((sh) => (
              <li key={sh.key}><a href={`#eco-area-${sh.key}`} onClick={(e) => goShelf(e, sh.key)}><span className="eco-toc__name">{sh.label}</span><span className="eco-toc__dots" aria-hidden="true" /><span className="eco-toc__n">{sh.count}</span></a></li>
            ))}
          </ol>
        </nav>
      )}
      {/* Small screens: one strip that opens. Wide screens hide it (CSS) and show the cards. */}
      {/* P1-14: on small screens "For you" is one dismissible line that opens. */}
      {count > 0 && <div className="eco-rail__line">
        <button type="button" className="eco-rail__strip" aria-expanded={open} aria-controls="eco-rail-list" onClick={() => setOpen((v) => !v)}>
          <span className="eco-rail__count" aria-hidden="true">{count}</span>
          <span className="eco-rail__striptext">
            <b>For you</b>
            <span>{items[0].short}{count > 1 ? ` and ${count - 1} more` : ''}</span>
          </span>
          <svg className="eco-rail__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
        {items.some((it) => it.key !== 'finish') && <button type="button" className="eco-rail__stripx" aria-label="Hide these suggestions" onClick={() => { items.forEach((it) => { if (it.key !== 'finish') dismiss(it.key); }); setOpen(false); }}>{X}</button>}
      </div>}
      {count > 0 && <h2 className="eco-rail__h">For you</h2>}
      {count > 0 && <div id="eco-rail-list" className="eco-rail__list">
        {items.map((it) => <div key={it.key} className="eco-rail__item">{it.node}</div>)}
      </div>}
    </aside>
  );
}
