import { useMemo } from 'react';
import { HomeHero, HomeShortcuts } from '../../mobile/components/HomeHero.jsx';
import { buildDashboard } from '../../health/dashboard.js';
import { usesHormonalBC } from '../../health/weekInsights.js';
import { localToday } from '../../mobile/hooks/useHealthData.js';
import './web-home-top.css';

/*
 * The website Home, top (founder, Oct 28: "copy the app Home layout"). The same pieces the app's Home
 * uses, unchanged: the espresso band with the greeting, the date and her three dials (real data only;
 * with none, one Connect button), then the two shortcut tiles, Your data and Your products. The lists
 * (Using, For you, Saved, Routine) follow underneath on the page.
 */
export default function WebHomeTop({ firstName = '', healthRows = [], quizAnswers = null, products = [], onData, onProducts, onConnect }) {
  const today = localToday();
  const { cycle, sleep, activity } = useMemo(() => {
    const w = buildDashboard(healthRows || [], { days: 30, today });
    const all = w.groups.flatMap((g) => g.charts);
    const chartOf = (m) => all.find((c) => c.metric === m) || null;
    return { cycle: w.cycle?.cycleDay ? w.cycle : null, sleep: chartOf('sleep_minutes'), activity: chartOf('steps') };
  }, [healthRows, today]);
  return (
    <div className="wht">
      <HomeHero name={firstName} today={today} cycle={cycle} hormonalBC={usesHormonalBC(quizAnswers)} sleep={sleep} activity={activity}
        onOpenMetric={onData ? () => onData() : null} onConnect={onConnect} />
      <div className="wht__tiles">
        <HomeShortcuts cycle={cycle} sleep={sleep} products={products} onData={onData} onProducts={onProducts} />
      </div>
    </div>
  );
}
