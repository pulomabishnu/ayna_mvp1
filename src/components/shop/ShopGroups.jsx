import React from 'react';
import { Chip, ChipRow } from '../ui/ay';
import { SHOP_GROUPS, MACRO_GROUPS, shopGroupFor } from '../../data/catalogTaxonomy.js';
import { sentenceCase } from '../../utils/sentenceCase.js';
import '../explore/explore-shared.css';

/**
 * Five shopping groups (team meeting, Oct 26: "cut the categories to about 5"), website and app.
 * The first row is All plus the five groups; picking a group opens its areas one tap deeper.
 * `active` is the current area id (a group id, a fine area id or 'all'); `available` the fine
 * area ids that have products (optional). UI only: filtering uses itemMatchesMacroGroup.
 */
export default function ShopGroups({ active = 'all', onPick, available = null, className = '', subs: showSubs = true, label = 'Shop by group', flat = false }) {
  // Flat (website Shop hero, founder Oct 28: "more categories at the top to swipe through"):
  // every area that has products in one swipeable row, in the five groups' order.
  if (flat) {
    const order = SHOP_GROUPS.flatMap((x) => x.covers);
    const areas = order.filter((id, i) => order.indexOf(id) === i && (!available || available.includes(id)))
      .map((id) => MACRO_GROUPS.find((m) => m.id === id)).filter(Boolean);
    const on = areas.some((m) => m.id === active) ? active : 'all';
    return (
      <div className={`ay-shopgroups ${className}`.trim()}>
        <ChipRow label={label} className="ay-shopgroups__row">
          <Chip selected={on === 'all'} onClick={() => onPick?.('all')}>All</Chip>
          {areas.map((m) => <Chip key={m.id} selected={on === m.id} onClick={() => onPick?.(on === m.id ? 'all' : m.id)}>{sentenceCase(m.label.replace(/ \+ /g, ' and '))}</Chip>)}
        </ChipRow>
      </div>
    );
  }
  const group = shopGroupFor(active);
  const g = SHOP_GROUPS.find((x) => x.id === group);
  const subs = g ? g.covers.filter((id) => !available || available.includes(id)).map((id) => MACRO_GROUPS.find((m) => m.id === id)).filter(Boolean) : [];
  return (
    <div className={`ay-shopgroups ${className}`.trim()}>
      <ChipRow label={label} className="ay-shopgroups__row">
        <Chip selected={!group} onClick={() => onPick?.('all')}>All</Chip>
        {SHOP_GROUPS.map((x) => <Chip key={x.id} selected={group === x.id} onClick={() => onPick?.(group === x.id && active === x.id ? 'all' : x.id)}>{x.label}</Chip>)}
      </ChipRow>
      {showSubs && g && subs.length > 1 && (
        <ChipRow label={`${g.label}: areas`} className="ay-shopgroups__subs">
          <Chip selected={active === g.id} onClick={() => onPick?.(g.id)}>All {g.label.toLowerCase()}</Chip>
          {subs.map((m) => <Chip key={m.id} selected={active === m.id} onClick={() => onPick?.(active === m.id ? g.id : m.id)}>{sentenceCase(m.label)}</Chip>)}
        </ChipRow>
      )}
    </div>
  );
}
