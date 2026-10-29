import { useEffect, useState } from 'react';
import { proNow } from './proDoor.js';
import { PRO_CHANGED_EVENT } from './paywall.js';
import './pro-tag.css';

/** A small "Pro" tag on a button that leads to a Pro feature. Only free signed-in
 *  accounts see it (members and guests don't), so nobody taps "Connect" expecting setup
 *  and lands on a paywall (founder, Oct 28). */
export default function ProTag() {
  const [free, setFree] = useState(false);
  useEffect(() => {
    let live = true;
    const check = () => proNow().then((s) => { if (live) setFree(Boolean(s.gates && !s.active)); }).catch(() => { if (live) setFree(false); });
    check();
    window.addEventListener(PRO_CHANGED_EVENT, check);
    return () => { live = false; window.removeEventListener(PRO_CHANGED_EVENT, check); };
  }, []);
  if (!free) return null;
  return <span className="ay-protag"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></svg>Pro</span>;
}
