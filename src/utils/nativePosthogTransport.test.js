import { describe, expect, it } from 'vitest';
import { nativePosthogTransportConfig } from './nativePosthogTransport.js';

describe('PostHog transport in TestFlight', () => {
  it('uses plain immediate requests instead of compressed batches in native builds', () => {
    expect(nativePosthogTransportConfig(true)).toEqual({
      request_batching: false,
      disable_compression: true,
      api_transport: 'fetch',
    });
  });
  it('does not alter ordinary website analytics transport', () => {
    expect(nativePosthogTransportConfig(false)).toEqual({});
  });
});
