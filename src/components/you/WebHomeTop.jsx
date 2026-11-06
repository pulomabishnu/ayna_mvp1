import { useMemo } from 'react';
import { HomeHero, HomeHighlights, HomeShortcuts } from '../../mobile/components/HomeHero.jsx';
import { buildDashboard } from '../../health/dashboard.js';
import { explainWeek } from '../../health/weekInsights.js';
import { findingTitle, usualBand } from '../../health/dashView.js';
import WeekBento, { glanceCharts } from '../today/WeekBento.jsx';
import { usesHormonalBC } from '../../health/weekInsights.js';
import { localToday } from '../../mobile/hooks/useHealthData.js';
import './web-home-top.css';

/*
 * The website Home, top (founder, Oct 28: "copy the app Home layout"). The same pieces the app's Home
 * uses, unchanged: the espresso band with the greeting, the date and her three dials (real data only;
 * with none, one Connect button), then the two shortcut tiles, Your data and Your products. The lists
 * (Using, For you, Saved, Routine) follow underneath on the page.
 */
export default function WebHomeTop({ firstName = '', healthRows = [], quizAnswers = null, products = [], onData, onProducts, onConnect, refresh = null }) {
  const today = localToday();
  // Reuse the app Home's real-data charts and weekly highlights, not a second scoring model.
  const { cycle, sleep, activity, highlights, charts, bandOf } = useMemo(() => {
    const rows = healthRows || [];
    const week = buildDashboard(rows, { days: 30, today });
    const long = buildDashboard(rows, { days: 90, today });
    const all = week.groups.flatMap((g) => g.charts);
    const longAll = long.groups.flatMap((g) => g.charts);
    const chartOf = (metric) => all.find((c) => c.metric === metric) || null;
    const bandOf = (metric) => usualBand(longAll.find((c) => c.metric === metric)?.points, today);
    const cycle = week.cycle?.cycleDay ? week.cycle : null;
    const highlights = rows.length ? explainWeek(rows, { today, cycle, estimate: null, hormonalBC: usesHormonalBC(quizAnswers), max: 5 }).insights.map((item) => {
      const chart = chartOf(item.metric);
      return { id: item.id, metric: chart ? item.metric : null, title: findingTitle(item), label: chart ? (chart.metric === 'sleep_minutes' ? 'Sleep' : chart.metric === 'steps' ? 'Steps' : chart.label) : 'Your week', chart, band: chart ? bandOf(chart.metric) : null };
    }) : [];
    return { cycle, sleep: chartOf('sleep_minutes'), activity: chartOf('steps'), highlights, charts: rows.length ? glanceCharts(week) : [], bandOf };
  }, [healthRows, today, quizAnswers]);
  return (
    <div className="wht">
      <HomeHero name={firstName} today={today} cycle={cycle} hormonalBC={usesHormonalBC(quizAnswers)} sleep={sleep} activity={activity}
        onOpenMetric={onData ? () => onData() : null} onConnect={onConnect} />
      {refresh}
      <HomeHighlights items={highlights} today={today} onOpen={onData} />
      <div className="wht__tiles">
        <HomeShortcuts cycle={cycle} sleep={sleep} products={products} onData={onData} onProducts={onProducts} />
      </div>
      {charts.length > 0 && (
        <section className="wht__week" aria-labelledby="wht-week-h">
          <h2 id="wht-week-h" className="sr-only">Your week</h2>
          <WeekBento variant="home" charts={charts} bandOf={bandOf} today={today} onOpen={onData} />
        </section>
      )}
    </div>
  );
}
