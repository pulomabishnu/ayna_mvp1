import { localToday } from '../utils/localDate.js';
/**
 * ayna news for the "ayna news" Home widget. Written by the ayna team only
 * (Eliz, Puloma, Geena, Ameera). Never add one that the team did not write.
 *
 * Each entry:
 *   { id: 'short-id', title: 'One line', body: 'One or two sentences.',
 *     date: 'YYYY-MM-DD' (shows from this day), expires: 'YYYY-MM-DD' (last day it shows),
 *     link?: 'https://…' or '/path', linkLabel?: 'Read more' }
 *
 * The widget shows the latest unexpired ones and hides itself when there
 * are none. Empty on purpose until the team adds one.
 */
export const ANNOUNCEMENTS = [];

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Live announcements on `today`, newest first. */
export function liveAnnouncements(list = ANNOUNCEMENTS, today = localToday()) {
  return (list || [])
    .filter((a) => a?.id && a.title && DAY.test(a.date || '') && DAY.test(a.expires || '') && a.date <= today && today <= a.expires)
    .sort((a, b) => b.date.localeCompare(a.date));
}
