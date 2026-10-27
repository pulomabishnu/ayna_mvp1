import '../styles/ask-home.css';

/**
 * The tile-grid first screen and the wavy ribbon that lived here were
 * replaced by AskPanel (components/ask/AskPanel.jsx, Ask audit Oct 25):
 * grouped prompt pills and a one-line intro. What remains is the stat
 * card for a dashboard question, shared by both surfaces.
 */
/** Her numbers that went with a dashboard question, shown back in the answer. Real values only. */
export function AskStatCard({ stats }) {
  if (!stats?.length) return null;
  return (
    <figure className="ay-askh-stats">
      <figcaption>Your numbers ayna read</figcaption>
      <ul>
        {stats.map((s) => <li key={s.label}><b>{s.value}</b><small>{s.label}</small></li>)}
      </ul>
    </figure>
  );
}

