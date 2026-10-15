import React, { useEffect, useRef, useState } from 'react';

/* Short confirmations ("Saved", "You're signed out") in one place, read out by screen readers. */
export default function GlobalToast() {
  const [msg, setMsg] = useState(null);
  const timer = useRef(0);
  useEffect(() => {
    const on = (e) => {
      setMsg(e.detail || null);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMsg(null), e.detail?.action ? 5000 : 2400);
    };
    window.addEventListener('ay-toast', on);
    return () => { window.removeEventListener('ay-toast', on); window.clearTimeout(timer.current); };
  }, []);
  return (
    <div className="ay-gtoast" role="status" aria-live="polite">
      {msg && (
        <div className="ay-gtoast__card">
          <span>{msg.text}</span>
          {msg.action && (
            <button type="button" onClick={() => { msg.action.onClick?.(); setMsg(null); }}>{msg.action.label}</button>
          )}
        </div>
      )}
    </div>
  );
}
