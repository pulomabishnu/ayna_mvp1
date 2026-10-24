// "Not useful" reasons (UX spec section 9), shown by NotUsefulMenu.jsx and
// stored with decisionEngine's dismissWithReason().
export const NOT_USEFUL_REASONS = [
  { id: 'already_knew', label: 'I already knew this' },
  { id: 'not_relevant', label: 'Not relevant to me' },
  { id: 'dont_show_type', label: 'Don’t show this type' },
  { id: 'info_changed', label: 'My information changed' },
];
export const NOT_USEFUL_REASON_IDS = NOT_USEFUL_REASONS.map((r) => r.id);
