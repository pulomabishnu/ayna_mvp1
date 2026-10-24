import { SourceLink } from './HealthBento.jsx';
import '../../styles/insight-story.css';

/**
 * One health change, read as a story (src/health/insightStory.js):
 * What changed -> What it may affect -> What you can do -> See data.
 * Something worth checking leads. Numbers and charts live under See data.
 * App and website (HealthHome is shared).
 */

const uniq = (list) => list.filter((s, i, all) => s?.url && all.findIndex((x) => x.url === s.url) === i);

function Sources({ list }) {
  const shown = uniq(list || []);
  if (!shown.length) return null;
  return <span className="ay-is-src">{shown.map((s, i) => <span key={s.url}>{i ? ' · ' : ''}<SourceLink source={s} /></span>)}</span>;
}

export function StoryFlag({ flag }) {
  if (!flag) return null;
  return <p className="ay-is-flag" role="note"><span>{flag.text}</span> <Sources list={flag.sources} /></p>;
}

/**
 * @param {object} props.story      insightStory(...) output
 * @param {'hero'|'full'} props.mode hero: one action and a button; full: everything
 * @param {Function} [props.onMore] hero button
 * @param {ReactNode} [props.data]  extra See data content (comparison, chart link)
 * @param {string} props.idBase
 * @param {boolean} [props.hideChanged] the caller already shows story.changed as its heading
 * @param {boolean} [props.hideFlag]    the caller already shows the flag above its heading
 */
export default function InsightStory({ story, mode = 'full', onMore, data = null, idBase = 'ay-is', headingLevel = 3, hideChanged = false, hideFlag = false }) {
  if (!story) return null;
  const H = `h${headingLevel}`;
  const actions = mode === 'hero' ? story.actions.slice(0, 1) : story.actions;
  return (
    <div className={`ay-is is-${mode}${story.flag ? ' is-flagged' : ''}`}>
      {!hideFlag && <StoryFlag flag={story.flag} />}
      {!hideChanged && <H className="ay-is-changed" id={`${idBase}-changed`}>{story.changed}</H>}
      <dl className="ay-is-parts">
        <div>
          <dt>What it may affect</dt>
          <dd>{story.affects}{mode === 'full' && <> <Sources list={story.affectsSources} /></>}</dd>
        </div>
        {actions.length > 0 && (
          <div>
            <dt>What you can do</dt>
            <dd>
              <ul className="ay-is-actions">
                {actions.map((a) => (
                  <li key={a.id}><b>{a.label}</b><span>{a.text}</span>{mode === 'full' && a.sources?.length > 0 && <Sources list={a.sources} />}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
      {mode === 'hero' && onMore && <button type="button" className="ay-is-more" onClick={onMore}>What you can do and the data <span aria-hidden="true">→</span></button>}
      {mode === 'full' && (
        <details className="ay-is-data">
          <summary>See data</summary>
          <div className="ay-is-data-body">
            <p>{story.data.text}</p>
            {story.data.basis && <p className="ay-is-basis">{story.data.basis}</p>}
            {data}
            {story.data.sources.length > 0 && <p className="ay-is-basis">Why we say this: <Sources list={story.data.sources} /></p>}
          </div>
        </details>
      )}
    </div>
  );
}
