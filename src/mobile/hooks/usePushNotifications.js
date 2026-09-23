import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { registerDeviceToken } from '../utils/deviceTokenApi.js';

/**
 * Requests push permission and starts native registration once, on mount —
 * iOS only for now, per the current ask; Android can be added the same way
 * once it's wanted. Runs regardless of sign-in state (the OS permission
 * prompt isn't gated on having an account), and whenever a real device
 * token AND a signed-in userId both exist, sends the token to
 * /api/device-tokens so it's stored against that account.
 *
 * Registration + storage only — nothing here sends a push. That needs the
 * APNs auth key wired in server-side, a separate, later piece of work.
 */
const PUSH_PROMPT_ENABLED = false;

export function usePushNotifications(userId) {
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
      setStatus('requesting');
      try {
        // Nothing sends a push yet (see header). Asking for permission on
        // first launch — stacked on top of the analytics and AI consent
        // prompts — for a feature that doesn't exist was a bad first
        // impression and an App Review risk (2026-09-22 audit). Only
        // register silently if permission was already granted; flip
        // PUSH_PROMPT_ENABLED when APNs sending ships.
        const perm = PUSH_PROMPT_ENABLED
          ? await PushNotifications.requestPermissions()
          : await PushNotifications.checkPermissions();
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
  }, []);

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
