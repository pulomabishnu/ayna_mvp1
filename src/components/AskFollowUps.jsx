import { useEffect } from 'react';
import { trackFollowUp, trackFollowUpsRendered } from '../utils/askFollowUps.js';
import '../styles/ask-followups.css';

const ICON = {
  open_product: '→',
  browse: '→',
  open_dashboard: '→',
  open_library: '→',
  open_guide: '→',
  ask: '↗',
  ask_else: '+',
};

/**
 * The row of next steps under an Ask ayna answer. Same component on the app
 * sheet and the website panel; each surface passes onAction.
 */
export default function AskFollowUps({ chips, onAction, disabled = false }) {
  const signature = (chips || []).map((f) => f?.type).filter(Boolean).join('|');
  useEffect(() => {
    if (signature) trackFollowUpsRendered(chips);
    // Only the safe type signature matters. Labels can contain health context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  if (!chips?.length) return null;
  return (
    <div className="ay-followups" role="group" aria-label="Next steps">
      {chips.map((f, i) => (
        <button
          key={`${f.type}-${i}`}
          type="button"
          className={`ay-followup${f.type === 'ask_else' ? ' is-else' : ''}`}
          disabled={disabled}
          onClick={() => { trackFollowUp(f.type); onAction(f); }}
        >
          <span className="ay-followup__label">{f.label}</span>
          <span className="ay-followup__icon" aria-hidden="true">{ICON[f.type] || '→'}</span>
        </button>
      ))}
    </div>
  );
}
