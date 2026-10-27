import { useEffect, useState } from 'react';
import PdpIcon from './PdpIcon.jsx';

const PHONE = '(max-width: 760px)';

/**
 * On phones, a long block (the compare table) folds to one row with a short
 * line and a chevron; on wider screens it is simply shown.
 */
export default function PhoneFold({ id, title, line = '', children }) {
  const [isPhone, setIsPhone] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(PHONE).matches);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia(PHONE);
    const on = () => setIsPhone(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  if (!isPhone) return children;
  return (
    <div className={`ay-ps-sec is-fold${open ? ' is-open' : ''}`}>
      <h2 className="ay-ps-fold">
        <button type="button" aria-expanded={open} aria-controls={`${id}-body`} onClick={() => setOpen((v) => !v)}>
          <span className="ay-ps-fold__main"><span className="ay-ps-fold__title">{title}</span>{line && <span className="ay-ps-fold__line">{line}</span>}</span>
          <PdpIcon name="chevron" className="ay-ps-fold__chev" />
        </button>
      </h2>
      <div id={`${id}-body`} hidden={!open}>{children}</div>
    </div>
  );
}
