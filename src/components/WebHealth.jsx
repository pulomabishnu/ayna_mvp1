import { useMemo } from 'react';
import { buildDashboard } from '../health/dashboard.js';
import { buildInsights } from '../health/insights.js';
import { DEV_DEMO_CONNECTIONS, DEV_DEMO_MATCH_IDS, DEV_DEMO_NEEDS, DEV_DEMO_PRODUCT_IDS, devDemoAddedAt, devDemoRows } from '../health/devDemo.js';
import { getProductById } from '../data/products.js';
import { DEV_HEALTH_DEMO, DEV_HEALTH_DEMO_EMPTY, localToday } from '../mobile/hooks/useHealthData.js';
import { HealthStarter } from '../mobile/components/HealthBento.jsx';
import HealthHome from '../mobile/components/HealthHome.jsx';
import TodayFeed from './today/TodayFeed.jsx';
import '../styles/web-health.css';

/**
 * Website "Your health" (/health): the app's health dashboard laid out for
 * desktop. Same rows, same rules (src/health/dashboard.js, insights.js,
 * phase.js): compared only with her own usual, never a diagnosis, a card
 * only when its data exists.
 *
 * Phone data (Apple Health / Health Connect) is synced by the app to
 * /api/health-data, so a signed-in account's rows are readable here too.
 * Manual uploads and Oura from /health-data count as data as well.
 * Signed out, or signed in with nothing yet: a locked preview pointing to the app.
 */

// The ayna iPhone beta (TestFlight public link). public/ayna-beta-qr.svg is
// a QR code of this same address: regenerate it if the link changes.
const BETA_URL = 'https://testflight.apple.com/join/f3C9PypD';

const fmtLongDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="3" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></svg>;
}

/**
 * What the dashboard shows, as plain rows (walkthrough P1-13: no blurred
 * mock-up behind the card; the checklist bans ghost data). Words only:
 * nothing here is anyone's data.
 */
