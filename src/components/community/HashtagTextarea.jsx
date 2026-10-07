import React, { useRef, useState } from 'react';
import { suggestHashtags } from '../../utils/community/topics';

/**
 * Post body with inline topic hashtags: type "#" and topic suggestions appear
 * as you type (#pcos, #cramps…). Picking one inserts the tag and adds the
 * topic to the post. Unknown #words stay plain text.
 */
export default function HashtagTextarea({ value, onChange, onPickTopic, className = '', ...props }) {
  const ref = useRef(null);
  const [menu, setMenu] = useState(null); // { start, query }
  const [active, setActive] = useState(0);

  const readToken = (el) => {
    const caret = el.selectionStart ?? el.value.length;
    const before = el.value.slice(0, caret);
    const m = /(^|\s)#([\w-]{0,30})$/.exec(before);
    if (!m) { setMenu(null); return; }
    setMenu({ start: caret - m[2].length - 1, query: m[2] });
    setActive(0);
  };

  const items = menu ? suggestHashtags(menu.query) : [];
  const open = Boolean(menu) && items.length > 0;

  const pick = (item) => {
    const el = ref.current;
    const caret = el.selectionStart ?? value.length;
    const next = `${value.slice(0, menu.start)}${item.tag} ${value.slice(caret)}`;
    const pos = menu.start + item.tag.length + 1;
    onChange(next);
    onPickTopic?.(item.key);
    setMenu(null);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(pos, pos); });
  };

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % items.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + items.length) % items.length); }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(items[active]); }
    else if (e.key === 'Escape') { setMenu(null); }
  };

  return (
    <div className="cm-hashtag-field">
      <textarea
        ref={ref}
        className={className}
        value={value}
        onChange={(e) => { onChange(e.target.value); readToken(e.target); }}
        onKeyDown={onKeyDown}
        onClick={(e) => readToken(e.target)}
        onBlur={() => setTimeout(() => setMenu(null), 150)}
        aria-autocomplete="list"
        aria-expanded={open}
        {...props}
      />
      {open && (
        <ul className="cm-hashtag-menu" role="listbox" aria-label="Topic suggestions">
          {items.map((item, i) => (
            <li key={item.key} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={i === active ? 'is-active' : ''}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(item)}
              >
                {item.tag}
                <small>{item.label}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
