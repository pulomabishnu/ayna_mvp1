import { describe, it, expect } from 'vitest';
import { cleanAttachments, listAnnouncements, listTeamBadges, isMissingSchema } from './announcementsStore.js';
import { teamMemberForEmail, canPostAnnouncements, isVerifiedTeamMember, isAynaAdmin } from '../aynaTeam.js';

const missing = { code: 'PGRST205', message: "Could not find the table 'public.community_announcements' in the schema cache" };
const chain = (result) => { const q = { select: () => q, order: () => q, limit: () => Promise.resolve(result) }; return { from: () => q, rpc: () => Promise.resolve(result) }; };

describe('announcementsStore', () => {
  it('falls back to an empty list when the migration has not run', async () => {
    expect(isMissingSchema(missing)).toBe(true);
    expect(await listAnnouncements(chain({ data: null, error: missing }))).toEqual({ rows: [], available: false });
    expect((await listTeamBadges(chain({ data: null, error: missing }))).size).toBe(0);
  });
  it('keeps only safe, typed attachments', () => {
    const out = cleanAttachments([
      { type: 'link', url: 'javascript:alert(1)', title: 'x' },
      { type: 'link', url: 'https://example.com/e', title: '', date: '2026-10-22' },
      { type: 'product', id: 'p-1', title: 'Pad' },
      { type: 'nope', id: '1' },
      { type: 'read' },
    ]);
    expect(out).toEqual([{ type: 'link', url: 'https://example.com/e', title: 'example.com', date: '2026-10-22' }, { type: 'product', id: 'p-1', title: 'Pad' }]);
  });
});

describe('aynaTeam', () => {
  it('matches team emails case-insensitively and nobody else', () => {
    expect(teamMemberForEmail('Puloma@AynaHealth.co')?.title).toBe('CEO, ayna');
    expect(canPostAnnouncements({ email: 'someone@gmail.com' })).toBe(false);
    expect(canPostAnnouncements(null)).toBe(false);
  });
  it('splits verified team identity from announcement-writing admins', () => {
    // Current final rule: only Puloma and Eliz write announcements.
    expect(canPostAnnouncements({ email: 'puloma@aynahealth.co' })).toBe(true);
    expect(canPostAnnouncements({ email: 'eliz@aynahealth.co' })).toBe(true);
    expect(canPostAnnouncements({ email: 'ameera@aynahealth.co' })).toBe(false);
    // Ameera stays a verified team account with the CMO badge.
    expect(isVerifiedTeamMember({ email: 'ameera@aynahealth.co' })).toBe(true);
    expect(teamMemberForEmail('ameera@aynahealth.co')?.title).toBe('CMO, ayna');
    expect(isAynaAdmin({ email: 'ameera@aynahealth.co' })).toBe(false);
    expect(isAynaAdmin({ email: 'nobody@aynahealth.co' })).toBe(false);
  });
});
