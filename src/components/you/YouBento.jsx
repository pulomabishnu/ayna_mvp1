import { useEffect, useState } from 'react';
import { Bento, Tile, Plate } from '../ui/ay';
import { readBlend } from '../../utils/houseBlend.js';
import { resolveCatalogProductImage } from '../ProductTileImage.jsx';
import { requestPro } from '../../utils/proApi.js';
import { openProPaywall, PRO_CHANGED_EVENT } from '../../pro/paywall.js';
import './you-bento.css';

/**
 * The You hub as one bento (uniqueness pass; intelly dashboard, #007b85fd
 * "At a glance"): her three numbers and the five sections in mixed sizes
 * and tones. My ecosystem is the big tile and shows her real product photos
 * on scallop plates. "Your blend" appears only when her quiz answers set at
 * least one of the house-blend preferences (src/utils/houseBlend.js reads the
 * same fields the matcher reads); it shows where each slider sits and opens
 * the editor. Same tiles on web and app.
 *
 * tiles: { eco, saved, checkins, health, activity, settings, logout (list layout only) } each
 *   { value?, caption, sub?, onClick? }; products: her ecosystem;
 *   intake: fullHealthIntake (for the blend); onOpenBlend.
 */

const ICON = {
  saved: <path d="M7 4h10v16l-5-3.5L7 20V4Z" />,
  checkins: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
  blend: <path d="M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4" />,
  health: <path d="M3 12h4l2-5 4 10 2-5h6" />,
  activity: <path d="M5 6h14M5 12h14M5 18h9" />,
  pro: <><path d="M12 3.5l2.2 5.3 5.3 2.2-5.3 2.2L12 18.5l-2.2-5.3L4.5 11l5.3-2.2Z" /><path d="M18.5 17.5l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8Z" /></>,
  logout: <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" /></>,
};
const ARROW = <svg className="yb-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>;

function tileProps(t, aria) {
  return t?.onClick ? { as: 'button', type: 'button', onClick: t.onClick, 'aria-label': aria } : { role: 'group', 'aria-label': aria };
}

