import { useEffect, useRef, useState } from 'react';

// Game-style answer controls for the mobile intake. Every control keeps the
// exact value contract of the widget it replaced (same option strings, same
// onChange shape) so stored answers and matching logic are untouched; only
// how a person picks the answer changes. Styling lives in intake-play.css.

const Check = () => (
  <svg className="ip-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5.5 5.5L20 6.5" /></svg>
);

/* ---------- chips + stickers ---------- */

export function ChipList({ items, selected = [], onToggle, compact = false, muted = [] }) {
  return (
    <div className={`ip-chips${compact ? ' is-compact' : ''}`}>
      {items.map((item) => {
        const on = selected.includes(item);
        return (
          <button type="button" key={item} aria-pressed={on} className={`ip-chip${muted.includes(item) ? ' is-muted' : ''}`} onClick={() => onToggle(item)}>
            {on && <Check />}<span>{item}</span>
          </button>
        );
      })}
    </div>
  );
}

const STICKER_TILTS = [-2.2, 1.6, 1.1, -1.4, -0.8, 2, 1.4, -1.8];

export function StickerGrid({ items, selected = [], onToggle, labels = {}, glyphs = {}, icons }) {
  return (
    <div className={`ip-stickers${icons ? ' has-icons' : ''}`}>
      {items.map((item, index) => {
        const on = selected.includes(item);
        const icon = icons?.[item];
        return (
          <button type="button" key={item} aria-pressed={on} aria-label={labels[item] && labels[item] !== item ? item : undefined}
            className="ip-sticker" style={{ '--tilt': `${STICKER_TILTS[index % STICKER_TILTS.length]}deg` }}
            onClick={() => onToggle(item)}>
            {icon && <span className="ip-sticker-icon">{icon}</span>}
            {!icon && glyphs[item] && <span className="ip-sticker-glyph" data-glyph={glyphs[item]} aria-hidden="true" />}
            <span className="ip-sticker-label">{labels[item] || item}</span>
            <span className="ip-sticker-badge" aria-hidden="true"><Check /></span>
          </button>
        );
      })}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder }) {
  return (
    <label className="ip-search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} maxLength={80} />
      {value && <button type="button" aria-label="Clear search" onClick={() => onChange('')}>×</button>}
    </label>
  );
}

/* ---------- single choice ---------- */

