const OPTIONS = [
  { value: 'public', title: 'Everyone', detail: 'Anyone in Community can find and open this playlist.' },
  { value: 'friends', title: 'Friends only', detail: 'Only friends you have accepted can open it.' },
  { value: 'private', title: 'Only me', detail: 'A private collection just for you.' },
];

export default function PlaylistAudiencePicker({ value, onChange, id }) {
  return <fieldset className="am-audience">
    <legend>Who can see this?</legend>
    {OPTIONS.map((option) => <label key={option.value} className={value === option.value ? 'is-selected' : ''} htmlFor={`${id}-${option.value}`}>
      <input id={`${id}-${option.value}`} type="radio" name={id} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
      <span><strong>{option.title}</strong><small>{option.detail}</small></span>
    </label>)}
  </fieldset>;
}
