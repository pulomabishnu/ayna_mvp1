import { createContext } from 'react';

// Opens the Ask ayna drawer from any page header (next to Saved), so Ask isn't tied to one tab.
export const AskContext = createContext(null);

// The header's round profile button (You moved out of the tab bar, Oct 26) and
// the Ask ayna suggestions row under the header: { onOpenProfile, initial, suggest }.
export const AppHeaderContext = createContext(null);
