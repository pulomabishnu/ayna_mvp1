/**
 * Shared <img onError> handler with a one-time retry before giving up.
 *
 * Root cause this exists for: browsers can abort an in-flight (or
 * not-yet-started, for loading="lazy") image request when a tab is
 * backgrounded, which fires a genuine `error` event even though the URL
 * itself is completely fine — reloading the exact same URL once the tab is
 * visible again almost always succeeds. Every call site that hid the <img>
 * (or set permanent "broken" state) on the FIRST error was treating that
 * transient abort as a dead URL forever, for the rest of the page's life —
 * since the SPA doesn't unmount these cards on a tab switch, nothing ever
 * gave them a second chance.
 */
export function handleImageErrorWithRetry(e, onGiveUp) {
  const img = e.currentTarget;
  if (!img.dataset.retried) {
    img.dataset.retried = '1';
    const src = img.src;
    img.removeAttribute('src');
    // Next frame, not immediately — some browsers no-op a same-tick
    // src reassignment as a duplicate of the request that just failed.
    requestAnimationFrame(() => {
      img.src = src;
    });
    return;
  }
  onGiveUp();
}
