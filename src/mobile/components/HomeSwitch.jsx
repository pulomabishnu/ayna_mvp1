import { useRef } from 'react';
import { AYNA_HOME_VIEWS } from '../../components/nav/mainTabs.js';

/**
 * The small switch at the top of the ayna tab: Chat · Products · My dashboard
 * (founder, Oct 24 20:12). Tabs pattern: arrow keys, Home and End move and
 * select. The same row sits at the top of all three views, so it never jumps.
 */
export default function HomeSwitch({ view = 'chat', onChange, leading = null }) {
  const listRef = useRef(null);
  const choose = (key, focus = false) => {
    onChange?.(key);
    if (focus) window.requestAnimationFrame(() => listRef.current?.querySelector(`[data-view="${key}"]`)?.focus());
  };
  const onKeyDown = (e) => {
    const i = AYNA_HOME_VIEWS.findIndex((v) => v.key === view);
    const n = AYNA_HOME_VIEWS.length;
    const next = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (next == null) return;
    e.preventDefault();
    choose(AYNA_HOME_VIEWS[next].key, true);
  };
  return (
    <div className="ay-home-top">
      {leading || <span className="ay-home-top__spacer" aria-hidden="true" />}
      <div ref={listRef} className="ay-homeswitch" role="tablist" aria-label="ayna" onKeyDown={onKeyDown}>
        {AYNA_HOME_VIEWS.map((v) => {
          const on = v.key === view;
          return <button key={v.key} type="button" role="tab" data-view={v.key} aria-selected={on} tabIndex={on ? 0 : -1} onClick={() => choose(v.key)}>{v.label}</button>;
        })}
      </div>
      <span className="ay-home-top__spacer" aria-hidden="true" />
    </div>
  );
}
