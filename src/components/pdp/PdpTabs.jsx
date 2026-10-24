import { useCallback, useEffect, useRef } from 'react';
import { useEdgeFade } from './useEdgeFade';

/**
 * The product page's tabs (Clinical opinion, Scientific literature, Reviews,
 * Safety, How to use, Details). Every panel is in the HTML from the start so
 * search engines read all of it; the ones not chosen carry `hidden`.
 * Keyboard: arrow keys move between tabs, Home and End jump to the ends.
 * The chosen tab is in the URL hash (#clinical), so a tab can be linked to.
 */
export default function PdpTabs({ tabs, active, onChange, label, labelId }) {
  const listRef = useRef(null);
  useEdgeFade(listRef, [tabs.length]);

  // Keep the chosen tab in view inside the sideways row (phones), without moving the page.
  useEffect(() => {
    const list = listRef.current;
    const tab = list?.querySelector(`[data-tab="${active}"]`);
    if (!list || !tab) return;
    const left = tab.offsetLeft - list.offsetLeft;
    const right = left + tab.offsetWidth;
    if (left < list.scrollLeft + 44) list.scrollTo({ left: Math.max(0, left - 44), behavior: 'smooth' });
    else if (right > list.scrollLeft + list.clientWidth - 44) list.scrollTo({ left: right - list.clientWidth + 44, behavior: 'smooth' });
  }, [active]);

  const choose = useCallback((id, focus = false) => {
    onChange(id);
    if (focus) window.requestAnimationFrame(() => listRef.current?.querySelector(`[data-tab="${id}"]`)?.focus());
  }, [onChange]);

  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.id === active);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    choose(tabs[next].id, true);
  };

  return (
    <>
      <div className="ay-tabs ayp-tabs__bar">
        <div className="ay-tabs__list" role="tablist" aria-labelledby={labelId} aria-label={labelId ? undefined : label} ref={listRef} onKeyDown={onKeyDown}>
          {tabs.map((t) => {
            const on = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`ay-tab-${t.id}`}
                data-tab={t.id}
                aria-selected={on}
                aria-controls={`ay-panel-${t.id}`}
                tabIndex={on ? 0 : -1}
                className={`ay-tabs__tab${on ? ' is-on' : ''}${t.tone ? ` is-${t.tone}` : ''}`}
                onClick={() => choose(t.id)}
              >
                {t.label}
                {t.count > 0 && <span className="ay-tabs__count">{t.count}</span>}
              </button>
            );
          })}
        </div>
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`ay-panel-${t.id}`}
          aria-labelledby={`ay-tab-${t.id}`}
          tabIndex={0}
          hidden={t.id !== active}
          className={`ay-tabs__panel ayp-panel is-${t.id}`}
        >
          {t.lead && t.leadLabel && <p className="ayp-panel__leadlabel">{t.leadLabel}</p>}
          {t.lead && <p className={t.leadLabel ? 'ayp-panel__lead is-quoted' : 'ayp-panel__lead'}>{t.lead}</p>}
          {t.body}
        </div>
      ))}
    </>
  );
}
