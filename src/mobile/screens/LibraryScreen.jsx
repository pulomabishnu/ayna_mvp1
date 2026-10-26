import { useState } from 'react';
import MobileHeader from '../components/MobileHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import ReadCard from '../../components/library/ReadCard.jsx';
import { Chip, ChipRow, OutlineButton } from '../../components/ui/ay';
import { READ_SECTIONS } from '../../data/readSections.js';
import { buildLibrary, hasQuizAnswers } from '../utils/personalReads.js';
import SuggestBox from '../../components/SuggestBox.jsx';
import SearchAssist from '../../components/search/SearchAssist.jsx';
import { searchArticles } from '../../utils/search/index.js';
import '../library.css';
import '../library-v2.css';
import { sentenceCase as sentence } from '../../utils/sentenceCase.js';
const FEATURED_READ_ID = 'postpartum-stretch-marks';

/**
 * The one featured read (where she left off, else her top pick, else the editors' pick) as the big
 * feature of an editorial grid (uniqueness pass, Oct 26; #4dfb3fbd FEEL FITS): its photo or cover big,
 * who wrote and reviewed it and its sources, then the next two reads as covers side by side.
 */
function FeaturedRead({ article, label, progress, onOpen, pair = [], progressOf = () => 0 }) {
  if (!article) return null;
  return <section className="al-feature al-feature--v9 al-ed" aria-labelledby="al-feature-h">
    <h2 id="al-feature-h" className="al-feature__h">{label}</h2>
    <ReadCard article={article} layout="feature" headingLevel={3} progress={progress} onOpen={() => onOpen?.(article)} />
    {pair.length > 0 && <div className="al-ed__pair">{pair.map((a) => <div className="al-ed__item" key={a.id}><ReadCard article={a} layout="rail" headingLevel={3} progress={progressOf(a)} onOpen={() => onOpen?.(a)} /></div>)}</div>}
  </section>;
}

export default function LibraryScreen({ articles = [], quizAnswers = null, lastQuizAnswers = null, readProgress = {}, onOpenArticle, onOpenSaved, onStartQuiz, embedded = false, onBack = null }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const q = query.trim().toLowerCase();
  const { forYou, hasProfile } = buildLibrary(articles, quizAnswers);
  // Topics and their counts come from the one sections list the website uses.
  const rows = READ_SECTIONS.map((sec) => ({ ...sec, items: sec.articleIds.map((id) => articles.find((a) => a.id === id)).filter(Boolean) })).filter((r) => r.items.length > 0);
  // "Get reads for you" only for someone with no answers yet. With answers
  // (or with personalization switched off) it must never restart the quiz.
  const canAskForQuiz = !hasQuizAnswers(quizAnswers) && !hasQuizAnswers(lastQuizAnswers);
  const progressOf = (a) => readProgress[a.id] || 0;
  const keepReading = articles.filter((a) => progressOf(a) > 0 && progressOf(a) < 1);
  const topics = [['all', 'All', articles.length], ...(hasProfile && forYou.length ? [['foryou', 'For you', forYou.length]] : []), ...rows.map((r) => [r.id, sentence(r.label), r.items.length])];
  // Same editorial pick as the website's featured read when nothing personal applies (P1-25).
  const featured = keepReading[0] || (hasProfile && forYou[0]) || articles.find((a) => a.id === FEATURED_READ_ID) || articles[0] || null;
  const featuredLabel = keepReading[0] ? 'Pick up where you left off' : hasProfile && forYou[0] ? 'Top pick for you' : 'Featured read';

  // The two covers beside the feature: her next picks (or the first topic's reads); they are not repeated in the rails below.
  const pair = (hasProfile && forYou.length ? forYou : rows[0]?.items || []).filter((a) => a !== featured).slice(0, 2);
  const notPaired = (items) => items.filter((a) => !pair.includes(a));
  const tile = (a, small = false, wide = false) => <div className={`al-item${small ? ' is-small' : ''}${wide ? ' is-wide' : ''}`} key={a.id}>
    <ReadCard article={a} layout="rail" summary={!small} onOpen={() => onOpenArticle?.(a)} progress={progressOf(a)} />
  </div>;
  // Editorial grid (glance pass): one wide cover first, then halves; an odd last one goes wide so no tile sits beside an empty half.
  const grid = (items) => <div className="al-grid al-grid--ed">{items.map((a, i) => tile(a, false, i === 0 || (i === items.length - 1 && (items.length - 1) % 2 === 1)))}</div>;
  const row = (id, label, items, extra = null, topicId = null, total = items.length) => items.length > 0 && <section className="al-shelf" key={id} aria-labelledby={`al-${id}-h`}>
    <div className="al-shelf__head"><h2 id={`al-${id}-h`}>{sentence(label)}</h2>{extra || (topicId && <button type="button" className="al-seeall" onClick={() => setTopic(topicId)}>See all {total}</button>)}</div>
    <div className="al-row">{items.map((a) => tile(a, true))}</div>
  </section>;

  let body;
  if (q.length >= 2) {
    const results = searchArticles(query, articles);
    body = results.length ? grid(results) : <p className="al-empty">No reads match.</p>;
  } else if (topic !== 'all') {
    const items = topic === 'foryou' ? forYou : (rows.find((r) => r.id === topic)?.items || []);
    body = grid(items);
  } else {
    body = <>
      <FeaturedRead article={featured} label={featuredLabel} progress={featured ? progressOf(featured) : 0} onOpen={onOpenArticle} pair={pair} progressOf={progressOf} />
      {row('keep', 'Keep reading', notPaired(keepReading.filter((a) => a !== featured)))}
      {hasProfile ? row('foryou', 'For you', notPaired(forYou.filter((a) => a !== featured)), null, 'foryou', forYou.length) : canAskForQuiz && onStartQuiz && <div className="al-match--v9"><OutlineButton onClick={onStartQuiz}>Get reads for you</OutlineButton></div>}
      {rows.map((r) => row(r.id, r.label, notPaired(r.items), null, r.id, r.items.length))}
    </>;
  }

  return <main className="ay-lib al">
    {/* In the app the Library is pushed from Explore: Back returns there. */}
    {!embedded && <MobileHeader onOpenSaved={onOpenSaved} onBack={onBack} title="Reads" titleFor="ay-lib-title" />}
    <header className="al-top ay-lib-head">
      {/* Inside Explore the reads are the Reads section; Explore owns the page title. */}
      {embedded ? <h2 id="ay-lib-title" className="al-top__title">Reads</h2> : <h1 id="ay-lib-title" className="al-top__title">Reads</h1>}
      <p className="al-top__lede">Plain-language reads written by the ayna team. Each read lists the sources it uses.</p>
      <SearchBar placeholder="Search reads" ariaLabel="Search reads" value={query} onChange={(e) => setQuery(e.target.value)} />
    </header>
    {q.length >= 2 && <SearchAssist variant="app" query={query} resultCount={searchArticles(query, articles).length} onUse={setQuery} />}
    {q.length < 2 && <ChipRow label="Topics" className="al-topics--v9">
      {topics.map(([id, label, n]) => <Chip key={id} selected={topic === id} onClick={() => setTopic(id)}>{label} <span className="al-topics__n">{n}</span></Chip>)}
    </ChipRow>}
    {body}
    <div className="ay-app-suggest-wrap">
      <SuggestBox variant="app" mode="read" context="app-library" />
    </div>
  </main>;
}
