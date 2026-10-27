import ReadCover from '../../components/library/ReadCover.jsx';
import { minutesFor } from '../../components/library/readTime.js';
import '../library-v2.css';

/* A read on an app shelf: the Library cover (same drawing as the website),
   then the read's title and its sources. */
export default function LibraryCard({ article, onClick, fullWidth = false }) {
  if (!article) return null;
  const { title, source } = article;
  return (
    <button type="button" onClick={onClick} aria-label={`Read ${title}`} className={`al-card${fullWidth ? ' is-full' : ''}`}>
      <ReadCover article={article} minutes={minutesFor(article)} />
      <span className="al-card__title">{title}</span>
      {source && <span className="al-card__src">{source}</span>}
    </button>
  );
}
