import { useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import LibraryCard from '../components/LibraryCard.jsx';
import { buildLibrary, hasQuizAnswers } from '../utils/personalReads.js';
import SuggestBox from '../../components/SuggestBox.jsx';
import SearchAssist from '../../components/search/SearchAssist.jsx';
import { searchArticles } from '../../utils/search/index.js';
import '../library.css';

function ReadState({ value = 0 }) {
  const done = value >= 1;
  return <span className={`ay-lib-state${done ? ' is-done' : value > 0 ? ' is-mid' : ''}`}>
    <i aria-hidden="true"><b style={{ width: `${Math.round(value * 100)}%` }} /></i>
    <small>{done ? 'Finished' : value > 0 ? `${Math.round(value * 100)}%` : 'New'}</small>
  </span>;
}

// Sentence case for topic names ("Hormonal Health" -> "Hormonal health"); acronyms stay.
const sentence = (label) => String(label || '').split(' ').map((w, i) => (i === 0 || /^[A-Z0-9&]{2,}$/.test(w) ? w : w.toLowerCase())).join(' ');

/** The one featured read (the Feature surface): where she left off, else her top pick. */
function FeaturedRead({ article, label, progress, onOpen }) {
  if (!article) return null;
  return <section className="ay-lib-feature" aria-labelledby="ay-lib-feature-title">
    <p className="ay-lib-feature__label">{label}</p>
    <h2 id="ay-lib-feature-title">{article.title}</h2>
    {article.teaser && <p className="ay-lib-feature__teaser">{article.teaser}</p>}
    <div className="ay-lib-feature__foot">
      <button type="button" onClick={() => onOpen?.(article)}>{progress > 0 && progress < 1 ? 'Keep reading' : 'Read it'}</button>
      {article.source && <small>From {article.source}</small>}
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
  const topics = [['all', 'All'], ...(hasProfile && forYou.length ? [['foryou', 'For you']] : []), ...rows.map((r) => [r.id, sentence(r.label)])];
  const featured = keepReading[0] || (hasProfile && forYou[0]) || articles[0] || null;
  const featuredLabel = keepReading[0] ? 'Pick up where you left off' : hasProfile && forYou[0] ? 'Top pick for you' : 'Start here';

  const tile = (a, small = false) => <div className={`ay-lib-item${small ? ' is-small' : ''}`} key={a.id}>
    <LibraryCard article={a} fullWidth={!small} onClick={() => onOpenArticle?.(a)} />
    <ReadState value={progressOf(a)} />
  </div>;
  const row = (id, label, items, extra) => items.length > 0 && <section className="ay-lib-section" key={id}>
    <div className="ay-lib-row-head"><h2>{sentence(label)}</h2><span className="ay-lib-count">{items.length}</span>{extra}</div>
    <div className="ay-lib-scroll">{items.map((a) => tile(a, true))}</div>
  </section>;

  let body;
  if (q.length >= 2) {
    const results = searchArticles(query, articles);
    body = results.length ? <div className="ay-lib-grid">{results.map((a) => tile(a))}</div> : <p className="ay-lib-empty">No reads match.</p>;
  } else if (topic !== 'all') {
    const items = topic === 'foryou' ? forYou : (rows.find((r) => r.id === topic)?.items || []);
    body = <div className="ay-lib-grid">{items.map((a) => tile(a))}</div>;
  } else {
    body = <>
      <FeaturedRead article={featured} label={featuredLabel} progress={featured ? progressOf(featured) : 0} onOpen={onOpenArticle} />
      {row('keep', 'Keep reading', keepReading.filter((a) => a !== featured))}
      {hasProfile ? row('foryou', 'For you', forYou) : canAskForQuiz && onStartQuiz && <button type="button" className="ay-lib-match" onClick={onStartQuiz}>Get reads for you <span aria-hidden="true">→</span></button>}
      {rows.map((r) => row(r.id, r.label, r.items))}
    </>;
  }

  return <main className="ay-lib">
    <MobileHeader onOpenSaved={onOpenSaved} />
    <header className="ay-lib-head">
      <div className="ay-lib-title"><h1>Library</h1>
        <span className="ay-lib-total"><i aria-hidden="true" style={{ '--p': `${articles.length ? Math.round((finished / articles.length) * 100) : 0}%` }} />{finished} of {articles.length} read</span>
      </div>
      <SearchBar placeholder="Search reads" ariaLabel="Search reads" value={query} onChange={(e) => setQuery(e.target.value)} />
    </header>
    {q.length >= 2 && <SearchAssist variant="app" query={query} resultCount={searchArticles(query, articles).length} onUse={setQuery} />}
    {q.length < 2 && <div className="ay-lib-topics" role="group" aria-label="Topics">
      {topics.map(([id, label]) => <button type="button" key={id} aria-pressed={topic === id} onClick={() => setTopic(id)}>{label}</button>)}
    </div>}
    {body}
    <div className="ay-app-suggest-wrap">
      <SuggestBox variant="app" mode="read" context="app-library" />
    </div>
  </main>;
}
