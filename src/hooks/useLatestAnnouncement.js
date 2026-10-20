import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import { listAnnouncements } from '../utils/community/announcementsStore';

/* The latest ayna news post, as a short plain-text summary (from /api/news-summary,
   falling back to the newest announcement). Used by the homepage community band. */
const stripMd = (t) => String(t || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/(\*\*|__|\*|_|`|~~)/g, '').replace(/^#+\s*/gm, '').replace(/\s+/g, ' ').trim();
const plainTitle = (t) => stripMd(t).slice(0, 120);
function shortSummary(body, max = 170) {
  const t = stripMd(body).replace(/^(hi|hey|hello)[^.!?]*[.!?]\s*/i, '').replace(/(^|\s)\d{1,2}[.)]\s+/g, '$1').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return stop > 60 ? cut.slice(0, stop + 1) : `${cut.replace(/\s+\S*$/, '')}…`;
}

export function useLatestAnnouncement() {
  const [item, setItem] = useState(null);
  useEffect(() => {
    let live = true;
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;
    // The slide shows a short summary of the latest post (written by AI from
    // the post itself, /api/news-summary), never the raw post with its markdown.
    const fromList = () => listAnnouncements(supabase, { limit: 1 })
      .then(({ rows }) => { const a = rows?.[0]; if (live && a?.title) setItem({ title: plainTitle(a.title), body: shortSummary(a.body) }); })
      .catch(() => {});
    fetch('/api/news-summary')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!live) return; if (d?.item?.title && d.item.summary) setItem({ title: plainTitle(d.item.title), body: d.item.summary }); else fromList(); })
      .catch(() => { if (live) fromList(); });
    return () => { live = false; };
  }, []);
  return item;
}

