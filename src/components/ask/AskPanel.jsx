import { useState } from 'react';
import { haptic } from '../../utils/haptics.js';
import { renderMarkdownLite } from '../../utils/renderMarkdownLite.jsx';
import EvidenceMark from '../pdp/EvidenceMark.jsx';
import { levelLabel } from '../pdp/evidenceMarks.js';
import MatchPill from '../MatchPill.jsx';
import ProductTileImage, { ProductImageFallback } from '../ProductTileImage.jsx';
import './ask-panel.css';
import { Shout } from '../ui/ay';
import '../../styles/unique-b.css';

/**
 * Ask ayna, one component on both platforms (Ask audit, Oct 25, issue 4):
 * a sheet in the app, a 400px right-side panel or the full page at /ask on
 * the website. A calm conversation surface: the title with one sparkle, a
 * one-line intro with "How Ask works", "Hi <name>", three to five
 * suggested questions as single pills grouped About you · Safety ·
 * Products (#1 AI assistant board, #16 The Ordinary), then the input with
 * the mic. Answers are white bubbles (the 30/30/30/8 corner is Ask's own)
 * that end with their sources, marked by evidence level, and a "Based on"
 * line; products come as small plate cards with her match pill and reason
 * (#53 Glowie), facts as label / value rows (#58), Do / Don't or Good for /
 * Not for columns (#21 Clean Curls) only when the source content has them,
 * and one key number with a caption (#29 Glossier).
 *
 * The app sheet (AskAynaModal) and the website panel (ProfileChatbot) keep
 * their own sending; everything she sees is drawn here.
 */

const ARROW = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>;

/** The one doodle (Sumie, #41): a small asterisk sparkle beside the title. */
export function AskSparkle() {
  return <svg className="ay-askp-sparkle" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.6 4.9 4.1 8.4 9 9-4.9.6-8.4 4.1-9 9-.6-4.9-4.1-8.4-9-9 4.9-.6 8.4-4.1 9-9z" /></svg>;
}

/** Title row: optional leading control (Back), "Ask ayna" + sparkle, optional trailing control (Done / close). */
export function AskHeader({ start = null, end = null, level = 1, title = 'Ask ayna' }) {
  const content = <>{title}<AskSparkle /></>;
  return (
    <div className="ay-askp-head">
      {start}
      {level === 2 ? <h2 className="ay-askp-title">{content}</h2> : <h1 className="ay-askp-title">{content}</h1>}
      <span className="ay-askp-head__end">{end}</span>
    </div>
  );
}

