import { READ_SECTIONS } from '../data/readSections.js';

// Free accounts may choose one premium Read each UTC Monday-Sunday week and
// reopen that same Read during the week. Pro can open the full Library. Keep
// the IDs sourced from the Library's own section map so web and native cannot
// drift when a Read is added or moved.
export const PREMIUM_READ_IDS = READ_SECTIONS.flatMap((section) => section.articleIds);
