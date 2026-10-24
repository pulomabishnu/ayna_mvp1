/**
 * The Ask ayna tab. The Ask ayna conversation itself fills this tab for
 * everyone (MobileApp mounts AskAynaModal as the tab's content): signed out,
 * its guided starters still work, and questions answered on this phone
 * (matches, history, today, the rundown) need no account.
 */
export default function AskTabScreen() {
  return <div className="ax ay-ask-tab-host" aria-hidden="true" />;
}
