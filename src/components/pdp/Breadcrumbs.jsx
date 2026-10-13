import React from 'react';
import { breadcrumbs } from './commerce';
import './pdp.css';

/** Shop > Category > Product. Links open the Shop (filtered to the category when the page can). */
export default function Breadcrumbs({ product, onNavigate }) {
  const crumbs = breadcrumbs(product);
  if (!crumbs.length) return null;
  return (
    <nav className="ay-crumbs" aria-label="Breadcrumb">
      <ol>
        {crumbs.map((c) => (
          <li key={`${c.kind}-${c.label}`}>
            {c.kind === 'current'
              ? <span aria-current="page">{c.label}</span>
              : (
                <a
                  href={c.href}
                  onClick={(e) => {
                    if (!onNavigate || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
                    e.preventDefault();
                    onNavigate(c.kind === 'category' ? c.category : null);
                  }}
                >
                  {c.label}
                </a>
              )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
