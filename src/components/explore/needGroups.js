// The Needs tab's chips, grouped (Explore audit, Oct 25, section 6: "chips
// grouped: Periods & cycle · Hormones · Pregnancy & postpartum · Intimate &
// sexual · Body & mind"). Keys are the health topics (utils/search/exploreSearch
// HEALTH_TOPICS); a topic not listed here falls into Body & mind.
import { HEALTH_TOPICS } from '../../utils/search/exploreSearch.js';

const GROUPS = [
  { id: 'cycle', label: 'Periods and cycle', keys: ['periods', 'cramps', 'cycle-tracking', 'endometriosis'] },
  { id: 'hormones', label: 'Hormones', keys: ['pcos', 'hormones', 'perimenopause', 'menopause', 'acne', 'hair'] },
  { id: 'pregnancy', label: 'Pregnancy and postpartum', keys: ['fertility', 'pregnancy', 'postpartum'] },
  { id: 'intimate', label: 'Intimate and sexual', keys: ['vaginal-health', 'uti', 'sexual-health', 'contraception', 'pelvic-floor'] },
  { id: 'body', label: 'Body and mind', keys: ['mental-health', 'sleep', 'fitness', 'bone-health'] },
];

export function needGroups(topics = HEALTH_TOPICS) {
  const placed = new Set(GROUPS.flatMap((g) => g.keys));
  return GROUPS.map((g) => ({
    ...g,
    topics: [...g.keys.map((k) => topics.find((t) => t.key === k)).filter(Boolean), ...(g.id === 'body' ? topics.filter((t) => !placed.has(t.key)) : [])],
  })).filter((g) => g.topics.length > 0);
}
