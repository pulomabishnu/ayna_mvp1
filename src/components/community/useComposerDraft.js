import { useEffect, useRef } from 'react';
import { loadDraft, saveDraft, clearDraft } from '../../utils/community/composerDraft.js';

const dataUrls = new WeakMap();
const readPhoto = (file) => new Promise((resolve) => {
  if (dataUrls.has(file)) { resolve(dataUrls.get(file)); return; }
  try {
    const r = new FileReader();
    r.onload = () => { const url = String(r.result || ''); dataUrls.set(file, url); resolve(url); };
    r.onerror = () => resolve('');
    r.readAsDataURL(file);
  } catch { resolve(''); }
});

/**
 * Keeps the composer's draft in localStorage while she writes.
 * - `draft`: the current composer fields ({ kind, body, productId, rating,
 *   anonymous, playlistTitle, friendIds, photos: File[] }).
 * - `restore(saved)`: called once per key with a stored draft, if any.
 * Saving is debounced and flushed when the page is hidden, so a reload, a
 * crash or the app going to the background keeps the text.
 */
export function useComposerDraft({ key, enabled = true, draft, restore }) {
  const restoreRef = useRef(restore);
  useEffect(() => { restoreRef.current = restore; });
  const latest = useRef(draft);
  useEffect(() => { latest.current = draft; });
  const restoredKey = useRef(null);
  const ready = useRef(false);

  useEffect(() => {
    if (!enabled || !key || restoredKey.current === key) return;
    restoredKey.current = key;
    ready.current = false;
    const saved = loadDraft(key);
    if (saved) restoreRef.current?.(saved);
    // Let the restored state land before the first save.
    const t = window.setTimeout(() => { ready.current = true; }, 0);
    return () => window.clearTimeout(t);
  }, [key, enabled]);

  const write = async () => {
    if (!enabled || !key || !ready.current) return;
    const d = latest.current || {};
    const files = Array.isArray(d.photos) ? d.photos : [];
    const photos = [];
    for (const f of files) {
      if (!(f instanceof Blob)) continue;
      const dataUrl = await readPhoto(f);
      if (dataUrl) photos.push({ name: f.name, type: f.type, dataUrl });
    }
    saveDraft(key, { ...d, photos });
  };

  const sig = JSON.stringify({ ...draft, photos: (draft?.photos || []).map((f) => `${f?.name}:${f?.size}:${f?.lastModified}`) });
  useEffect(() => {
    if (!enabled || !key) return undefined;
    const t = window.setTimeout(() => { write(); }, 250);
    return () => window.clearTimeout(t);
  }, [sig, key, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled || !key) return undefined;
    const flush = () => { write(); };
    const onVis = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onVis); flush(); };
  }, [key, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { clear: () => clearDraft(key) };
}
