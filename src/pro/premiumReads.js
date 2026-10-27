import { ARTICLE_CATEGORIES } from '../mobile/data/articleRows.js';

// Free accounts may choose one Read each UTC Monday-Sunday week and reopen
// that same Read during the week. Pro can open the full Library. Derive the
// IDs from the shared Library catalogue so web and native stay in sync.
export const PREMIUM_READ_IDS = [...new Set(ARTICLE_CATEGORIES.flatMap((section) => section.articleIds))];
