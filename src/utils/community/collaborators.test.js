import { describe, it, expect } from 'vitest';
import {
  isMissingSchemaError, listPlaylistCollaborators, listPlaylistItems, listPlaylists, getPlaylistInviteCode,
  joinPlaylistByCode, parsePlaylistInviteCode, playlistInviteLink, canEditPlaylist, normalizeHandle,
} from './communityStore.js';

// A tiny stand-in for the Supabase client: every query records its calls and
// resolves with whatever `respond(table, calls)` returns.
function fakeClient({ respond = () => ({ data: [], error: null }), rpc = () => ({ data: null, error: null }) } = {}) {
  const log = [];
  const from = (table) => {
    const calls = [];
    const builder = new Proxy({}, {
      get(_, prop) {
        if (prop === 'then') {
          const result = respond(table, calls);
          log.push({ table, calls });
          return (resolve, reject) => Promise.resolve(result).then(resolve, reject);
        }
        return (...args) => { calls.push([prop, ...args]); return builder; };
      },
    });
    return builder;
  };
  return { from, rpc: async (name, args) => { log.push({ rpc: name, args }); return rpc(name, args); }, log };
}

const MISSING_TABLE = { code: 'PGRST205', message: "Could not find the table 'public.community_playlist_collaborators' in the schema cache" };
const MISSING_COLUMN = { code: '42703', message: 'column community_playlist_items.added_by does not exist' };
const MISSING_FN = { code: 'PGRST202', message: 'Could not find the function public.join_playlist_by_code(code) in the schema cache' };
const CODE = '0123456789abcdef0123456789abcdef';

describe('isMissingSchemaError', () => {
  it('recognises missing tables, columns and functions only', () => {
    expect(isMissingSchemaError(MISSING_TABLE)).toBe(true);
    expect(isMissingSchemaError(MISSING_COLUMN)).toBe(true);
    expect(isMissingSchemaError(MISSING_FN)).toBe(true);
    expect(isMissingSchemaError({ code: '42501', message: 'permission denied for table x' })).toBe(false);
    expect(isMissingSchemaError(null)).toBe(false);
  });
});

describe('before the collaborators migration runs', () => {
  it('reports collaborators as unavailable instead of throwing', async () => {
    const supabase = fakeClient({ respond: () => ({ data: null, error: MISSING_TABLE }) });
    await expect(listPlaylistCollaborators(supabase, 'pl1')).resolves.toEqual({ available: false, rows: [] });
  });
  it('still lists playlist items without added_by', async () => {
    const supabase = fakeClient({
      respond: (table, calls) => (calls.some(([m, cols]) => m === 'select' && String(cols).includes('added_by'))
        ? { data: null, error: MISSING_COLUMN }
        : { data: [{ product_id: 'p1' }], error: null }),
    });
    await expect(listPlaylistItems(supabase, 'pl1')).resolves.toEqual([{ product_id: 'p1' }]);
  });
  it('My playlists falls back to owned playlists', async () => {
    const supabase = fakeClient({
      respond: (table, calls) => (calls.some(([m]) => m === 'or')
        ? { data: null, error: { code: '42703', message: 'column community_feed_playlists.is_collaborator does not exist' } }
        : { data: [{ id: 'mine' }], error: null }),
    });
    await expect(listPlaylists(supabase, { section: 'mine' })).resolves.toEqual([{ id: 'mine' }]);
  });
  it('has no invite code and a join explains the feature is off', async () => {
    const supabase = fakeClient({ rpc: () => ({ data: null, error: MISSING_FN }) });
    await expect(getPlaylistInviteCode(supabase, 'pl1')).resolves.toBe(null);
    await expect(joinPlaylistByCode(supabase, CODE)).resolves.toMatchObject({ ok: false, reason: 'unavailable' });
  });
  it('does not hide real errors', async () => {
    const supabase = fakeClient({ respond: () => ({ data: null, error: { code: '42501', message: 'permission denied' } }) });
    await expect(listPlaylistCollaborators(supabase, 'pl1')).rejects.toMatchObject({ code: '42501' });
  });
});

describe('invite link join flow', () => {
  it('builds a link and reads the code back from it', () => {
    const link = playlistInviteLink(CODE, 'https://www.aynahealth.co/');
    expect(link).toBe(`https://www.aynahealth.co/mobile-preview?join-playlist=${CODE}`);
    expect(parsePlaylistInviteCode(link)).toBe(CODE);
    expect(parsePlaylistInviteCode(CODE.toUpperCase())).toBe(CODE);
    expect(parsePlaylistInviteCode('https://x.co/?join-playlist=../../etc')).toBe(null);
    expect(parsePlaylistInviteCode('')).toBe(null);
    expect(playlistInviteLink('bad code')).toBe(null);
  });
  it('joins with the code and returns the playlist id', async () => {
    const supabase = fakeClient({ rpc: (name, args) => (name === 'join_playlist_by_code' && args.code === CODE ? { data: 'pl1', error: null } : { data: null, error: { message: 'unexpected' } }) });
    await expect(joinPlaylistByCode(supabase, `https://www.aynahealth.co/mobile-preview?join-playlist=${CODE}`)).resolves.toEqual({ ok: true, playlistId: 'pl1' });
    expect(supabase.log).toEqual([{ rpc: 'join_playlist_by_code', args: { code: CODE } }]);
  });
  it('turns a revoked code or a guest session into a readable answer', async () => {
    const revoked = fakeClient({ rpc: () => ({ data: null, error: { code: 'P0001', message: 'community_invite_invalid' } }) });
    await expect(joinPlaylistByCode(revoked, CODE)).resolves.toMatchObject({ ok: false, reason: 'invalid' });
    const guest = fakeClient({ rpc: () => ({ data: null, error: { code: 'P0001', message: 'community_guest_unavailable' } }) });
    await expect(joinPlaylistByCode(guest, CODE)).resolves.toMatchObject({ ok: false, reason: 'signin' });
  });
  it('never calls the server for a malformed code', async () => {
    const supabase = fakeClient();
    await expect(joinPlaylistByCode(supabase, 'nope')).resolves.toMatchObject({ ok: false, reason: 'invalid' });
    expect(supabase.log).toEqual([]);
  });
  it('asks the owner-only function for the code', async () => {
    const supabase = fakeClient({ rpc: () => ({ data: CODE, error: null }) });
    await expect(getPlaylistInviteCode(supabase, 'pl1', { rotate: true })).resolves.toBe(CODE);
    expect(supabase.log[0]).toEqual({ rpc: 'community_playlist_invite_code', args: { pid: 'pl1', rotate: true } });
  });
});

describe('who can edit a playlist', () => {
  it('is the owner or a collaborator', () => {
    const playlist = { id: 'pl1', owner_id: 'a' };
    expect(canEditPlaylist(playlist, 'a')).toBe(true);
    expect(canEditPlaylist(playlist, 'b')).toBe(false);
    expect(canEditPlaylist(playlist, 'b', [{ user_id: 'b' }])).toBe(true);
    expect(canEditPlaylist({ ...playlist, is_collaborator: true }, 'c')).toBe(true);
    expect(canEditPlaylist(playlist, null)).toBe(false);
  });
});

describe('normalizeHandle', () => {
  it('accepts @handles and rejects anything that cannot be a username', () => {
    expect(normalizeHandle(' @Maya.K ')).toBe('maya.k');
    expect(normalizeHandle('ab')).toBe('');
    expect(normalizeHandle('has space')).toBe('');
  });
});
