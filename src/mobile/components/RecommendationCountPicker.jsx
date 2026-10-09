export default function RecommendationCountPicker({ value = 3, onChange }) {
  return <div className="ayna-count-choices">
    {[1, 2, 3, 5].map((count) => {
      const selected = Number(value) === count;
      return <button key={count} type="button" aria-label={`${count} ${count === 1 ? 'pick' : 'picks'} per health area`} aria-pressed={selected} onClick={() => onChange(count)}>
        <span className="ayna-count-stack" aria-hidden="true">{Array.from({ length: count }, (_, i) => <i key={i} style={{ '--pick-index': i }} />)}</span>
        <strong>{count}</strong><span>{selected ? 'Selected' : count === 1 ? 'pick' : 'picks'}</span>
      </button>;
    })}
  </div>;
}
