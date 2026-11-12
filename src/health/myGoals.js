/**
 * Her own goals (focus group, Nov 11: Zoleka wanted to set goals herself, on Home, and get
 * products for them; Puloma asked whether goals should be more prominent; Ameera: "actual goals
 * you could input"). One place for goals: Home > For today.
 *
 * A goal is { id, topic, text, perWeek, done: [day], createdAt }:
 *   - topic: 'sleep' | 'pain' | 'energy' | 'mood' | 'pms' | null (her own words, no topic)
 *   - text: what she wants, in her words or the preset's ("Sleep better")
 *   - perWeek: how many days a week she is aiming for (3, 5 or 7)
 *   - done: days she ticked "Did it today" (any goal can be ticked; topic goals also count good
 *     days from her log, see goalProgress.js)
 *
 * Stored per signed-in owner on this device (ownedStore.js), like the daily log. Never sent to
 * analytics.
 */
import { bucketOf, loadState, putBucket, saveState, switchOwner } from './ownedStore.js';
import { goodDay } from './goalProgress.js';
import { addDays } from './dailyLog.js';

export const GOALS_KEY = 'ayna_my_goals_v1';
export const GOALS_CHANGED_EVENT = 'ayna:goals-changed';
export const MAX_GOALS = 5;

export const GOAL_PRESETS = [
  { topic: 'sleep', text: 'Sleep better', needId: 'sleep.trouble' },
  { topic: 'pain', text: 'Fewer cramp days', needId: 'pain.menstrual_cramp' },
  { topic: 'energy', text: 'More energy', needId: 'energy.fatigue' },
  { topic: 'mood', text: 'Better mood', needId: 'mood.low' },
  { topic: 'pms', text: 'Easier PMS', needId: 'cycle.pms' },
];

// Her own words still find a topic when they clearly name one ("sleep 7 hours" -> sleep).
const TOPIC_WORDS = [
  ['sleep', /\b(sleep|slept|bed|insomnia|rest|nap)/i],
  ['pain', /\b(cramp|pain|ache|period pain)/i],
  ['energy', /\b(energy|tired|fatigue|exhaust)/i],
  ['mood', /\b(mood|stress|anxi|calm|happ|sad|mental)/i],
  ['pms', /\bpms\b|premenstrual/i],
];
export function topicFor(text) {
  const hit = TOPIC_WORDS.find(([, re]) => re.test(String(text || '')));
  return hit ? hit[0] : null;
}

function announce() {
  try { globalThis.dispatchEvent?.(new CustomEvent(GOALS_CHANGED_EVENT)); } catch { /* old browser */ }
}

export function readGoals(storage = globalThis.localStorage) {
  const items = bucketOf(loadState(GOALS_KEY, storage)).items;
  return Object.values(items).filter((g) => g && g.id && g.text).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

function write(mutate, storage) {
  const state = loadState(GOALS_KEY, storage);
  const b = bucketOf(state);
  const items = mutate({ ...b.items });
  saveState(GOALS_KEY, putBucket(state, { items, dirty: [] }), storage);
  announce();
  return readGoals(storage);
}

/** Adds a goal; returns the list. Ignores blanks, duplicates (same words) and a 6th goal. */
export function addGoal({ text, topic, perWeek = 5 } = {}, { storage = globalThis.localStorage, now = new Date() } = {}) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (!clean) return readGoals(storage);
  const goals = readGoals(storage);
  if (goals.length >= MAX_GOALS || goals.some((g) => g.text.toLowerCase() === clean.toLowerCase())) return goals;
  const id = `g${now.getTime().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
  const t = topic === undefined ? topicFor(clean) : topic;
  const week = [3, 5, 7].includes(Number(perWeek)) ? Number(perWeek) : 5;
  return write((items) => ({ ...items, [id]: { id, topic: t || null, text: clean, perWeek: week, done: [], createdAt: now.toISOString() } }), storage);
}

export function removeGoal(id, storage = globalThis.localStorage) {
  return write((items) => { const next = { ...items }; delete next[id]; return next; }, storage);
}

/** Tick or untick "Did it today". Keeps the last 60 days. */
export function toggleDone(id, day, storage = globalThis.localStorage) {
  return write((items) => {
    const g = items[id];
    if (!g) return items;
    const done = new Set(g.done || []);
    if (done.has(day)) done.delete(day); else done.add(day);
    return { ...items, [id]: { ...g, done: [...done].sort().slice(-60) } };
  }, storage);
}

/** Whoever is signed in (null = signed out). Her own goals win; signed-out goals fold in. */
export function setGoalsOwner(userId, storage = globalThis.localStorage) {
  const state = loadState(GOALS_KEY, storage);
  const next = switchOwner(state, userId, (mine, device) => ({ ...device, ...mine }));
  if (next !== state) saveState(GOALS_KEY, { ...next, buckets: Object.fromEntries(Object.entries(next.buckets).map(([k, v]) => [k, { ...v, dirty: [] }])) }, storage);
  return next.owner;
}

/**
 * This week for one goal: days that count (ticked "Did it today", or a good day in her log for
 * that topic), out of her own target. Last 7 days including today.
 */
export function weekFor(goal, log = {}, today) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, -i));
  const ticked = new Set((goal.done || []).filter((d) => days.includes(d)));
  // A day counts once: ticked "Did it today", or a good day in her log for the goal's topic.
  const goodLogDays = goal.topic ? days.filter((d) => !ticked.has(d) && goodDay(goal.topic, log?.[d]) === true).length : 0;
  const count = ticked.size + goodLogDays;
  const of = goal.perWeek || 5;
  return { count: Math.min(count, 7), of, doneToday: ticked.has(today), met: count >= of };
}
