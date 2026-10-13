import { useEffect } from 'react';

/**
 * Puts schema.org JSON-LD for the current page in <head> and removes it when
 * the page goes away (website product page). `data` is an array of plain
 * objects; null entries are skipped.
 */
export default function useJsonLd(id, data) {
  const json = JSON.stringify((data || []).filter(Boolean));
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const list = JSON.parse(json);
    if (!list.length) return undefined;
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    // Escape "<" so catalog text can never close the script tag.
    el.textContent = JSON.stringify(list.length === 1 ? list[0] : list).replace(/</g, '\\u003c');
    document.getElementById(id)?.remove();
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [id, json]);
}
