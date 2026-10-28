import { useEffect, useRef, useState } from 'react';
import posthog from 'posthog-js';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { registerDeviceToken } from '../utils/deviceTokenApi.js';
import { analyticsId, ensureAnalyticsContext } from '../../utils/analyticsEvents.js';

function capturePush(event, props = {}) {
  try {
    ensureAnalyticsContext();
    posthog.capture(event, { surface: 'app', ...props });
  } catch { /* analytics never blocks push setup */ }
}

/**
 * Push permission is asked in context, never on launch. Analytics records only
 * permission/registration state and safe route type, never token values or
 * notification contents.
 */
export function usePushNotifications(userId, askNow = false) {
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('idle');
  const sentRef = useRef(null);
  const trackedRef = useRef(new Set());
  const once = (key, event, props = {}) => {
    if (trackedRef.current.has(key)) return;
    trackedRef.current.add(key);
    capturePush(event, props);
  };

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return undefined;

    let cancelled = false;
    const regListenerPromise = PushNotifications.addListener('registration', (result) => {
      if (cancelled) return;
      setToken(result.value);
      setStatus('granted');
      once('token-issued', 'push_token_issued', { platform: 'ios' });
    });
    const errListenerPromise = PushNotifications.addListener('registrationError', (err) => {
      if (cancelled) return;
      console.warn('[push] registration error:', err?.error || err);
      setStatus('error');
      once('register-error', 'push_registration_failed', { platform: 'ios' });
    });

    (async () => {
      try {
        const current = await PushNotifications.checkPermissions();
        if (current.receive !== 'granted' && !askNow) { if (!cancelled) setStatus('idle'); return; }
        setStatus('requesting');
        if (current.receive !== 'granted') once('prompted', 'push_permission_prompted', { platform: 'ios' });
        const perm = current.receive === 'granted' ? current : await PushNotifications.requestPermissions();
        if (perm.receive !== 'granted') {
          if (!cancelled) setStatus('denied');
          once('denied', 'push_permission_denied', { platform: 'ios' });
          return;
        }
        once('granted', 'push_permission_granted', { platform: 'ios', already_granted: current.receive === 'granted' });
        await PushNotifications.register();
      } catch (err) {
        console.warn('[push] permission/register failed:', err?.message || err);
        if (!cancelled) setStatus('error');
        once('permission-error', 'push_permission_failed', { platform: 'ios' });
      }
    })();

    return () => {
      cancelled = true;
      regListenerPromise.then((handle) => handle.remove()).catch(() => {});
      errListenerPromise.then((handle) => handle.remove()).catch(() => {});
    };
    // once uses refs and is intentionally stable for this permission lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askNow]);

  useEffect(() => {
    if (!token || !userId) return;
    const key = `${token}:${userId}`;
    if (sentRef.current === key) return;
    registerDeviceToken(token, 'ios')
      .then(() => {
        sentRef.current = key;
        once('token-stored', 'push_token_registered', { platform: 'ios' });
      })
      .catch((err) => {
        console.warn('[push] token storage failed:', err?.message || err);
        capturePush('push_token_store_failed', { platform: 'ios' });
      });
    // once uses refs and is intentionally stable here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId]);

  return { token, status };
}

/**
 * Where a tapped notification opens. The server sends safe routing metadata.
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
      capturePush('push_notification_opened', {
        platform: 'ios',
        destination: analyticsId(route?.screen || 'app'),
        has_product: Boolean(route?.productId),
      });
      if (route) ref.current?.(route);
    });
    return () => { handle.then((h) => h.remove()).catch(() => {}); };
  }, []);
}
