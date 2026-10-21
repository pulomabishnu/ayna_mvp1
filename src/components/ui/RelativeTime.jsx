import { relativeTime, useMinuteNow } from '../../utils/relativeTime.js';

/** <RelativeTime at={iso} /> renders a <time> that stays current. */
export default function RelativeTime({ at, className }) {
  const now = useMinuteNow();
  if (!at) return null;
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return null;
  return <time className={className} dateTime={d.toISOString()} title={d.toLocaleString()}>{relativeTime(d, now)}</time>;
}
