// Remember me: the session-persistence storage adapter (see the note in
// supabaseClient.js). Vitest runs in a node environment here, so window and
// both Web Storage objects are stubbed with the same Map-backed shape the
// repo's test-setup-localstorage.js uses.
import { beforeEach, describe, expect, it } from 'vitest';

function makeStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  };
}

const localStorageMock = makeStorage();
const sessionStorageMock = makeStorage();
globalThis.window = globalThis.window || {};
globalThis.window.localStorage = localStorageMock;
globalThis.window.sessionStorage = sessionStorageMock;

const { getRememberMe, setRememberMe, rememberAwareAuthStorage } = await import('./supabaseClient.js');

const TOKEN_KEY = 'sb-abcdefgh-auth-token';

beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
});

describe('getRememberMe / setRememberMe', () => {
  it('defaults to on (persist across restarts) when nothing was chosen', () => {
    expect(getRememberMe()).toBe(true);
  });

  it('stores only a 1/0 flag, never a credential', () => {
    setRememberMe(false);
    expect(localStorageMock.getItem('ayna_remember_me_v1')).toBe('0');
    setRememberMe(true);
    expect(localStorageMock.getItem('ayna_remember_me_v1')).toBe('1');
  });

  it('moves an existing auth token into the matching store when the choice flips', () => {
    localStorageMock.setItem(TOKEN_KEY, '{"access_token":"a"}');
    setRememberMe(false);
    expect(localStorageMock.getItem(TOKEN_KEY)).toBe(null);
    expect(sessionStorageMock.getItem(TOKEN_KEY)).toBe('{"access_token":"a"}');

    setRememberMe(true);
    expect(sessionStorageMock.getItem(TOKEN_KEY)).toBe(null);
    expect(localStorageMock.getItem(TOKEN_KEY)).toBe('{"access_token":"a"}');
  });

  it('never touches non-auth keys (user data stays put)', () => {
    localStorageMock.setItem('ayna_saved_for_later_v1', '{"p1":{}}');
    localStorageMock.setItem('ayna-community-guest', '{"guest":true}');
    setRememberMe(false);
    expect(localStorageMock.getItem('ayna_saved_for_later_v1')).toBe('{"p1":{}}');
    expect(localStorageMock.getItem('ayna-community-guest')).toBe('{"guest":true}');
  });
});

describe('rememberAwareAuthStorage', () => {
  it('writes to localStorage when remember me is on (the default)', () => {
    setRememberMe(true);
    rememberAwareAuthStorage.setItem(TOKEN_KEY, 'tok');
    expect(localStorageMock.getItem(TOKEN_KEY)).toBe('tok');
    expect(sessionStorageMock.getItem(TOKEN_KEY)).toBe(null);
    expect(rememberAwareAuthStorage.getItem(TOKEN_KEY)).toBe('tok');
  });

  it('writes to sessionStorage when remember me is off', () => {
    setRememberMe(false);
    rememberAwareAuthStorage.setItem(TOKEN_KEY, 'tok2');
    expect(sessionStorageMock.getItem(TOKEN_KEY)).toBe('tok2');
    expect(localStorageMock.getItem(TOKEN_KEY)).toBe(null);
    expect(rememberAwareAuthStorage.getItem(TOKEN_KEY)).toBe('tok2');
  });

  it('a token refresh re-homes a stale copy so the two stores never fight', () => {
    // A persisted session exists; she signs in with remember me OFF.
    localStorageMock.setItem(TOKEN_KEY, 'old');
    setRememberMe(false);
    rememberAwareAuthStorage.setItem(TOKEN_KEY, 'new');
    expect(localStorageMock.getItem(TOKEN_KEY)).toBe(null);
    expect(rememberAwareAuthStorage.getItem(TOKEN_KEY)).toBe('new');
  });

  it('reads an existing persisted session regardless of the flag', () => {
    localStorageMock.setItem(TOKEN_KEY, 'persisted');
    setRememberMe(true); // flag flip alone must not hide an existing session
    expect(rememberAwareAuthStorage.getItem(TOKEN_KEY)).toBe('persisted');
  });

  it('removeItem (sign-out) clears both stores', () => {
    localStorageMock.setItem(TOKEN_KEY, 'a');
    sessionStorageMock.setItem(TOKEN_KEY, 'b');
    rememberAwareAuthStorage.removeItem(TOKEN_KEY);
    expect(localStorageMock.getItem(TOKEN_KEY)).toBe(null);
    expect(sessionStorageMock.getItem(TOKEN_KEY)).toBe(null);
  });
});
