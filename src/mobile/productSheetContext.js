import { createContext } from 'react';

/**
 * The app's quick product sheet (MobileApp): tapping a product in the Daily
 * Rundown or the ayna chat opens it OVER what she was looking at, so the
 * story stays on the same card (paused) and the chat keeps its scroll.
 *
 * Value (null on the website, where nothing changes):
 *   open(product)              open the sheet for a product
 *   isOpen                     true while the sheet (or its full page) is up
 *   isSaved(id), toggleSaved(product)
 *   inRoutine(id), addToRoutine(product)
 *   matchStateFor(product)     src/utils/matchState.js result for her
 */
export const ProductSheetContext = createContext(null);