const DASH_PARTS = [
  { k: 'cycle', t: 'Cycle day and phase', d: 'Where you are in your cycle, and what usually comes next for you.', icon: <><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 8 8h-8z" /></> },
  { k: 'sleep', t: 'Sleep', d: 'Last night and this week, next to your own usual.', icon: <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" /> },
  { k: 'heart', t: 'Resting heart rate', d: 'Day by day, so a change stands out.', icon: <path d="M3 12h4l2-4 4 8 2-4h6" /> },
  { k: 'steps', t: 'Steps', d: 'Your daily movement against your own average.', icon: <><path d="M8 20c-1.7 0-3-1.6-3-4s1.3-5 3-5 3 2.6 3 5-1.3 4-3 4z" /><path d="M16 14c-1.7 0-3-1.6-3-4s1.3-5 3-5 3 2.6 3 5-1.3 4-3 4z" /></> },
];
function WhatItShows() {
  return (
    <section className="ay-wh-shows" aria-labelledby="ay-wh-shows-h">
      <h2 id="ay-wh-shows-h" className="ay-wh-shows__title">What the dashboard shows</h2>
      <ul className="ay-wh-shows__list">
        {DASH_PARTS.map((p) => (
          <li key={p.k}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{p.icon}</svg>
            <span><b>{p.t}</b><small>{p.d}</small></span>
          </li>
        ))}
      </ul>
      <p className="ay-wh-shows__note">Each one is compared only with your own usual. Never a diagnosis.</p>
    </section>
  );
}

function Locked({ signedIn, connected, onSignIn, onOpenConnections }) {
  const waiting = signedIn && connected;
  return (
    <div className="ay-wh-locked is-honest">
      <div className="ay-wh-lockpanel" role="region" aria-labelledby="ay-wh-lock-title">
        <span className="ay-wh-lockicon"><LockIcon /></span>
        {waiting ? (
          <>
            <h2 id="ay-wh-lock-title">Your dashboard fills in after the first sync</h2>
            <p>You're connected. Open the ayna app so it can send your latest days, then come back here.</p>
            <div className="ay-wh-lockactions">
              <button type="button" className="ay-wh-btn" onClick={onOpenConnections}>Manage connected apps</button>
            </div>
          </>
        ) : (
          <>
            <h2 id="ay-wh-lock-title">Your health dashboard lives in the app</h2>
            <p><b>Want a more personalized rundown?</b> Connect health data or keep using quick check-ins on Today. Either works.</p>
            <p>It joins ayna Pro when the app launches. Beta testers use it free now.</p>
            <div className="ay-wh-lockjoin">
              <figure className="ay-wh-qr">
                <img src="/ayna-beta-qr.svg" width="132" height="132" alt={`QR code for the ayna beta on TestFlight: ${BETA_URL}`} />
                <figcaption>Scan with your iPhone camera</figcaption>
              </figure>
              <div className="ay-wh-lockactions">
                <a className="ay-wh-btn" href={BETA_URL} target="_blank" rel="noopener noreferrer">Join the beta</a>
                {signedIn
                  ? <button type="button" className="ay-wh-btn is-quiet" onClick={onOpenConnections}>Upload a file or connect Oura</button>
                  : <button type="button" className="ay-wh-btn is-quiet" onClick={onSignIn}>Sign in</button>}
              </div>
            </div>
            <p className="ay-wh-locknote">
              {signedIn
                ? 'Already testing? Connect Apple Health in the app with this same account, and your dashboard shows up here.'
                : 'Already testing? Connect Apple Health in the app, then sign in here with the same account.'}
            </p>
            {/* TODO: link "On Android?" to an Android waitlist page once one exists (none in the site yet). */}
            <p className="ay-wh-locknote is-small">On Android? The beta is iPhone only for now.</p>
          </>
        )}
      </div>
      <WhatItShows />
    </div>
  );
}

export default function WebHealth({ user, health, products = [], needIds = [], hormonalBC = false, quizAnswers = null, onOpenProduct, onAsk, onSignIn, onOpenConnections, onEditAnswers }) {
  // DEVELOPMENT ONLY (?healthdemo=1 on the local dev server, signed out):
  // the made-up demo rows from devDemo.js, so the unlocked layout can be
  // checked without an account. import.meta.env.DEV is false in production builds.
  const demo = DEV_HEALTH_DEMO && !user;
  const today = localToday();
  const demoData = useMemo(() => {
    if (!demo) return null;
    const rows = DEV_HEALTH_DEMO_EMPTY ? [] : devDemoRows(today);
    return {
      status: 'ready', insightRows: rows, connected: DEV_HEALTH_DEMO_EMPTY ? [] : DEV_DEMO_CONNECTIONS, insights: buildInsights(rows, { today }),
      products: DEV_DEMO_PRODUCT_IDS.map(getProductById).filter(Boolean).map((p) => (devDemoAddedAt(today)[p.id] ? { ...p, addedAt: devDemoAddedAt(today)[p.id] } : p)),
      matches: DEV_DEMO_MATCH_IDS.map(getProductById).filter(Boolean),
    };
  }, [demo, today]);
  const h = demoData || health || { status: 'idle', insightRows: [], connected: [], insights: { sections: [] } };

  const rows = h.insightRows || [];
  // Plain calls: the React Compiler memoizes these (manual useMemo here trips it).
  const dash = buildDashboard(rows, { days: 7, today });
  const week = buildDashboard(rows, { days: 30, today });
  const sections = h.insights?.sections || [];
  const signedIn = Boolean(user?.id) || demo;
  const hasData = rows.length > 0 && !(dash.empty && week.empty && !sections.length);
  const name = demo ? '' : (user?.user_metadata?.first_name || user?.user_metadata?.name || '').split(' ')[0];

  // Today with ayna leads every state: it runs on her local log, signed out too.
  const todayFeed = (
    <TodayFeed
      variant="web"
      userId={user?.id || null}
      intake={quizAnswers}
      healthRows={rows}
      cycle={week.cycle?.cycleDay ? week.cycle : null}
      hormonalBC={hormonalBC}
      products={demoData?.products || products}
      onOpenProduct={onOpenProduct}
      onAsk={onAsk ? (q) => onAsk(q) : undefined}
      onEditAnswers={onEditAnswers}
    />
  );

  const header = (
    <header className="ay-wh-top">
      <h1 id="ay-wh-title" className="sr-only">Your health</h1>
      <p className="ay-wh-kicker" aria-hidden="true"><b>Your health</b>{!(signedIn && hasData) && <span>{fmtLongDay(today)}</span>}</p>
      {signedIn && hasData && onOpenConnections && <button type="button" className="ay-wh-btn is-quiet is-small" onClick={onOpenConnections}>Connected apps</button>}
    </header>
  );

  if (signedIn && (h.status === 'loading' || h.status === 'idle') && !rows.length) {
    return (
      <section className="ay-wh" aria-labelledby="ay-wh-title" aria-busy="true">
        {header}
        {todayFeed}
        <div className="ay-wh-loading" role="status"><i /><i /><i /><span>Loading your health data</span></div>
      </section>
    );
  }
  if (signedIn && h.status === 'error' && !rows.length) {
    return (
      <section className="ay-wh" aria-labelledby="ay-wh-title">
        {header}
        {todayFeed}
        <div className="ay-wh-error">
          <h2>We couldn't load your health data</h2>
          <p>Nothing was changed. Check your connection and try again.</p>
          <button type="button" className="ay-wh-btn" onClick={() => h.refresh?.()}>Try again</button>
        </div>
      </section>
    );
  }
  if (!signedIn || !hasData) {
    return (
      <section className="ay-wh is-locked" aria-labelledby="ay-wh-title">
        {header}
        {todayFeed}
        <Locked signedIn={signedIn} connected={(h.connected || []).length > 0} onSignIn={onSignIn} onOpenConnections={onOpenConnections} />
        {/* Signed in without health data: her goals matched to her products still work from the quiz. */}
        {signedIn && (needIds.length > 0 || products.length > 0 || demo) && (
          <div className="ay-wh-starter">
            <HealthStarter needIds={demo ? DEV_DEMO_NEEDS : needIds} products={demoData?.products || products} matches={demoData?.matches || []} onOpenProduct={onOpenProduct} />
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="ay-wh" aria-labelledby="ay-wh-title">
      {header}
      <HealthHome
        name={name}
        rows={rows}
        sections={sections}
        matchContext={h.matchContext || null}
        today={today}
        needIds={demo ? DEV_DEMO_NEEDS : needIds}
        hormonalBC={hormonalBC}
        products={demoData?.products || products}
        matches={demoData?.matches || []}
        onOpenProduct={onOpenProduct}
        onAsk={onAsk}
        surface="web"
        todayFeed={todayFeed}
      />
    </section>
  );
}
