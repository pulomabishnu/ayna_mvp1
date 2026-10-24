import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { registerDeviceToken } from '../utils/deviceTokenApi.js';

/**
 * Push permission is asked in context, never on launch (Apple HIG
 * onboarding; anti-vibe guide 6b): if she already allowed it, registration
 * runs on mount; otherwise the prompt waits until `askNow` is true, which
 * MobileApp sets after her first save or add. iOS only for now, per the
 * current ask; Android can be added the same way
 * once it's wanted. Runs regardless of sign-in state (the OS permission
 * prompt isn't gated on having an account), and whenever a real device
 * token AND a signed-in userId both exist, sends the token to
 * /api/device-tokens so it's stored against that account.
 *
 * Registration + storage only, nothing here sends a push. That needs the
 * APNs auth key wired in server-side, a separate, later piece of work.
 */
export function usePushNotifications(userId, askNow = false) {
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | requesting | granted | denied | error

  // Tracks the last `${token}:${userId}` pair already POSTed, so a re-render
  // (e.g. userId reference changing without actually changing) doesn't
  // re-send the same registration on every render.
  const sentRef = useRef(null);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return undefined;

    let cancelled = false;
    const regListenerPromise = PushNotifications.addListener('registration', (result) => {
      if (cancelled) return;
      setToken(result.value);
      setStatus('granted');
    });
    const errListenerPromise = PushNotifications.addListener('registrationError', (err) => {
      if (cancelled) return;
      console.warn('[push] registration error:', err?.error || err);
      setStatus('error');
    });

    (async () => {
      try {
        const current = await PushNotifications.checkPermissions();
        if (current.receive !== 'granted' && !askNow) { if (!cancelled) setStatus('idle'); return; }
        setStatus('requesting');
        const perm = current.receive === 'granted' ? current : await PushNotifications.requestPermissions();
        if (perm.receive !== 'granted') {
          if (!cancelled) setStatus('denied');
          return;
        }
        // Fires the native APNs registration; the 'registration' listener
        // above receives the resulting token asynchronously.
        await PushNotifications.register();
      } catch (err) {
        console.warn('[push] permission/register failed:', err?.message || err);
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      regListenerPromise.then((handle) => handle.remove()).catch(() => {});
      errListenerPromise.then((handle) => handle.remove()).catch(() => {});
    };
  }, [askNow]);

  useEffect(() => {
    if (!token || !userId) return;
    const key = `${token}:${userId}`;
    if (sentRef.current === key) return;
    registerDeviceToken(token, 'ios')
      .then(() => { sentRef.current = key; })
      .catch((err) => console.warn('[push] token storage failed:', err?.message || err));
  }, [token, userId]);

  return { token, status };
}

/**
 * Where a tapped notification opens. The server sends `data.route: 'today'`
 * (Today reminders, api/today-reminders.js) and `data.productId` (recall
 * alerts, api/fda-recall.js); broadcasts carry neither and just open the app.
 */
export function routeForPush(data = {}) {
  if (!data || typeof data !== 'object') return null;
  if (data.productId) return { screen: 'product', productId: String(data.productId) };
  if (data.route === 'today') return { screen: 'today' };
  return null;
}

/** Calls onRoute(route) when she taps a notification (iOS). */
export function usePushRoutes(onRoute) {
  const ref = useRef(onRoute);
  useEffect(() => { ref.current = onRoute; });
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return undefined;
    const handle = PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const route = routeForPush(action?.notification?.data);
      if (route) ref.current?.(route);
    });
    return () => { handle.then((h) => h.remove()).catch(() => {}); };
  }, []);
}
