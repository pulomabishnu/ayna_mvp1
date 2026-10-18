import { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  DATA_TYPES,
  HEALTH_SOURCES,
  SOURCE_GROUPS,
  availabilityFor,
  formatSynced,
  loadConnections,
  saveConnections,
} from '../../data/healthConnections.js';
import './health-connections.css';

/**
 * Health data: connect wearables and health records.
 *
 * MOCKUP. Connecting only flips local state (persisted in localStorage) so the
 * flow can be reviewed. Real HealthKit / Health Connect / Oura wiring replaces
 * `connect` and `disconnect` below; see docs/wearables-ehr-integration.md.
 * While MOCKUP is true, device-only sources can be "connected" from the web too.
 */
const MOCKUP = true;

const SOURCE_ICONS = {
  heart: <path d="M12 19.5s-7-4.3-7-9.3A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.2c0 5-7 9.3-7 9.3Z" />,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 17.5h2" /></>,
  ring: <><circle cx="12" cy="13" r="6" /><path d="M9.5 7.5 12 4l2.5 3.5" /></>,
  watch: <><rect x="7" y="7" width="10" height="10" rx="3" /><path d="M9 7l.7-4h4.6l.7 4M9 17l.7 4h4.6l.7-4M12 10v2.2l1.4 1" /></>,
  record: <><path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20Z" /><path d="M14 3.5V8h4M10 13h5M12.5 10.5v5" /></>,
  clinic: <><path d="M4 20V9l8-5 8 5v11Z" /><path d="M12 10.5v5M9.5 13h5M4 20h16" /></>,
};

function SourceIcon({ name }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{SOURCE_ICONS[name]}</svg>;
}

function Chevron() {
  return <svg className="ay-hc-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>;
}

function Switch({ on, onClick, label }) {
  return (
    <button type="button" role="switch" aria-checked={!!on} aria-label={label} className="ay-hc-switch" onClick={onClick}>
      <span />
    </button>
  );
}

function statusFor(source, connection, now) {
  if (connection) return { text: formatSynced(connection.syncedAt, now), tone: 'on' };
  if (source.phase > 1) return { text: 'Coming soon', tone: 'soon' };
  return { text: source.note, tone: 'off' };
}