/** Suggested questions: a short group heading, then one pill per question. A tap asks it. */
export function AskPrompts({ groups = [], onPick }) {
  if (!groups.length) return null;
  return (
    <div className="ay-askp-groups" data-tour="ask-starters">
      {groups.map((g) => (
        <section key={g.id} className={`ay-askp-group is-${g.id}`} aria-labelledby={`ay-askp-g-${g.id}`}>
          <h3 id={`ay-askp-g-${g.id}`}>{g.title}</h3>
          <ul>
            {g.prompts.map((p) => (
              <li key={p.question}>
                <button type="button" className="ay-askp-pill" onClick={() => { haptic('selection'); onPick(p.question, p); }}>
                  <span>{p.question}</span>{ARROW}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Columns({ c }) {
  if (!c || (!c.yes?.length && !c.no?.length)) return null;
  const [yesH, noH] = c.kind === 'do' ? ['Do', 'Don’t'] : ['Good for', 'Not for'];
  const tick = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
  const cross = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>;
  return (
    <div className="ay-askp-cols">
      {c.yes?.length > 0 && <div><h4>{yesH}</h4><ul>{c.yes.map((t) => <li key={t}><span className="ay-askp-cols__mark is-yes">{tick}</span><span><span className="sr-only">{yesH}: </span>{t}</span></li>)}</ul></div>}
      {c.no?.length > 0 && <div><h4>{noH}</h4><ul>{c.no.map((t) => <li key={t}><span className="ay-askp-cols__mark is-no">{cross}</span><span><span className="sr-only">{noH}: </span>{t}</span></li>)}</ul></div>}
      {c.from && <p className="ay-askp-cols__from">From the read “{c.from}”.</p>}
    </div>
  );
}

function ProductPlate({ p, onOpen }) {
  const m = p.match || { kind: 'signin' };
  const body = (
    <>
      <span className="ay-askp-plate__img"><ProductTileImage product={p} alt="" letterNode={<ProductImageFallback product={p} compact />} /></span>
      <span className="ay-askp-plate__text">
        <span className="ay-askp-plate__name">{p.name}</span>
        <span className="ay-askp-plate__match">
          {m.kind === 'pct' && <MatchPill percent={m.percent} size="sm" />}
          {m.kind === 'hold' && <MatchPill hold size="sm" />}
          {m.kind === 'signin' && <span className="ay-askp-plate__see">See your match</span>}
        </span>
        {m.why && <span className="ay-askp-plate__why">{m.why}</span>}
      </span>
    </>
  );
  return <li>{onOpen ? <button type="button" className="ay-askp-plate" onClick={() => onOpen(p)}>{body}</button> : <div className="ay-askp-plate">{body}</div>}</li>;
}

/** Everything under an answer's text, in reading order. Draws only what the answer carries. */
export function AskAnswerExtras({ m, onOpenProduct = null, onOpenRead = null }) {
  const sources = m.sources || [];
  const hasEnd = Array.isArray(m.basedOn);
  return (
    <>
      {m.stat && <p className="ay-askp-stat"><b>{m.stat.value}</b><span>{m.stat.level && <EvidenceMark level={m.stat.level} />}{m.stat.caption}</span></p>}
      {m.facts?.length > 0 && <dl className="ay-askp-facts">{m.facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>}
      <Columns c={m.columns} />
      {m.products?.length > 0 && <ul className="ay-askp-plates" aria-label="Products">{m.products.map((p) => <ProductPlate key={p.id} p={p} onOpen={onOpenProduct} />)}</ul>}
      {hasEnd && (
        <footer className="ay-askp-end">
          {sources.length > 0 ? (
            <ul className="ay-askp-sources" aria-label="Sources">
              {sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.level && <EvidenceMark level={s.level} />}<span>{s.title}</span>
                    <span className="sr-only">{s.level ? ` (${levelLabel(s.level)})` : ' (other page)'}, opens in a new tab</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ay-askp-nosrc">{m.noSources || (m.local ? 'No outside sources: this comes from your own data on ayna.' : 'No checked sources came with this answer.')}</p>
          )}
          {m.related?.length > 0 && <p className="ay-askp-related">Related in ayna’s library: {m.related.map((r, i) => <span key={r.id}>{i > 0 && ', '}{onOpenRead ? <button type="button" onClick={() => onOpenRead(r.id)}>{r.title}</button> : r.title}</span>)}</p>}
          {m.basedOn.length > 0 && <p className="ay-askp-based"><b>Based on:</b> {m.basedOn.join(', ')}</p>}
        </footer>
      )}
    </>
  );
}

/** One message: hers on the right (espresso), ayna's on the left (white), then the answer's actions. */
export function AskMessage({ m, before = null, after = null, onOpenProduct, onOpenRead, className = '' }) {
  if (m.role === 'user') return <div className={`ay-askp-msg is-user ${className}`.trim()}><div className="ay-askp-bubble">{m.text}</div>{after}</div>;
  if (m.role === 'system') return <div className={`ay-askp-msg is-system ${className}`.trim()}>{m.text && <p>{m.text}</p>}{after}</div>;
  return (
    <div className={`ay-askp-msg is-ayna${m.failed ? ' is-failed' : ''} ${className}`.trim()}>
      {before}
      <div className="ay-askp-bubble">
        <div className="ay-askp-text">{renderMarkdownLite(m.text || '')}</div>
        {!m.failed && <AskAnswerExtras m={m} onOpenProduct={onOpenProduct} onOpenRead={onOpenRead} />}
      </div>
      {after}
    </div>
  );
}

/** The question box: mic (tap to talk), the input, Send. Typed text waits for Send. */
export function AskComposer({ value, onChange, onSubmit, inputRef, inputClassName = '', placeholder = 'Ask anything…', disabled = false, sendDisabled = false, mic = null, sendLabel = 'Send', formRef, tour = 'chat-input', below = null }) {
  return (
    <form ref={formRef} className="ay-askp-composer" data-tour={tour} onSubmit={onSubmit}>
      <div className="ay-askp-composer__row">
        {mic && mic.supported && (
          <button type="button" className="ay-askp-mic ay-mic" aria-pressed={mic.listening} aria-label={mic.listening ? 'Stop listening' : 'Speak your question'} disabled={mic.disabled} onClick={mic.onToggle}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>
          </button>
        )}
        <input ref={inputRef} type="text" className={`ay-askp-input ${inputClassName}`.trim()} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label="Your question" disabled={disabled} />
        <button type="submit" className="ay-askp-send" disabled={sendDisabled}>{sendLabel}</button>
      </div>
      {below}
    </form>
  );
}

/** "How Ask works": what runs on this device, what uses ayna's AI, and her data choices. */
export function AskHow({ open, children }) {
  if (!open) return null;
  return <div className="ay-askp-how" id="ay-askp-how">{children}</div>;
}

/**
 * The first screen: greeting, one-line intro + How Ask works, extra rows the
 * surface adds (Daily Rundown questions, guide pages), the suggested
 * questions, recent questions.
 */
export function AskStart({ name = '', intro = '', how = null, top = null, groups = [], onPick, recent = [], onContinue = null, bottom = null }) {
  const [howOpen, setHowOpen] = useState(false);
  return (
    <div className="ay-askp-start is-bold">
      {/* Uniqueness pass: a bold espresso start (the greeting as the page's one shout), then colour-blocked question groups. */}
      <div className="ay-askp-hero">
        <AskSparkle />
        <Shout as="h2" size="l" className="ay-askp-hello">{name ? `Hi ${name}` : 'Hi there'}</Shout>
        <p className="ay-askp-intro">
          {intro}
          {how && <> <button type="button" className="ay-askp-howlink" aria-expanded={howOpen} aria-controls="ay-askp-how" onClick={() => setHowOpen((v) => !v)}>How Ask works</button></>}
        </p>
        <AskHow open={howOpen}>{how}</AskHow>
      </div>
      {top}
      <AskPrompts groups={groups} onPick={onPick} />
      {(recent.length > 0 || onContinue) && (
        <section className="ay-askp-group is-recent" aria-labelledby="ay-askp-g-recent">
          <div className="ay-askp-group__head">
            <h3 id="ay-askp-g-recent">Recent</h3>
            {onContinue && <button type="button" className="ay-askp-textbtn" onClick={onContinue}>Open chat</button>}
          </div>
          <ul>{recent.map((q) => <li key={q}><button type="button" className="ay-askp-pill is-quiet" onClick={() => onPick(q)}><span>{q}</span>{ARROW}</button></li>)}</ul>
        </section>
      )}
      {bottom}
    </div>
  );
}

/**
 * The frame: header, the scrolling conversation (children), anything pinned
 * above the input (errors, the listening line), then the input.
 * variant: 'sheet' (app) | 'tab' (app Ask ayna tab) | 'panel' (website, right side) | 'page' (website /ask)
 */
export default function AskPanel({ variant = 'sheet', header = null, children, footer = null, composer = null, listRef = null, className = '', scrollClassName = '', ...rest }) {
  return (
    <div className={`ay-askp ay-askp--${variant} ${className}`.trim()} {...rest}>
      {header}
      <div className={`ay-askp-scroll ${scrollClassName}`.trim()} ref={listRef}>{children}</div>
      {footer}
      {composer}
    </div>
  );
}
