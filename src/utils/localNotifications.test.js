import { describe, it, expect, vi } from 'vitest';

const schedule = vi.fn(async () => ({}));
const cancel = vi.fn(async () => ({}));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: { schedule, cancel } }));
const { LocalNotifications, withSound } = await import('./localNotifications.js');

describe('reminders make a sound', () => {
  it('adds the default sound to every reminder', async () => {
    await LocalNotifications.schedule({ notifications: [{ id: 1, title: 'a' }, { id: 2, title: 'b' }] });
    expect(schedule).toHaveBeenCalledWith({ notifications: [{ id: 1, title: 'a', sound: 'default', threadIdentifier: 'ayna' }, { id: 2, title: 'b', sound: 'default', threadIdentifier: 'ayna' }] });
  });
  it('keeps a sound that was chosen on purpose', () => {
    expect(withSound({ notifications: [{ id: 1, sound: 'chime.wav' }] }).notifications[0].sound).toBe('chime.wav');
  });
  it('her own reminders are Time Sensitive and grouped; nudges are not', () => {
    const [mine, nudge, rundown] = withSound({ notifications: [{ id: 1, extra: { route: 'routine' } }, { id: 2, extra: { route: 'today' } }, { id: 3, extra: { route: 'today', rundown: true } }] }).notifications;
    expect(mine).toMatchObject({ interruptionLevel: 'timeSensitive', threadIdentifier: 'ayna-reminders' });
    expect(nudge.interruptionLevel).toBeUndefined();
    expect(nudge.threadIdentifier).toBe('ayna-updates');
    expect(rundown.threadIdentifier).toBe('ayna-rundown');
  });
  it('passes every other call straight through', async () => {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    expect(cancel).toHaveBeenCalledWith({ notifications: [{ id: 1 }] });
  });
});
