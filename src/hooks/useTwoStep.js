import { useEffect, useRef, useState } from 'react';
import { haptic } from '../utils/haptics.js';

// Two-step destructive confirm, never window.confirm: the first tap arms the
// button ("Tap again to reset") for 3 seconds, the second tap does it. The
// armed label is announced (aria-live), Esc or moving focus away disarms it,
// and the armed label says what will happen in plain words (Cloudscape's
// delete pattern: name what goes and what stays). The confirmation sits on
// the control itself instead of a browser dialog.
export function useTwoStep(onConfirm, ms = 3000) {
  const [armed, setArmed] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const disarm = () => { window.clearTimeout(timer.current); setArmed(false); };
  const press = (...args) => {
    if (armed) { disarm(); onConfirm?.(...args); return; }
    setArmed(true);
    haptic('warning');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setArmed(false), ms);
  };
  return { armed, press, disarm };
}

