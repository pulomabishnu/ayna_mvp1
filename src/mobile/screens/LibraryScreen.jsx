import { useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import LibraryCard from '../components/LibraryCard.jsx';
import ReadCover from '../../components/library/ReadCover.jsx';
import { minutesFor } from '../../components/library/readTime.js';
import { READ_CREDITS } from '../../data/readCovers.js';
import { buildLibrary, hasQuizAnswers } from '../utils/personalReads.js';
import SuggestBox from '../../components/SuggestBox.jsx';
import SearchAssist from '../../components/search/SearchAssist.jsx';
import { searchArticles } from '../../utils/search/index.js';
import '../library.css';
import '../library-v2.css';
import { sentenceCase as sentence } from '../../utils/sentenceCase.js';
const FEATURED_READ_ID = 'postpartum-stretch-marks';

function ReadState({ value = 0 }) {
  if (!(value > 0)) return null;
  const done = value >= 1;
  return <span className={`al-state${done ? ' is-done' : ''}`}>
    <i aria-hidden="true"><b style={{ width: `${Math.round(value * 100)}%` }} /></i>
    <small>{done ? 'Finished' : `${Math.round(value * 100)}%`}</small>
  </span>;
}

/** The one featured read: where she left off, else her top pick, else the editors' pick. */
function FeaturedRead({ article, label, progress, onOpen }) {
  if (!article) return null;
  const credit = READ_CREDITS[article.id];
  return <section className="al-feature" aria-labelledby="al-feature-title">
    <span className="al-tab">{label}</span>
    <button type="button" className="al-feature__cover" tabIndex={-1} aria-hidden="true" onClick={() => onOpen?.(article)}>
      <ReadCover article={article} minutes={minutesFor(article)} />
    </button>
    <div className="al-feature__text">
      <h2 id="al-feature-title" className="al-feature__title">{article.title}</h2>
      {credit
        ? <p className="al-feature__by">By {credit.by}<br />Reviewed by {credit.reviewedBy}</p>
        : article.source && <p className="al-feature__by">Checked against {article.source}</p>}
      <button type="button" className="al-feature__go" onClick={() => onOpen?.(article)}>{progress > 0 && progress < 1 ? 'Keep reading' : 'Read it'} <span aria-hidden="true">→</span></button>
    </div>
  </section>;
}

export default function LibraryScreen({ articles = [], quizAnswers = null, lastQuizAnswers = null, readProgress = {}, onOpenArticle, onOpenSaved, onStartQuiz }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const q = query.trim().toLowerCase();
  const { forYou, rows, hasProfile } = buildLibrary(articles, quizAnswers);
  // "Get reads for you" only for someone with no answers yet. With answers
  // (or with personalization switched off) it must never restart the quiz.
  const canAskForQuiz = !hasQuizAnswers(quizAnswers) && !hasQuizAnswers(lastQuizAnswers);
  const progressOf = (a) => readProgress[a.id] || 0;
  const finished = articles.filter((a) => progressOf(a) >= 1).length;
  const keepReading = articles.filter((a) => progressOf(a) > 0 && progressOf(a) < 1);
  const topics = [['all', 'All', articles.length], ...(hasProfile && forYou.length ? [['foryou', 'For you', forYou.length]] : []), ...rows.map((r) => [r.id, sentence(r.label), r.items.length])];
  // Same editorial pick as the website's featured read when nothing personal applies (P1-25).
  const featured = keepReading[0] || (hasProfile && forYou[0]) || articles.find((a) => a.id === FEATURED_READ_ID) || articles[0] || null;
  const featuredLabel = keepReading[0] ? 'Pick up where you left off' : hasProfile && forYou[0] ? 'Top pick for you' : 'Featured read';

  const tile = (a, small = false) => <div className={`al-item${small ? ' is-small' : ''}`} key={a.id}>
    <LibraryCard article={a} fullWidth={!small} onClick={() => onOpenArticle?.(a)} />
    <ReadState value={progressOf(a)} />
  </div>;
  const row = (id, label, items, extra = null, topicId = null) => items.length > 0 && <section className="al-shelf" key={id} aria-labelledby={`al-${id}-h`}>
    <div className="al-shelf__head"><h2 id={`al-${id}-h`}>{sentence(label)}</h2>{extra || (topicId && <button type="button" className="al-seeall" onClick={() => setTopic(topicId)}>See all {items.length}</button>)}</div>
    <div className="al-row">{items.map((a) => tile(a, true))}</div>
  </section>;

  let body;
  if (q.length >= 2) {
    const results = searchArticles(query, articles);
    body = results.length ? <div className="al-grid">{results.map((a) => tile(a))}</div> : <p className="al-empty">No reads match.</p>;
  } else if (topic !== 'all') {
    const items = topic === 'foryou' ? forYou : (rows.find((r) => r.id === topic)?.items || []);
    body = <div className="al-grid">{items.map((a) => tile(a))}</div>;
  } else {
    body = <>
      <FeaturedRead article={featured} label={featuredLabel} progress={featured ? progressOf(featured) : 0} onOpen={onOpenArticle} />
      {row('keep', 'Keep reading', keepReading.filter((a) => a !== featured))}
      {hasProfile ? row('foryou', 'For you', forYou.filter((a) => a !== featured), null, 'foryou') : canAskForQuiz && onStartQuiz && <button type="button" className="al-match" onClick={onStartQuiz}>Get reads for you <span aria-hidden="true">→</span></button>}
      {rows.map((r) => row(r.id, r.label, r.items.filter((a) => a !== featured), null, r.id))}
    </>;
  }

  return <main className="ay-lib al">
    <MobileHeader onOpenSaved={onOpenSaved} title="Library" titleFor="ay-lib-title" />
    <header className="al-top ay-lib-head">
      <h1 id="ay-lib-title" className="al-top__title">Library</h1>
      <p className="al-top__lede">Plain-language reads, each one checked against clinical sources.</p>
      {/* Stat trio as three small outlined boxes (inspo 72419ae7) */}
      <dl className="al-stats">
        <div><dt>Reads</dt><dd>{articles.length}</dd></div>
        <div><dt>Topics</dt><dd>{rows.length}</dd></div>
        <div><dt>Finished</dt><dd>{finished}</dd></div>
      </dl>
      <SearchBar placeholder="Search reads" ariaLabel="Search reads" value={query} onChange={(e) => setQuery(e.target.value)} />
    </header>
    {q.length >= 2 && <SearchAssist variant="app" query={query} resultCount={searchArticles(query, articles).length} onUse={setQuery} />}
    {q.length < 2 && <div className="al-topics" role="group" aria-label="Topics">
      {topics.map(([id, label, n]) => <button type="button" key={id} aria-pressed={topic === id} onClick={() => setTopic(id)}>{label} <span className="al-topics__n">{n}</span></button>)}
    </div>}
    {body}
    <div className="ay-app-suggest-wrap">
      <SuggestBox variant="app" mode="read" context="app-library" />
    </div>
  </main>;
}
