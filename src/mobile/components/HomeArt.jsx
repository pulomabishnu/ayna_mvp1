import { Shout } from '../../components/ui/ay';
import '../../styles/unique-b.css';
import { CurvedRing, DayStrip, Mark, ProductStickers, Shapes } from '../../components/personality/DS.jsx';
import { headline } from './homeLook.js';

/** Greeting and the day strip over Home. */
export function HomeHello({ name = '', today }) {
  const hour = new Date().getHours();
  const hello = hour < 5 ? 'Hello' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="ay-home-hello is-band">
      {today && <p className="ay-home-hello__date">{new Date(`${today}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>}
      {/* The page's one shout (uniqueness pass): the greeting, oversized on the espresso band. */}
      <Shout as="p" size="l" className="ay-home-hello__hi">{hello}{name ? `, ${name}` : ''}</Shout>
      <DayStrip iso={today} className="ay-home-hello__days" />
    </div>
  );
}

/** The hero art over the Rundown block: the number (ring), drawn shapes, stickers by density. */
export function HomeHeroArt({ look = 'a', products = [], cycle = null, sleepPoints = [] }) {
  const h = headline({ cycle, sleepPoints });
  const C = 2 * Math.PI * 38;
  return (
    <div className={`ay-home-art is-${look}`} aria-hidden="true">
      <Shapes className="ay-home-art__shapes" />
      {h && (
        <span className={`ay-home-art__num${h.small ? ' is-small' : ''}`}>
          {look === 'b' && <CurvedRing className="ay-home-art__curve" text="your week · your week · your week · " />}
          <svg viewBox="0 0 92 92" className="ay-home-art__ring">
            <circle cx="46" cy="46" r="38" className="is-track" />
            {h.frac != null && <circle cx="46" cy="46" r="38" className="is-arc" strokeDasharray={`${C * h.frac} ${C}`} transform="rotate(-90 46 46)" />}
          </svg>
          <b><small>{h.label}</small>{h.value}</b>
        </span>
      )}
      <ProductStickers products={products} max={1} className="ay-home-art__stickers" />
      {look === 'b' && <Mark name="sparkle" className="ay-home-art__spark" />}
    </div>
  );
}
