/**
 * posthog-js normally compresses and batches its events.
 * On Capacitor native devices CapacitorHttp intercepts fetch/XMLHttpRequest.
 * Blob/batched transport has had documented iOS failures, so prefer plain
 * immediate fetch requests for beta telemetry. This does not override consent
 * or the existing before_send privacy scrubber in main.jsx.
 *
 * Browser usage keeps the normal PostHog defaults.
 */
export function nativePosthogTransportConfig(isNative) {
  if (!isNative) return {};
  return {
    request_batching: false,
    disable_compression: true,
    api_transport: 'fetch',
  };
}