// Plain, high-clarity single choice. Used for every safety question, so it
// deliberately has no playful treatment: full-width rows, radio dot, label.
export function ChoiceRows({ options, value, onChange }) {
  return (
    <div className="ip-rows" role="radiogroup">
      {options.map((opt) => {
        const on = value === opt;
        return (
          <button type="button" key={opt} role="radio" aria-checked={on} className="ip-row" onClick={() => onChange(opt)}>
            <span className="ip-radio" aria-hidden="true" />
            <span>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- age ---------- */

const MIN_AGE = 18;
const MAX_AGE = 90;

export function AgeDial({ value, onChange, underage, onOpenGate }) {
  const hasValue = value !== '' && value !== null && value !== undefined;
  const n = hasValue ? Number(value) : null;
  const step = (delta) => {
    const base = n ?? 28;
    onChange(String(Math.min(120, Math.max(MIN_AGE, base + delta))));
  };
  const fill = hasValue ? ((Math.min(MAX_AGE, n) - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100 : 0;
  return (
    <div className="ip-age">
      <div className="ip-age-readout">
        <button type="button" className="ip-round" aria-label="One year younger" onClick={() => step(-1)} disabled={hasValue && n <= MIN_AGE}>−</button>
        <output className={`ip-age-number${hasValue ? '' : ' is-empty'}`} aria-live="polite">{hasValue ? n : '00'}</output>
        <button type="button" className="ip-round" aria-label="One year older" onClick={() => step(1)}>+</button>
      </div>
      <input className="ip-ruler" type="range" min={MIN_AGE} max={MAX_AGE} value={hasValue ? Math.min(MAX_AGE, n) : MIN_AGE}
        onChange={(e) => onChange(e.target.value)} aria-label="Slide to choose your age" style={{ '--fill': `${fill}%` }} />
      <div className="ip-ruler-ends" aria-hidden="true"><span>18</span><span>{hasValue ? 'years' : 'slide me'}</span><span>90+</span></div>
      {underage && (
        <button type="button" className="ip-warning" onClick={onOpenGate}>
          <strong>ayna is for ages 18 and up</strong>
          <span>Tap to see what you can still do.</span>
        </button>
      )}
    </div>
  );
}

/* ---------- zip ticket ---------- */

export function ZipTicket({ value, onChange }) {
  const inputRefs = useRef([]);
  const chars = String(value || '').split('');
  const setDigit = (index, raw) => {
    const clean = raw.replace(/\D/g, '');
    const next = [...chars];
    next[index] = clean ? clean[clean.length - 1] : '';
    onChange(next.join('').slice(0, 5));
    if (clean && index < 4) inputRefs.current[index + 1]?.focus();
  };
  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    inputRefs.current[Math.max(0, text.length - 1)]?.focus();
  };
  return (
    <div className="ip-ticket">
      <div className="ip-ticket-top"><span>ADMIT ONE</span><span>LOCAL CARE</span></div>
      <div className="ip-ticket-digits">
        {[0, 1, 2, 3, 4].map((i) => (
          <input key={i} ref={(el) => { inputRefs.current[i] = el; }} value={chars[i] || ''}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Backspace' && !chars[i] && i > 0) inputRefs.current[i - 1]?.focus(); }}
            onPaste={handlePaste} type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={1}
            aria-label={`ZIP code digit ${i + 1}`} />
        ))}
      </div>
      <div className="ip-ticket-foot">Only used to find care near you</div>
    </div>
  );
}

/* ---------- level meter (flow, pain) ---------- */

export function LevelMeter({ options, value, onChange, shape = 'bar' }) {
  const levels = options.slice(0, 5);
  const extras = options.slice(5);
  const index = levels.indexOf(value);
  return (
    <div className={`ip-meter ip-meter--${shape}`}>
      <div className="ip-meter-readout" aria-live="polite">{index >= 0 ? value : extras.includes(value) ? value : 'Tap a level'}</div>
      <div className="ip-meter-bars" role="radiogroup" aria-label="Choose a level">
        {levels.map((opt, i) => (
          <button type="button" key={opt} role="radio" aria-checked={value === opt} aria-label={opt}
            className={`ip-meter-bar${index >= i ? ' is-filled' : ''}`} style={{ '--level': i }}
            onClick={() => onChange(opt)}>
            <span className="ip-meter-fill" />
          </button>
        ))}
      </div>
      <div className="ip-meter-ends" aria-hidden="true"><span>{levels[0]}</span><span>{levels[levels.length - 1]}</span></div>
      {extras.length > 0 && <ChipList items={extras} selected={value ? [value] : []} onToggle={onChange} compact />}
    </div>
  );
}

/* ---------- track line (ordered time answers) ---------- */

export function TrackLine({ options, value, onChange }) {
  const index = options.indexOf(value);
  return (
    <div className="ip-track" role="radiogroup" aria-label="Choose a time">
      {options.map((option, i) => (
        <button type="button" key={option} role="radio" aria-checked={value === option}
          className={`ip-stop${index >= 0 && i < index ? ' is-passed' : ''}`} onClick={() => onChange(option)}>
          <span className="ip-stop-dot" aria-hidden="true" />
          <span className="ip-stop-label">{option}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- price stacks ---------- */

export function PriceStacks({ options, selected, onToggle }) {
  return (
    <div className="ip-price">
      {options.map((opt, i) => {
        const on = selected.includes(opt);
        return (
          <button type="button" key={opt} aria-pressed={on} className="ip-price-col" onClick={() => onToggle(opt)}>
            <span className="ip-price-stack" aria-hidden="true">
              {Array.from({ length: i + 1 }, (_, c) => <i key={c} style={{ '--coin': c }} />)}
            </span>
            <span className="ip-price-label">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

export function DotScale({ options, value, onChange, label }) {
  const index = options.indexOf(value);
  return (
    <div className="ip-dots">
      <div className="ip-dots-head"><span>{label}</span><strong>{value || '—'}</strong></div>
      <div className="ip-dots-row" role="radiogroup" aria-label={label}>
        {options.map((opt, i) => (
          <button type="button" key={opt} role="radio" aria-checked={value === opt} aria-label={opt}
            className={`ip-dot${index >= i ? ' is-on' : ''}`} onClick={() => onChange(opt)} />
        ))}
      </div>
      <div className="ip-meter-ends" aria-hidden="true"><span>{options[0]}</span><span>{options[options.length - 1]}</span></div>
    </div>
  );
}

/* ---------- brand spectrum ---------- */

const BRAND_SHORT = {
  'I mostly stick with brands I already trust': 'Loyalist',
  'I prefer trusted brands but am open to something new': 'Mostly loyal',
  'I like a mix of familiar and new brands': 'Mix it up',
  'I enjoy discovering new brands': 'Explorer',
};

export function BrandSpectrum({ options, value, onChange }) {
  const stops = options.filter((o) => BRAND_SHORT[o]);
  const extras = options.filter((o) => !BRAND_SHORT[o]);
  const index = stops.indexOf(value);
  return (
    <div className="ip-spectrum">
      <div className="ip-spectrum-readout" aria-live="polite">
        <strong>{index >= 0 ? BRAND_SHORT[value] : value || 'Pick your spot'}</strong>
        {index >= 0 && <span>{value}</span>}
      </div>
      <div className="ip-spectrum-track" role="radiogroup" aria-label="How open are you to new brands?" style={{ '--pos': index >= 0 ? index / (stops.length - 1) : -1 }}>
        <span className="ip-spectrum-line" aria-hidden="true" />
        {stops.map((opt) => (
          <button type="button" key={opt} role="radio" aria-checked={value === opt} aria-label={opt} className="ip-spectrum-stop" onClick={() => onChange(opt)}>
            <span className="ip-spectrum-short">{BRAND_SHORT[opt]}</span>
          </button>
        ))}
      </div>
      <ChipList items={extras} selected={value ? [value] : []} onToggle={onChange} compact />
    </div>
  );
}

/* ---------- FSA / HSA cards ---------- */

export function AccountCards({ options, value, onChange }) {
  const cards = options.filter((o) => ['FSA', 'HSA', 'Both'].includes(o));
  const rest = options.filter((o) => !cards.includes(o));
  return (
    <div className="ip-cards">
      <div className="ip-cards-row" role="radiogroup" aria-label="FSA or HSA">
        {cards.map((opt, i) => (
          <button type="button" key={opt} role="radio" aria-checked={value === opt} className="ip-card" style={{ '--tilt': `${[-3, 2, -1][i]}deg` }} onClick={() => onChange(opt)}>
            <span className="ip-card-chip" aria-hidden="true" />
            <strong>{opt}</strong>{opt === 'Both' && <small>FSA + HSA</small>}
            <span className="ip-card-badge" aria-hidden="true"><Check /></span>
          </button>
        ))}
      </div>
      <ChipList items={rest} selected={value ? [value] : []} onToggle={onChange} />
    </div>
  );
}

/* ---------- trust podium ---------- */

export function TrustPodium({ order, onChange, onTouch }) {
  const itemRefs = useRef({});
  const [drag, setDrag] = useState(null);

  useEffect(() => {
    if (!drag) return undefined;
    const onMove = (e) => {
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaY = clientY - drag.startClientY;
      setDrag((d) => (d ? { ...d, y: deltaY } : d));
      const mid = drag.top + drag.height / 2 + deltaY;
      let newIndex = 0;
      order.filter((it) => it !== drag.item).forEach((it) => {
        const rect = itemRefs.current[it]?.getBoundingClientRect();
        if (rect && mid > rect.top + rect.height / 2) newIndex += 1;
      });
      if (newIndex !== order.indexOf(drag.item)) {
        const next = order.filter((it) => it !== drag.item);
        next.splice(newIndex, 0, drag.item);
        onTouch();
        onChange(next);
      }
    };
    const onUp = () => setDrag(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag, order, onChange, onTouch]);

  const moveUp = (index) => {
    if (index === 0) return;
    const next = [...order];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onTouch();
    onChange(next);
  };

  return (
    <ol className="ip-podium">
      {order.map((item, index) => {
        const dragging = drag?.item === item;
        return (
          <li key={item} ref={(el) => { itemRefs.current[item] = el; }} className={`ip-podium-row${dragging ? ' is-dragging' : ''}`}
            style={dragging ? { transform: `translateY(${drag.y}px) rotate(-1deg)` } : undefined}>
            <span className="ip-podium-rank" aria-hidden="true">{index + 1}</span>
            <span className="ip-podium-label">{item}</span>
            {index > 0 && <button type="button" className="ip-podium-up" aria-label={`Move ${item} up`} onClick={() => moveUp(index)}>↑</button>}
            <span className="ip-podium-grip" aria-hidden="true"
              onPointerDown={(e) => {
                const rect = itemRefs.current[item]?.getBoundingClientRect();
                if (!rect) return;
                e.preventDefault();
                setDrag({ item, startClientY: e.clientY, top: rect.top, height: rect.height, y: 0 });
              }}>
              <svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.7" /><circle cx="15" cy="6" r="1.7" /><circle cx="9" cy="12" r="1.7" /><circle cx="15" cy="12" r="1.7" /><circle cx="9" cy="18" r="1.7" /><circle cx="15" cy="18" r="1.7" /></svg>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- note ---------- */

export function StickyNote({ value, onChange, placeholder, prompts = [] }) {
  const noteRef = useRef(null);
  const appendPrompt = (prompt) => {
    const prefix = value && !value.endsWith('\n') && !value.endsWith(' ') ? `${value}\n` : value;
    onChange(`${prefix}${prompt}: `);
    requestAnimationFrame(() => {
      const el = noteRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  };
  return (
    <div className="ip-note-wrap">
      <textarea ref={noteRef} className="ip-note" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={6} aria-label="Anything else" />
      <div className="ip-chips is-compact">
        {prompts.map((prompt) => (
          <button type="button" key={prompt} className="ip-chip is-dashed" onClick={() => appendPrompt(prompt)}>+ {prompt}</button>
        ))}
      </div>
    </div>
  );
}

/* ---------- topic tabs (what needs support) ---------- */

export function TopicPicker({ groups, selected, onToggle, search, onSearch, onAdd }) {
  const [active, setActive] = useState(() => groups.find((g) => g.items.some((i) => selected.includes(i)))?.label || groups[0]?.label);
  const q = search.trim().toLowerCase();
  const known = groups.flatMap((g) => g.items);
  const custom = selected.filter((item) => !known.includes(item));
  const results = q ? known.filter((item) => item.toLowerCase().includes(q)) : [];
  const group = groups.find((g) => g.label === active) || groups[0];
  const value = search.trim().replace(/\s+/g, ' ');
  const canAdd = value.length >= 2 && ![...known, ...selected].some((item) => item.toLowerCase() === value.toLowerCase());
  return (
    <div className="ip-topics">
      <SearchField value={search} onChange={onSearch} placeholder="Search symptoms or goals" />
      {canAdd && <button type="button" className="ip-chip is-dashed ip-add" onClick={() => onAdd(value)}>+ Add “{value}”</button>}
      {q ? (
        results.length ? <ChipList items={results} selected={selected} onToggle={onToggle} /> : !canAdd && <p className="ip-empty">No matches</p>
      ) : (
        <>
          <div className="ip-tabs" role="tablist" aria-label="Topics">
            {groups.map((g) => {
              const count = g.items.filter((i) => selected.includes(i)).length;
              return (
                <button type="button" role="tab" key={g.label} aria-selected={g.label === active} className="ip-tab" onClick={() => setActive(g.label)}>
                  <span>{g.label}</span>{count > 0 && <b>{count}</b>}
                </button>
              );
            })}
          </div>
          <div className="ip-tab-panel" role="tabpanel" key={group.label}>
            <ChipList items={group.items} selected={selected} onToggle={onToggle} />
          </div>
        </>
      )}
      {custom.length > 0 && <div className="ip-custom"><small>Added by you</small><ChipList items={custom} selected={selected} onToggle={onToggle} compact /></div>}
    </div>
  );
}
