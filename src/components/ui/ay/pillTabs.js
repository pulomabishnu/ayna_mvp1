export const PILL_TABS_MAX = 5;

/** Props for the panel that goes with a PillTabs tab. */
export function pillPanelProps(idBase, id, active) {
  return { role: 'tabpanel', id: `${idBase}-panel-${id}`, 'aria-labelledby': `${idBase}-tab-${id}`, tabIndex: 0, hidden: id !== active };
}
