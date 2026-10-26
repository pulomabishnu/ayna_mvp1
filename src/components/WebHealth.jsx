import { useEffect, useMemo, useState } from 'react';
import { buildDashboard } from '../health/dashboard.js';
import { buildInsights } from '../health/insights.js';
import { healthMatchContext } from '../health/matchContext.js';
import { DEV_DEMO_CONNECTIONS, DEV_DEMO_MATCH_IDS, DEV_DEMO_NEEDS, DEV_DEMO_PRODUCT_IDS, devDemoAddedAt, devDemoRows } from '../health/devDemo.js';
import { getProductById } from '../data/products.js';
import { DEV_HEALTH_DEMO, DEV_HEALTH_DEMO_EMPTY, localToday } from '../mobile/hooks/useHealthData.js';
import { HealthStarter } from '../mobile/components/HealthBento.jsx';
import HealthHome from '../mobile/components/HealthHome.jsx';
import TodayFeed from './today/TodayFeed.jsx';
import { OutlineButton } from './ui/ay/index.js';
import { CurvedRing, CycleRing, DayStrip, ProductStickers, Shapes } from './personality/DS.jsx';
import { headline, readHomeLook } from '../mobile/components/homeLook.js';
import { comingUp } from '../health/comingUp.js';
import { CountRing, ProgressCount } from './ui/ay';
import { glanceRows, syncState } from '../health/dashView.js';
import { Sparkline } from '../mobile/components/DashParts.jsx';
import '../styles/web-health.css';
import '../styles/today-web.css';

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

/** Today (compact): one short card under "More for you", not the full app pitch. */
function ConnectNote({ signedIn, onSignIn, onOpenConnections }) {
  return (
    <section className="ay-wh-connect" aria-labelledby="ay-wh-connect-h">
      <h3 id="ay-wh-connect-h">Want a more personal rundown?</h3>
      <p>Connect health data, or keep using quick check-ins on Today. Either works. Apple Health connects in the ayna iPhone app (beta).</p>
      {/* What the dashboard will hold, in words only (dashboard audit 9.3): nothing here is anyone's data. */}
      <dl className="ay-db-facts is-preview">
        {DASH_PARTS.map((p) => <div key={p.k}><dt>{p.t}</dt><dd>{p.d}</dd></div>)}
      </dl>
      <div className="ay-wh-lockactions">
        {signedIn
          ? <button type="button" className="ay-wh-btn is-quiet" onClick={onOpenConnections}>Upload a file or connect Oura</button>
          : <button type="button" className="ay-wh-btn is-quiet" onClick={onSignIn}>Sign in to connect</button>}
        <a className="ay-wh-btn is-quiet" href={BETA_URL} target="_blank" rel="noopener noreferrer">Join the iPhone beta<span className="sr-only"> (opens in a new tab)</span></a>
      </div>
    </section>
  );
}


const fmtShortDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/**
 * Today's right column (Today audit, issue 5): "Your week" glance rows and
 * "Coming up", then what she is trying now, all from her own data (her log's
 * weekly recap, synced health rows, her cycle estimate, her tries). Words
 * first, the number under them. Nothing here when there is nothing real.
 */
