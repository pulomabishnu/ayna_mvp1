import { describe, it, expect, vi } from 'vitest';

const schedule = vi.fn(async () => ({}));
const cancel = vi.fn(async () => ({}));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: { schedule, cancel } }));
const { LocalNotifications, withSound } = await import('./localNotifications.js');

describe('reminders make a sound', () => {
  it('adds the default sound to every reminder', async () => {
    await LocalNotifications.schedule({ notifications: [{ id: 1, title: 'a' }, { id: 2, title: 'b' }] });
    expect(schedule).toHaveBeenCalledWith({ notifications: [{ id: 1, title: 'a', sound: 'default' }, { id: 2, title: 'b', sound: 'default' }] });
  });
  it('keeps a sound that was chosen on purpose', () => {
    expect(withSound({ notifications: [{ id: 1, sound: 'chime.wav' }] }).notifications[0].sound).toBe('chime.wav');
  });
  it('passes every other call straight through', async () => {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    expect(cancel).toHaveBeenCalledWith({ notifications: [{ id: 1 }] });
  });
});
