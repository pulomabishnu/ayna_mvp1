import { useCallback, useEffect, useState } from 'react';

const LAYOUT_KEY = 'ayna_mobile_card_layout_v2';

function loadLayout() {
  try {
    const stored = localStorage.getItem(LAYOUT_KEY);
    return stored === 'grid' ? 'grid' : 'list';
  } catch {
    return 'list';
  }
}

export function useCardLayout() {
  const [layout, setLayout] = useState(loadLayout);

  useEffect(() => {
    try { localStorage.setItem(LAYOUT_KEY, layout); } catch { /* private mode */ }
  }, [layout]);

  const toggleLayout = useCallback(() => {
    setLayout((l) => (l === 'grid' ? 'list' : 'grid'));
  }, []);

  return { layout, toggleLayout };
}
