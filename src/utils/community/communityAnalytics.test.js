import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
import posthog from 'posthog-js';
import { trackCommunity, communityEventProps } from './communityAnalytics.js';

describe('community analytics', () => {
  beforeEach(() => posthog.capture.mockClear());

  it('never sends post text, ids or authors', () => {
    const props = communityEventProps({ kind: 'question', isAnonymous: true, body: 'private text', author_id: 'u1', postId: 'p1', topicCount: 2 });
    expect(props).toEqual({ kind: 'question', isAnonymous: true, topicCount: 2 });
  });

  it('only sends known community events', () => {
    trackCommunity('community_post_created', { kind: 'review' });
    trackCommunity('something_else', {});
    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith('community_post_created', { kind: 'review' });
  });
});
