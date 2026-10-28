import { useMemo, useState } from 'react';
import HealthConnectionsScreenCore from './HealthConnectionsScreenCore.jsx';
import ProFeatureGate from '../../../components/ProFeatureGate.jsx';
import { Capacitor } from '@capacitor/core';
import { apiSourceFor, availabilityFor, sourceById } from '../../data/healthConnections.js';
import { useHealthData } from '../../hooks/useHealthData.js';

/**
 * Health Data is a Pro surface. Free users hit the Pro boundary before seeing
 * the connection workflow. Existing connections remain manageable even if Pro
 * later expires so disconnect/delete/privacy controls are never paywalled.
 */
export default function HealthConnectionsScreen(props) {
  const [pendingId, setPendingId] = useState(null);
  const health = useHealthData(props.authUser?.id || null);

  const connectedSources = useMemo(() => new Set(
    (health.connections || [])
      .filter((connection) => connection.status !== 'disconnected')
      .map((connection) => connection.source)
  ), [health.connections]);

  const hasExistingConnection = connectedSources.size > 0;

  const needsPro = (id) => {
    const sourceId = String(id || '').split(':')[0];
    const source = sourceById(sourceId);
    if (!source || !['oauth', 'device'].includes(source.availability)) return false;
    // A source this device can't connect at all (e.g. Apple Health in a browser) shows its own
    // honest explanation instead of a paywall for something she could not use.
    if (!availabilityFor(source, { isNative: Capacitor.isNativePlatform(), nativePlatform: Capacitor.getPlatform() }).ok) return false;
    return !connectedSources.has(apiSourceFor(sourceId));
  };

  const handleSelect = (id) => {
    if (!needsPro(id)) {
      props.onSelect?.(id);
      return;
    }
    if (!props.authUser?.id && props.onSignIn) {
      props.onSignIn();
      return;
    }
    setPendingId(id);
  };

  const core = (
    <HealthConnectionsScreenCore
      {...props}
      onSelect={handleSelect}
    />
  );

  // Doorway gate: a Free account with nothing connected should never land in
  // the provider picker first. Pro members pass straight through after the
  // shared entitlement check. Former Pro members with existing data bypass
  // this outer gate only so they can disconnect/delete what they already shared.
  // While her connections load (signed in, first load), don't decide yet: a
  // former Pro member with data would otherwise see the lock flash first.
  if (props.authUser?.id && !props.selectedId && ['idle', 'loading'].includes(health.status) && !hasExistingConnection) {
    return <div className="ay-health-doorway-wait" role="status" aria-live="polite"><span className="sr-only">Loading health data</span></div>;
  }
  if (!hasExistingConnection && !props.selectedId && !pendingId) {
    return (
      <ProFeatureGate feature="wearables" title="Health data" onBack={props.onBack}>
        {core}
      </ProFeatureGate>
    );
  }

  const gatedId = pendingId || (needsPro(props.selectedId) ? props.selectedId : null);
  if (!gatedId) return core;

  const source = sourceById(String(gatedId).split(':')[0]);
  const closeGate = () => {
    if (pendingId) setPendingId(null);
    else props.onBack?.();
  };

  return (
    <ProFeatureGate
      feature="wearables"
      title={`Connect ${source?.name || 'health data'}`}
      onBack={closeGate}
    >
      <HealthConnectionsScreenCore
        {...props}
        selectedId={gatedId}
        onSelect={handleSelect}
        onBack={closeGate}
      />
    </ProFeatureGate>
  );
}
