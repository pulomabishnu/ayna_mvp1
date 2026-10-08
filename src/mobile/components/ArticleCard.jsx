export default function ArticleCard({ article, onClick }) {
  const { title, teaser, tags = [], image } = article || {};
  return (
    <button type="button" onClick={onClick} className="ayna-editorial-read">
      <span className="ayna-editorial-read-copy">
        {tags[0] && <small>{tags[0]}</small>}
        <strong>{title}</strong>
        {teaser && <span>{teaser}</span>}
      </span>
      <span className="ayna-editorial-read-image">
        {image ? <img src={image} alt="" loading="lazy" /> : <span>ayna</span>}
      </span>
    </button>
  );
}
