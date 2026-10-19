import TopicCover from '../../components/v3/TopicCover.jsx';
import { hasTeamCover } from '../../data/readCovers.js';

export default function ArticleCard({ article, onClick, compact = false }) {
  const { title, teaser, tags = [] } = article || {};
  const image = hasTeamCover(article) ? article.image : null;
  return (
    <button type="button" onClick={onClick} className={`ayna-editorial-read${compact ? ' is-compact' : ''}`}>
      <span className="ayna-editorial-read-copy">
        {tags[0] && <small>{tags[0]}</small>}
        <strong>{title}</strong>
        {!compact && teaser && <span>{teaser}</span>}
      </span>
      {!compact && <span className="ayna-editorial-read-image">
        {image ? <img src={image} alt="" loading="lazy" /> : <TopicCover id={article?.id} title={title} className="ay-app-cover is-small" />}
      </span>}
    </button>
  );
}
