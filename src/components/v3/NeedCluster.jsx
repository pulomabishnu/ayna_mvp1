import React, { useRef } from 'react';
import CorkStrings from './CorkStrings.jsx';

/* One need on the Ecosystem cork board: a pinned label with a pink string
   running from it to each of its matched products. Decorative strings only. */
export default function NeedCluster({ className = '', label, count, children }) {
  const ref = useRef(null);
  const sels = ['.eco3-cl__label@bottom'];
  for (let i = 1; i <= count; i += 1) sels.push(`.eco3-cl__items > :nth-child(${i})`);
  return (
    <section className={`eco3-cl ${className}`.trim()} ref={ref}>
      <CorkStrings rootRef={ref} hub drape selectors={sels} />
      {label}
      {children}
    </section>
  );
}