function TodaySide({ week, tiles, coming, trying, setup, today }) {
  const glance = [...(week?.stats || []), ...(week?.changes || [])];
  const done = setup.filter((x) => x.done).length;
  return (
    <>
      {done > 0 && done < setup.length && (
        <section className="ay-wh-side" aria-labelledby="ay-wh-setup-h">
          <h2 id="ay-wh-setup-h" className="ay-wh-side__h">Getting set up</h2>
          <ProgressCount done={done} total={setup.length} unit="set-up steps done" />
          <ul className="ay-wh-side__rows">
            {setup.map((x) => <li key={x.id} className={`is-step${x.done ? ' is-done' : ''}`}><b className="is-line">{x.done ? 'Done: ' : ''}{x.label}</b></li>)}
          </ul>
        </section>
      )}
      {(glance.length > 0 || tiles.length > 0) && (
        <section className="ay-wh-side" aria-labelledby="ay-wh-week-h">
          <h2 id="ay-wh-week-h" className="ay-wh-side__h">Your week</h2>
          <ul className="ay-wh-side__rows">
            {tiles.map((x) => (
              <li key={x.id} className="has-spark"><span><span className="ay-wh-side__label">{x.label}</span><b>{x.words}</b><span className="ay-wh-side__val">{x.value}</span></span><Sparkline points={x.points} band={x.band} metric={x.metric} w={96} label={`${x.label}, last 7 days`} /></li>
            ))}
            {glance.map((line) => <li key={line}><b className="is-line">{line}</b></li>)}
          </ul>
          {week?.open && <button type="button" className="ay-wh-side__more" onClick={week.open}><span>{week.label}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>}
        </section>
      )}
      {coming.length > 0 && (
        <section className="ay-wh-side" aria-labelledby="ay-wh-coming-h">
          <h2 id="ay-wh-coming-h" className="ay-wh-side__h">Coming up</h2>
          <ul className="ay-wh-side__rows">
            {coming.map((c) => <li key={`${c.day}-${c.title}`}><span className="ay-wh-side__label">{c.day === today ? 'Today' : fmtShortDay(c.day)}</span><b>{c.title}</b></li>)}
          </ul>
        </section>
      )}
      {trying.length > 0 && (
        <section className="ay-wh-side" aria-labelledby="ay-wh-trying-h">
          <h2 id="ay-wh-trying-h" className="ay-wh-side__h">Trying now</h2>
          <ul className="ay-wh-side__rows">
            {trying.map((x) => <li key={x.id} className="has-ring"><CountRing value={x.day} total={x.of} size={48} /><span><b>{x.name}</b><span className="ay-wh-side__val">Day {x.day} of {x.of}</span></span></li>)}
          </ul>
        </section>
      )}
    </>
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

/**
 * Today's page top, in every state (no data, data, loading): an espresso band
 * with a wavy edge; the greeting at title size, a day strip, her headline
 * number as the one bold graphic (cycle day, else last night's sleep; none
 * without data) and one die-cut product sticker.
 */
function TodayBand({ title, today, name, cycle, sleepPoints, products }) {
  const hour = new Date().getHours();
  const hello = hour < 5 ? 'Hi' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const look = readHomeLook();
  const num = headline({ cycle, sleepPoints });
  return (
    <header className={`ay-wh-hello ay-pagehead ay-band--espresso is-look-${look}`}>
      <h1 id="ay-wh-title" className="sr-only">{title}</h1>
      <p className="ay-wh-hello__date">{fmtLongDay(today)}</p>
      <p className="ay-wh-hello__hi">{hello}{name ? `, ${name}` : ''}.</p>
      {/* The number in words for screen readers (the ring is decoration). */}
      {num && <p className="sr-only">{`${num.label}: ${num.value}`}</p>}
      <DayStrip iso={today} className="ay-wh-hello__days" />
      <span className={`ay-wh-hello__art${num ? ' has-ring' : ''}`} aria-hidden="true">
        <Shapes className="ay-wh-hello__shapes" />
        {num && (cycle?.cycleDay
          ? <CycleRing day={cycle.cycleDay} length={cycle.avgLength} className="ay-wh-hello__ring" />
          : <CycleRing label={num.label} value={num.value} className="ay-wh-hello__ring" />)}
        <ProductStickers products={products} max={1} className="ay-wh-hello__stickers" />
        {look === 'b' && <span className="ay-wh-hello__curvebox"><CurvedRing text="your week · your week · your week · " className="ay-wh-hello__curve" /></span>}
      </span>
    </header>
  );
}

/**
 * The dashboard's band (dashboard audit 7.1, 14 DashBand): ≈120px espresso
 * with the scalloped edge kept; the date with the sync time, "Your week"
 * (h1, 30px) and the cycle ring (72px). No sticker or loose shapes here:
 * they stay on Today without data and on the landing page.
 */
function DashBand({ title, today, cycle, sync, hormonalBC }) {
  return (
    <header className="ay-db-bandhead ay-pagehead ay-band--espresso">
      <span className="sr-only" id="ay-wh-title">{title}</span>
      <div>
        <p className="ay-db-bandhead__date">{fmtLongDay(today)}{sync && !sync.stale ? ` · ${sync.label}` : ''}</p>
        <h1 className="ay-db-bandhead__h">Your week</h1>
      </div>
      {cycle?.cycleDay && !hormonalBC && (
        <span className="ay-db-bandhead__cyc">
          {/* Every number captioned (Loop B): the ring's number says what it is. */}
          <span className="ay-db-bandhead__cap" aria-hidden="true">Cycle day</span>
          <span className="ay-db-bandhead__ring" role="img" aria-label={`Cycle day ${cycle.cycleDay}${cycle.avgLength ? ` of about ${cycle.avgLength}` : ''}`}>
            <CycleRing day={cycle.cycleDay} length={cycle.avgLength} />
          </span>
        </span>
      )}
    </header>
  );
}

export default function WebHealth({ user, health, products = [], needIds = [], hormonalBC = false, quizAnswers = null, onOpenProduct, onAsk, onSignIn, onOpenConnections, onEditAnswers, onSaveToProfile = null, rundown = {}, title = 'Your health', intro = null, compact = false, aside = null, widgets = null }) {
  // DEVELOPMENT ONLY (?healthdemo=1 on the local dev server, signed out):
  // the made-up demo rows from devDemo.js, so the unlocked layout can be
  // checked without an account. import.meta.env.DEV is false in production builds.
  const demo = DEV_HEALTH_DEMO && !user;
  const today = localToday();
  const demoData = useMemo(() => {
    if (!demo) return null;
    const rows = DEV_HEALTH_DEMO_EMPTY ? [] : devDemoRows(today);
    const insights = buildInsights(rows, { today });
    const signals = [...(insights.signals || []), ...(insights.timing || [])];
    return {
      status: 'ready', insightRows: rows, connected: DEV_HEALTH_DEMO_EMPTY ? [] : DEV_DEMO_CONNECTIONS, insights,
      // Same as useHealthData: "Something to add?" reads the signals her own rows give.
      matchContext: signals.length ? healthMatchContext(signals, DEV_DEMO_NEEDS) : null,
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

  // Today's right column, from TodayFeed (her log's week, what she is trying).
  const [weekInfo, setWeekInfo] = useState(null);
  const [trying, setTrying] = useState([]);
  const [setup, setSetup] = useState([]);
  // With synced data, Today is still the day (Today audit: items, check-in,
  // "Your week" and Coming up); "See your data" opens the dashboard view
  // (/health), and "Back to Today" returns.
  const onHealthPath = () => typeof window !== 'undefined' && /^\/health\/?$/.test(window.location.pathname);
  const [dataView, setDataView] = useState(onHealthPath);
  useEffect(() => {
    const sync = () => setDataView(onHealthPath());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  const goData = (on) => {
    setDataView(on);
    try { window.history.pushState(window.history.state, '', on ? '/health' : '/today'); } catch { /* sandboxed */ }
    try { window.scrollTo({ top: 0 }); } catch { /* old browser */ }
  };
  const dayView = compact && (!(signedIn && hasData) || !dataView);
  // Today with ayna leads every state: it runs on her local log, signed out too.
  const feed = (
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
      onSaveToProfile={onSaveToProfile}
      moreHeading={!compact}
      showHead={!compact}
      {...(dayView ? { onWeekly: setWeekInfo, onTries: setTrying, onSetup: setSetup } : {})}
      {...rundown}
    />
  );
  // Today only: her widgets under the Rundown and today's things (Customize Today).
  const todayFeed = widgets ? <>{feed}{widgets}</> : feed;

  const sleepPoints = dash.groups.flatMap((g) => g.charts).find((c) => c.metric === 'sleep_minutes')?.points || [];
  const band = compact ? <TodayBand title={title} today={today} name={name} cycle={week.cycle?.cycleDay ? week.cycle : null} sleepPoints={sleepPoints} products={demoData?.products || products} /> : null;

  // Today (compact, the first main tab): a greeting from her own clock and one
  // sentence (UX spec 6), then two columns on desktop: the day on the left
  // (Rundown, the 1 to 3 things, her log) and "More for you" on the right.
  // The right column only exists when it has something in it.
  // With synced health data, "See your data" opens the full dashboard (HealthHome carries the feed there).
  if (dayView) {
    const connect = !(signedIn && (h.connected || []).length > 0)
      ? <ConnectNote signedIn={signedIn} onSignIn={onSignIn} onOpenConnections={onOpenConnections} />
      : null;
    // "Your week" from synced health rows, when there are any: words, then the number and her usual.
    // "Your week": the dashboard's own glance rows (same words, number + usual, 7-day line).
    const tiles = glanceRows(rows, today).map((x) => ({ ...x, id: x.metric }));
    const estimate = sections.find((sec) => sec.id === 'cycle')?.estimate || null;
    const coming = comingUp(week.cycle?.cycleDay ? week.cycle : null, estimate, today, { hormonalBC, hasProducts: false });
    const setupLeft = setup.some((x) => x.done) && setup.some((x) => !x.done);
    const hasSide = (signedIn && hasData) || tiles.length > 0 || coming.length > 0 || trying.length > 0 || Boolean(weekInfo) || setupLeft;
    // Loop B (founder 10/10 pass): one centred column on every width, like the app. The day first
    // (Rundown, the 1 to 3 things), then Your week, Coming up and what she is trying, then her widgets.
    // Two columns left a tall empty butter gap under whichever column was shorter.
    return (
      <section className="ay-wh ay-wh--today" aria-labelledby="ay-wh-title">
        {band}
        {intro}
        <div className="ay-wh-day is-single">
          <div className="ay-wh-day__main">
            {feed}
            {hasSide && (
              <div className="ay-wh-day__flow" role="region" aria-label="Your week and coming up">
                <TodaySide week={weekInfo} tiles={tiles} coming={coming} trying={trying} setup={setup} today={today} />
                {signedIn && hasData && <button type="button" className="ay-wh-side__more is-data" onClick={() => goData(true)}><span>See your data</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>}
              </div>
            )}
            {aside && <div className="ay-wh-day__flow">{aside}</div>}
            {widgets}
            {signedIn && (h.status === 'loading' || h.status === 'idle') && !rows.length && <div className="ay-wh-loading" role="status"><i /><i /><i /><span>Loading your health data</span></div>}
            {signedIn && h.status === 'error' && !rows.length && (
              <div className="ay-wh-error">
                <h2>We couldn't load your health data</h2>
                <p>Nothing was changed. Check your connection and try again.</p>
                <button type="button" className="ay-wh-btn" onClick={() => h.refresh?.()}>Try again</button>
              </div>
            )}
            {connect && <div className="ay-wh-day__connect">{connect}</div>}
          </div>
        </div>
      </section>
    );
  }

  // Your health (/health) passes its title.
  const header = (
    <>
      <header className="ay-wh-top">
        <h1 id="ay-wh-title" className="sr-only">{title}</h1>
        <p className="ay-wh-kicker" aria-hidden="true"><b>{title}</b>{!(signedIn && hasData) && <span>{fmtLongDay(today)}</span>}</p>
        {signedIn && hasData && onOpenConnections && <button type="button" className="ay-wh-btn is-quiet is-small" onClick={onOpenConnections}>Connected apps</button>}
      </header>
      {intro}
    </>
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
        {compact && !(signedIn && (h.connected || []).length > 0)
          ? <ConnectNote signedIn={signedIn} onSignIn={onSignIn} onOpenConnections={onOpenConnections} />
          : <Locked signedIn={signedIn} connected={(h.connected || []).length > 0} onSignIn={onSignIn} onOpenConnections={onOpenConnections} />}
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
    <section className={`ay-wh ay-wh--dash${compact ? ' ay-wh--today has-data' : ''}`} aria-labelledby="ay-wh-title">
      <DashBand title={title} today={today} cycle={week.cycle?.cycleDay ? week.cycle : null} sync={syncState(h.connected)} hormonalBC={hormonalBC} />
      {compact && <p className="ay-wh-back"><button type="button" className="ay-wh-side__more" onClick={() => goData(false)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg><span>Back to Today</span></button></p>}
      {intro}
      <HealthHome
        hello={false}
        helloAside={onOpenConnections ? <OutlineButton onClick={onOpenConnections}>Connected apps</OutlineButton> : null}
        connections={h.connected || []}
        onRefresh={h.refresh || null}
        status={h.status}
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
        // "Something to add?" on the website too: adding a goal opens her answers (the app adds it in place).
        onAddGoal={onEditAnswers ? () => { onEditAnswers(); return false; } : undefined}
        surface="web"
        todayFeed={todayFeed}
      />
    </section>
  );
}
