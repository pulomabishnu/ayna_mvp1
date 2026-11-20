import { describe, it, expect, afterEach } from 'vitest';
import { trackAsk, askEventProps, askFailReason, setAskAnalyticsClient } from './askAnalytics.js';

describe('Ask ayna analytics (Nov 19)', () => {
  afterEach(() => setAskAnalyticsClient(null));
  it('keeps only safe props, never text', () => {
    expect(askEventProps({ surface: 'app', message: 'I have cramps', duration_ms: 1234.6, followups_count: 3, kind: 'monthly', reason: 'nope' }))
      .toEqual({ surface: 'app', duration_ms: 1235, followups_count: 3, kind: 'monthly' });
  });
  it('buckets failures', () => {
    expect(askFailReason({ name: 'AbortError' })).toBe('timeout');
    expect(askFailReason(new Error('Failed to fetch'))).toBe('network');
    expect(askFailReason(new Error('Could not get an answer right now.'))).toBe('server');
  });
  it('sends only known events', () => {
    const sent = [];
    setAskAnalyticsClient({ capture: (e, p) => sent.push([e, p]) });
    trackAsk('ask_message_sent', { surface: 'web', is_retry: false, history_len: 2 });
    trackAsk('ask_secret', { surface: 'web' });
    expect(sent).toEqual([['ask_message_sent', { surface: 'web', is_retry: false, history_len: 2 }]]);
  });
});
