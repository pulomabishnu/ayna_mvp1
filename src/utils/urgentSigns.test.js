
import { urgentSignsFor as _u } from './urgentSigns.js';
import { it as _it, expect as _ex } from 'vitest';
_it('a pad from a brand called Tampon Tribe gets no toxic shock warning (Nov 2 audit)', () => {
  _ex(_u({ id: 'x', name: 'Tampon Tribe Organic Pads', brand: 'Tampon Tribe', category: 'pad' }).length).toBe(0);
  _ex(_u({ id: 'y', name: 'Tampon Tribe Organic Tampons', brand: 'Tampon Tribe', category: 'tampon' }).length).toBeGreaterThan(0);
});
