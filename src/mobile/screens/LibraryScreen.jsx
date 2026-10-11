import { useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import LibraryCard from '../components/LibraryCard.jsx';
import { buildLibrary } from '../utils/personalReads.js';
import '../library.css';

export default function LibraryScreen({ articles = [], quizAnswers = null, readArticleIds = [], onOpenArticle, onOpenSaved, onAskAyna, onStartQuiz }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const { forYou, rows, hasProfile } = buildLibrary(articles, quizAnswers);
  const results = q.length >= 2 ? articles.filter((a) => `${a.title} ${(a.tags || []).join(' ')} ${a.teaser || ''}`.toLowerCase().includes(q)) : null;
  const readCount = forYou.filter((a) => readArticleIds.includes(a.id)).length;
  const card = (a) => <div className="ay-lib-item" key={a.id}>
    <LibraryCard article={a} fullWidth onClick={() => onOpenArticle?.(a)} />
    {readArticleIds.includes(a.id) && <span className="ay-lib-read">Read</span>}
  </div>;

  return <main className="ay-lib">
    <MobileHeader onOpenSaved={onOpenSaved} />
    <header className="ay-lib-head">
      <h1>Library</h1>
      <SearchBar placeholder="Search reads" value={query} onChange={(e) => setQuery(e.target.value)} />
    </header>

    {results ? <section className="ay-lib-section">
      {results.length ? <div className="ay-lib-grid">{results.map(card)}</div> : <p className="ay-lib-empty">No reads match.</p>}
    </section> : <>
      <button type="button" className="ay-lib-ask" onClick={onAskAyna}>
        <span className="ay-lib-ask-art" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 5h16v12H9l-5 3V5Z" /><path d="M10 10a2 2 0 1 1 3.4 1.4c-.9.6-1.4 1-1.4 2.1m0 2h.01" /></svg></span>
        <strong>Ask ayna</strong>
        <span className="ay-lib-ask-go" aria-hidden="true">→</span>
      </button>

      {hasProfile && forYou.length > 0 && <section className="ay-lib-section">
        <div className="ay-lib-row-head"><h2>For you</h2><span className="ay-lib-progress" aria-label={`${readCount} of ${forYou.length} read`}><i style={{ '--p': `${Math.round((readCount / forYou.length) * 100)}%` }} />{readCount}/{forYou.length}</span></div>
        <div className="ay-lib-grid">{forYou.map(card)}</div>
      </section>}
      {!hasProfile && onStartQuiz && <button type="button" className="ay-lib-match" onClick={onStartQuiz}>Get reads for you <span aria-hidden="true">→</span></button>}

      {rows.map((row) => <section className="ay-lib-section" key={row.id}>
        <div className="ay-lib-row-head"><h2>{row.label}</h2></div>
        <div className="ay-lib-scroll">{row.items.map((a) => <div className="ay-lib-item is-small" key={a.id}><LibraryCard article={a} onClick={() => onOpenArticle?.(a)} />{readArticleIds.includes(a.id) && <span className="ay-lib-read">Read</span>}</div>)}</div>
      </section>)}
    </>}
  </main>;
}
