import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Native iOS/Android shell for ayna.
 *
 * The app loads the ayna website (it calls the site's /api routes, which only
 * exist on the deployed site), so `server.url` decides WHICH version the app
 * shows:
 *   default            → the live site (what App Store / Play users get)
 *   AYNA_APP_URL=…      → any other deployment, e.g. a Vercel preview, for
 *                         testing a branch in Xcode / Android Studio:
 *
 *   AYNA_APP_URL=https://aynamvp1-git-feature-community-pulomabishnu-4744s-projects.vercel.app npx cap sync ios
 *
 * Re-run `npx cap sync` without the variable before building a release.
 */
const appUrl = process.env.AYNA_APP_URL || 'https://www.aynahealth.co';

const config: CapacitorConfig = {
  appId: 'co.aynahealth.app',
  appName: 'ayna',
  webDir: 'dist',
  server: {
    url: appUrl,
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
