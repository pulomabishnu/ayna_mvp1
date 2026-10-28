import BackLink from './BackLink.jsx';

/**
 * Header for the older account pages (Recommendations, Screenings, Compare,
 * Not for me, Appointment prep, Your products). Same pattern as the
 * Settings and EdPage headers (walkthrough P1-12): back link, left-aligned
 * H1, one or two short lines, optional actions. No band, no centred text.
 * Styles: src/styles/chrome.css (.ay-acct-head).
 */
export default function AccountHead({ title, back, children, actions }) {
  return (
    <header className="ay-acct-head">
      {back && <BackLink label={back.label} href={back.href} onClick={back.onClick} />}
      <h1 className="ay-acct-head__title">{title}</h1>
      {children && <div className="ay-acct-head__lede">{children}</div>}
      {actions && <div className="ay-acct-head__actions">{actions}</div>}
    </header>
  );
}
