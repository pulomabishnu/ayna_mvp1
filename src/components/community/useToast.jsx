import React, { useEffect, useState } from 'react';

/** Small status toast: returns [node, show(message)]. */
export function useToast() {
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => setMessage(''), 2600);
    return () => clearTimeout(t);
  }, [message]);
  const node = message ? <div className="cm-toast" role="status">{message}</div> : null;
  return [node, setMessage];
}