/** Where each blend preference sits, drawn as the House Blend track (read-only here). */
export function BlendPreview({ intake }) {
  const rows = intake ? readBlend(intake).filter((r) => r.value != null) : [];
  if (!rows.length) return null;
  return (
    <ul className="yb-blend" aria-hidden="true">
      {rows.map((r) => {
        const max = r.steps.length - 1;
        const pct = max ? (r.value / max) * 100 : 50;
        return (
          <li key={r.id}>
            <span>{r.left}</span>
            <i style={{ '--pct': `${pct}%` }}><b /></i>
            <span>{r.right}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function blendSaid(intake) {
  const rows = intake ? readBlend(intake).filter((r) => r.value != null) : [];
  return rows.map((r) => r.steps[r.value]).join(', ');
}

const CHEVRON = <svg className="yb-row__go" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>;

/** One settings-style row: leading icon, name and one line, trailing count, chevron. */
function Row({ k, t }) {
  if (!t) return null;
  const inner = <>
    <svg className="yb-row__icon" viewBox="0 0 24 24" aria-hidden="true">{ICON[k]}</svg>
    <span className="yb-row__text"><b>{t.caption}</b>{t.sub && <small>{t.sub}</small>}</span>
    <span className="yb-row__n">{t.value || ''}</span>
    {t.onClick && k !== 'logout' && CHEVRON}
  </>;
  return <li>{t.onClick ? <button type="button" className={`yb-row${k === 'pro' ? ' yb-row--pro' : ''}`} onClick={t.onClick}>{inner}</button> : <div className="yb-row">{inner}</div>}</li>;
}

function useProOffer() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let live = true;
    const load = () => requestPro()
      .then((status) => { if (live) setAvailable(status?.active !== true && status?.offerOpen === true); })
      .catch(() => { if (live) setAvailable(false); });
    load();
    const changed = () => load();
    window.addEventListener(PRO_CHANGED_EVENT, changed);
    window.addEventListener('focus', changed);
    return () => {
      live = false;
      window.removeEventListener(PRO_CHANGED_EVENT, changed);
      window.removeEventListener('focus', changed);
    };
  }, []);
  return available;
}

export default function YouBento({ tiles = {}, products = [], intake = null, onOpenBlend = null, className = '', layout = 'bento' }) {
  const { eco, saved, checkins, health, activity, settings, logout } = tiles;
  const shown = products.filter((p) => p?.id).slice(0, 3);
  const said = blendSaid(intake);
  const proOffer = useProOffer();
  const pro = proOffer ? {
    caption: 'Upgrade to ayna Pro',
    sub: 'Health data, deeper insights and higher limits',
    onClick: () => openProPaywall({ feature: 'dashboard', featureName: 'ayna Pro' }),
  } : null;
  // App You (critique, Oct 27): one colour rule. Espresso is the one feature card (My ecosystem),
  // everything else is a calm grouped list on the butter surface; pink is kept for "for you / now".
  if (layout === 'list') {
    return (
      <div className={`yb yb--list ${className}`.trim()}>
        {eco && (
          <Tile tone="ink" className="yb-tile is-eco" {...tileProps(eco, `${eco.caption}: ${eco.value}. ${eco.sub || ''}${shown.length ? ` Including ${shown.map((p) => p.name).join(', ')}.` : ''}`)}>
            <span className="yb-top"><span className="ayb-tile__label">{eco.caption}</span>{eco.onClick && ARROW}</span>
            {shown.length > 0 && (
              <span className="yb-plates" aria-hidden="true">
                {shown.map((p) => <Plate key={p.id} src={resolveCatalogProductImage(p) || ''} alt="" fallback={p.brand || p.name} className="yb-plate" />)}
              </span>
            )}
            <span className="yb-num"><span className="ayb-tile__big">{eco.value}</span><span className="ayb-tile__cap">{eco.sub}</span></span>
          </Tile>
        )}
        {pro && <ul className="yb-list yb-list--pro" aria-label="ayna Pro"><Row k="pro" t={pro} /></ul>}
        <ul className="yb-list" aria-label="Your things">
          <Row k="saved" t={saved} />
          <Row k="checkins" t={checkins} />
          <Row k="health" t={health} />
          <Row k="activity" t={activity} />
          {said && <Row k="blend" t={{ caption: 'Your blend', sub: said, onClick: onOpenBlend }} />}
        </ul>
        {(settings || logout) && <ul className="yb-list" aria-label="Settings"><Row k="settings" t={settings} /><Row k="logout" t={logout} /></ul>}
      </div>
    );
  }
  const section = (key, t, tone, span = '') => t && (
    <Tile key={key} tone={tone} span={span === 'full' ? '' : span} className={`yb-tile is-${key}${span === 'full' ? ' is-full' : ''}`} {...tileProps(t, `${t.caption}${t.value ? `, ${t.value}` : ''}. ${t.sub || ''}`)}>
      <span className="yb-top"><svg className="yb-icon" viewBox="0 0 24 24" aria-hidden="true">{ICON[key]}</svg>{t.onClick && ARROW}</span>
      <span className="yb-name">{t.caption}</span>
      <span className="ayb-tile__cap">{t.value ? <b>{t.value} · </b> : null}{t.sub}</span>
    </Tile>
  );
  return (
    <Bento className={`yb ${className}`.trim()}>
      {eco && (
        <Tile tone="ink" span="big" className="yb-tile is-eco" {...tileProps(eco, `${eco.caption}: ${eco.value}. ${eco.sub || ''}${shown.length ? ` Including ${shown.map((p) => p.name).join(', ')}.` : ''}`)}>
          <span className="yb-top"><span className="ayb-tile__label">{eco.caption}</span>{eco.onClick && ARROW}</span>
          {shown.length > 0 && (
            <span className="yb-plates" aria-hidden="true">
              {shown.map((p) => <Plate key={p.id} src={resolveCatalogProductImage(p) || ''} alt="" fallback={p.brand || p.name} className="yb-plate" />)}
            </span>
          )}
          <span className="yb-num"><span className="ayb-tile__big">{eco.value}</span><span className="ayb-tile__cap">{eco.sub}</span></span>
        </Tile>
      )}
      {saved && (
        <Tile tone="calm" className="yb-tile is-saved" {...tileProps(saved, `${saved.caption}: ${saved.value}. ${saved.sub || ''}`)}>
          <span className="yb-top"><span className="ayb-tile__label">{saved.caption}</span>{saved.onClick && ARROW}</span>
          <span className="yb-num"><span className="ayb-tile__big">{saved.value}</span><span className="ayb-tile__cap">{saved.sub}</span></span>
        </Tile>
      )}
      {checkins && (
        <Tile tone="calm" className="yb-tile is-checkins" {...tileProps(checkins, `${checkins.caption}: ${checkins.value}.`)}>
          <span className="yb-top"><span className="ayb-tile__label">{checkins.caption}</span>{checkins.onClick && ARROW}</span>
          <span className="yb-num"><span className="ayb-tile__big">{checkins.value}</span><span className="ayb-tile__cap">{checkins.sub}</span></span>
        </Tile>
      )}
      {section('health', health, 'calm')}
      {section('activity', activity, 'calm')}
      {said && (
        <Tile tone="calm" span="wide" className="yb-tile is-blend" {...tileProps({ onClick: onOpenBlend }, `Your blend: ${said}.${onOpenBlend ? ' Open to change.' : ''}`)}>
          <span className="yb-top"><span className="ayb-tile__label">Your blend</span>{onOpenBlend && ARROW}</span>
          <BlendPreview intake={intake} />
        </Tile>
      )}
      {section('settings', settings, 'calm', said ? 'wide' : 'full')}
    </Bento>
  );
}
