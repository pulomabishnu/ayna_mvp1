// Same three audiences everywhere in Community. The stored values stay
// 'private' | 'friends' | 'public' (community_playlists.visibility).
// Collaborators can always open a playlist they were added to.
const OPTIONS = [
  { value: 'private', title: 'Only me', detail: 'Just you, plus anyone you add as a collaborator.' },
  { value: 'friends', title: 'Friends', detail: 'Friends you have accepted can open it.' },
  { value: 'public', title: 'Public', detail: 'Anyone in Community can find and open it.' },
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
