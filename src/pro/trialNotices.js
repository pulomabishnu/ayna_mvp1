// Nov 16 (founder: "make sure it locks after the trial for real, it saves their stuff but they can't see it
// until they renew, and it notifies them"). The server already ends access when the trial's grant expires
// (pro_access_status: pro_focus_grants.expires_at > now()); nothing she saved is deleted. This file tells her:
// a phone notification the day before and when it ends, and a note in the app the next time she opens it.
import { Capacitor } from '@capacitor/core';
import posthog from 'posthog-js';
import { toast } from '../utils/toast.js';
import { openProPaywall } from './paywall.js';

const UNTIL_KEY = 'ayna_pro_trial_until_v1';
const TOLD_KEY = 'ayna_pro_trial_end_told_v1';
const IDS = [9950, 9951];

// Analytics (Nov 19): trial started is captured where it starts (TrialStart / TrialOffer). These two close the loop:
// pro_trial_ended once per trial when she is told it ended, pro_trial_converted once when a trial account turns paid.
// No amounts, no health data; billing amounts stay in the anonymous webhook events.
const defaultCapture = (event, props) => { try { posthog.capture(event, props); } catch { /* analytics never blocks */ } };

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* storage off */ } };

/** Pure (tested): what to schedule for a trial ending at `until`. Never names anything about her health. */
export function trialNotifications(until, now = Date.now()) {
  const end = Date.parse(until);
  if (!Number.isFinite(end) || end <= now) return [];
  const out = [];
  const dayBefore = end - 24 * 3600 * 1000;
  if (dayBefore > now + 60 * 1000) out.push({ id: IDS[0], title: 'Your ayna Pro trial ends tomorrow', body: 'Everything you added stays saved. Keep Pro to keep seeing your health dashboard and insights.', schedule: { at: new Date(dayBefore), allowWhileIdle: true }, extra: { route: 'pro' } });
  out.push({ id: IDS[1], title: 'Your ayna Pro trial ended', body: 'Your data is saved. Get Pro to see your dashboard and insights again.', schedule: { at: new Date(end), allowWhileIdle: true }, extra: { route: 'pro' } });
  return out;
}

async function schedule(list) {
  try {
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('LocalNotifications')) return;
    const { LocalNotifications } = await import('../utils/localNotifications.js');
    await LocalNotifications.cancel({ notifications: IDS.map((id) => ({ id })) }).catch(() => {});
    if (!list.length) return;
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return; // never prompts on its own; reminders ask when she turns one on
    await LocalNotifications.schedule({ notifications: list });
  } catch { /* notifications are best effort */ }
}

/** Pure (tested): 'pro' | 'trial' | 'staff' | 'free' from a server Pro status. On every event as `subscription_tier`. */
export function subscriptionTier(status) {
  if (!status) return 'free';
  if (status.isAdmin) return 'staff';
  if (status.hasPurchase || status.autoRenew) return 'pro';
  if (status.active && status.temporaryUntil) return 'trial';
  if (status.active) return 'pro';
  return 'free';
}
const defaultRegister = (props) => { try { posthog.register(props); } catch { /* analytics never blocks */ } };

/** Call with each server Pro status. */
export function handleTrialStatus(status, now = Date.now(), capture = defaultCapture, register = defaultRegister) {
  if (!status) return;
  register({ subscription_tier: subscriptionTier(status) });
  const until = status.temporaryUntil || null;
  const paid = Boolean(status.hasPurchase || status.autoRenew || status.isAdmin);
  if (status.active && until && !paid) {
    if (read(UNTIL_KEY) !== until) { write(UNTIL_KEY, until); write(TOLD_KEY, null); schedule(trialNotifications(until, now)); }
    return;
  }
  if (paid) {
    const had = read(UNTIL_KEY);
    if (had) {
      write(UNTIL_KEY, null); schedule([]);
      if (!status.isAdmin) capture('pro_trial_converted', { converted_when: Date.parse(had) > now ? 'during_trial' : 'after_trial' });
    }
    return;
  }
  // Not active: if her trial ended and she hasn't been told in the app yet, tell her once.
  const was = read(UNTIL_KEY);
  if (!status.active && was && Date.parse(was) <= now && read(TOLD_KEY) !== was) {
    write(TOLD_KEY, was);
    capture('pro_trial_ended', {});
    toast('Your free ayna Pro trial ended. Everything you added is saved.', { label: 'Get Pro', onClick: () => openProPaywall({ feature: 'trial_ended', featureName: 'ayna Pro' }) });
  }
}

/** Tapping a trial notice opens the Pro screen. Returns a remover. */
export function onTrialNoticeTap() {
  try {
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('LocalNotifications')) return () => {};
  } catch { return () => {}; }
  let off = () => {};
  import('../utils/localNotifications.js').then(({ LocalNotifications }) => {
    const h = LocalNotifications.addListener('localNotificationActionPerformed', (a) => {
      if (IDS.includes(Number(a?.notification?.id))) openProPaywall({ feature: 'trial_ended', featureName: 'ayna Pro' });
    });
    off = () => { h.then((x) => x.remove()).catch(() => {}); };
  }).catch(() => {});
  return () => off();
}
