import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Hand a text file to the user.
 *
 * In the iPhone app a plain <a download> does nothing (WKWebView ignores it),
 * which is why "Download my data" used to silently fail. On native we write
 * the file to the app's cache folder and open the iOS share sheet, so people
 * can Save to Files, AirDrop, email or message it. In a browser we use the
 * Web Share API when it can share files, otherwise a normal download.
 *
 * Resolves to 'shared' | 'cancelled' | 'downloaded' | 'failed'.
 */
export async function shareTextFile({ filename, content, mimeType = 'application/json', title }) {
  if (Capacitor.isNativePlatform()) {
    try {
      const written = await Filesystem.writeFile({ path: filename, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
      await Share.share({ title: title || filename, files: [written.uri], dialogTitle: title || filename });
      return 'shared';
    } catch (e) {
      if (/cancel/i.test(String(e?.message || e))) return 'cancelled';
      console.warn('[shareTextFile] native share failed:', e?.message || e);
      return 'failed';
    }
  }

  try {
    if (typeof File === 'function' && navigator?.canShare) {
      const file = new File([content], filename, { type: mimeType });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: title || filename });
        return 'shared';
      }
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
  }

  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