function SourceList({ connections, onOpen, now }) {
  return (
    <>
      <p className="ay-hc-intro">Connect your devices and records to sharpen your matches. Only you see this data. Brands never do.</p>
      {SOURCE_GROUPS.map((group) => (
        <section key={group.id} className={`ay-hc-group is-${group.tone}`} aria-label={group.title}>
          <h2>{group.title}</h2>
          <div className="ay-hc-card">
            {HEALTH_SOURCES.filter((s) => s.group === group.id).map((source) => {
              const connection = connections[source.id];
              const status = statusFor(source, connection, now);
              return (
                <button type="button" key={source.id} className="ay-hc-row" onClick={() => onOpen(source.id)}>
                  <span className="ay-hc-icon"><SourceIcon name={source.icon} /></span>
                  <span className="ay-hc-row-text">
                    <span className="ay-hc-row-title">{source.name}</span>
                    <span className={`ay-hc-row-sub is-${status.tone}`}>{status.text}</span>
                  </span>
                  {connection ? <span className="ay-hc-pill is-on">On</span> : <Chevron />}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <ul className="ay-hc-promises">
        <li>Used only for your personal matches.</li>
        <li>Never shared with or sold to brands, and never changes what partners pay for.</li>
        <li>Disconnect any time and we delete everything we pulled.</li>
      </ul>
    </>
  );
}

function SourceDetail({ source, connection, onConnect, onDisconnect, onUpdateTypes, now }) {
  const isNative = Capacitor.isNativePlatform();
  const availability = availabilityFor(source, { isNative, nativePlatform: Capacitor.getPlatform() });
  const [types, setTypes] = useState(() => connection?.types || []);
  const [connecting, setConnecting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const soon = source.phase > 1;
  const canConnect = !soon && types.length > 0 && (availability.ok || MOCKUP);

  const toggle = (id) => {
    const next = types.includes(id) ? types.filter((t) => t !== id) : [...types, id];
    setTypes(next);
    if (connection) onUpdateTypes(next);
  };

  const connect = () => {
    setConnecting(true);
    // Real build: HealthKit / Health Connect permission sheet, or vendor OAuth redirect.
    window.setTimeout(() => { setConnecting(false); onConnect(types); }, 900);
  };

  return (
    <div className="ay-hc-detail">
      <div className="ay-hc-detail-head">
        <span className="ay-hc-icon is-lg"><SourceIcon name={source.icon} /></span>
        <div>
          <h2>{source.name}</h2>
          <p>{connection ? formatSynced(connection.syncedAt, now) : source.note}</p>
        </div>
      </div>

      {!availability.ok && !connection && <p className="ay-hc-note">{availability.reason}{MOCKUP ? ' (Preview: connect works here for review.)' : ''}</p>}
      {soon && <p className="ay-hc-note">Coming soon. Turn on what you'd share and we'll let you know when it's ready.</p>}

      <section className="ay-hc-group is-peri" aria-label="What to share">
        <h2>{connection ? 'Sharing' : 'Choose what to share'}</h2>
        <div className="ay-hc-card">
          {source.dataTypes.map((id) => {
            const type = DATA_TYPES[id];
            return (
              <div key={id} className="ay-hc-row is-static">
                <span className="ay-hc-row-text">
                  <span className="ay-hc-row-title">{type.label}</span>
                  <span className="ay-hc-row-sub">{type.detail}. {type.usedFor}.</span>
                </span>
                <Switch on={types.includes(id)} onClick={() => toggle(id)} label={type.label} />
              </div>
            );
          })}
        </div>
      </section>

      {connection && types.length > 0 && (
        <section className="ay-hc-group is-butter" aria-label="What changed">
          <h2>What this changes</h2>
          <div className="ay-hc-card ay-hc-changes">
            {types.map((id) => <div key={id} className="ay-hc-change"><b>{DATA_TYPES[id].label}</b><span>{DATA_TYPES[id].usedFor} use it.</span></div>)}
            <span className="ay-hc-sample">Preview. Real changes appear after the first sync.</span>
          </div>
        </section>
      )}

      {!connection && (
        <button type="button" className="ay-hc-primary" disabled={!canConnect || connecting} onClick={connect}>
          {soon ? 'Notify me' : connecting ? 'Connecting…' : types.length ? `Connect ${source.name}` : 'Pick at least one'}
        </button>
      )}

      {connection && !confirming && (
        <button type="button" className="ay-hc-danger" onClick={() => setConfirming(true)}>Disconnect and delete data</button>
      )}
      {connection && confirming && (
        <div className="ay-hc-confirm" role="alertdialog" aria-label="Confirm disconnect">
          <p>Disconnect {source.name}? Everything ayna pulled from it is deleted. Your matches go back to your answers only.</p>
          <div>
            <button type="button" className="ay-hc-ghost" onClick={() => setConfirming(false)}>Keep</button>
            <button type="button" className="ay-hc-danger is-solid" onClick={() => { setConfirming(false); setTypes([]); onDisconnect(); }}>Disconnect</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HealthConnectionsScreen({ selectedId, onSelect }) {
  const [connections, setConnections] = useState(loadConnections);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => { saveConnections(connections); }, [connections]);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(t);
  }, []);

  const source = useMemo(() => HEALTH_SOURCES.find((s) => s.id === selectedId) || null, [selectedId]);

  if (!source) return <SourceList connections={connections} onOpen={onSelect} now={now} />;

  const connection = connections[source.id];
  return (
    <SourceDetail
      key={source.id}
      source={source}
      connection={connection}
      now={now}
      onConnect={(types) => {
        const at = new Date().toISOString();
        setNow(Date.now());
        setConnections((c) => ({ ...c, [source.id]: { types, connectedAt: at, syncedAt: at } }));
      }}
      onUpdateTypes={(types) => setConnections((c) => (types.length
        ? { ...c, [source.id]: { ...c[source.id], types } }
        : Object.fromEntries(Object.entries(c).filter(([k]) => k !== source.id))))}
      onDisconnect={() => setConnections((c) => Object.fromEntries(Object.entries(c).filter(([k]) => k !== source.id)))}
    />
  );
}
