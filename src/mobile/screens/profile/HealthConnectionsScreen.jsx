import { useMemo, useState } from 'react';
import HealthConnectionsScreenCore from './HealthConnectionsScreenCore.jsx';
import ProFeatureGate from '../../../components/ProFeatureGate.jsx';
import { apiSourceFor, sourceById } from '../../data/healthConnections.js';
import { useHealthData } from '../../hooks/useHealthData.js';

/**
 * Shared access boundary for web + app Health Data. Starting a NEW supported
 * app/wearable connection is a Pro benefit. Existing connections always stay
 * manageable so disconnect/delete/privacy controls cannot be paywalled.
 * Upload/manual/request-data paths remain available outside this gate.
 */
export default function HealthConnectionsScreen(props) {
  const [pendingId, setPendingId] = useState(null);
  const health = useHealthData(props.authUser?.id || null);

  const connectedSources = useMemo(() => new Set(
    (health.connections || [])
      .filter((connection) => connection.status !== 'disconnected')
      .map((connection) => connection.source)
  ), [health.connections]);

  const needsPro = (id) => {
    const sourceId = String(id || '').split(':')[0];
    const source = sourceById(sourceId);
    if (!source || !['oauth', 'device'].includes(source.availability)) return false;
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

  const gatedId = pendingId || (needsPro(props.selectedId) ? props.selectedId : null);
  if (!gatedId) {
    return <HealthConnectionsScreenCore {...props} onSelect={handleSelect} />;
  }

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
