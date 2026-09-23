/* global Buffer, setImmediate */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { providerToken, sendPush, pushToUser, apnsConfigured, _resetApnsForTests } from './_apns.js';

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const P8 = privateKey.export({ type: 'pkcs8', format: 'pem' });

function fakeConnect(responder) {
  const calls = [];
  const connect = (host) => {
    const client = new EventEmitter();
    client.host = host;
    client.close = () => {};
    client.request = (headers) => {
      const req = new EventEmitter();
      req.setEncoding = () => {};
      req.close = () => {};
      req.end = (payload) => {
        calls.push({ host, headers, payload: JSON.parse(payload) });
        const { status, body } = responder(headers[':path'].split('/').pop());
        setImmediate(() => { req.emit('response', { ':status': status }); if (body) req.emit('data', JSON.stringify(body)); req.emit('end'); });
      };
      return req;
    };
    return client;
  };
  return { connect, calls };
}

beforeEach(() => {
  _resetApnsForTests();
  vi.stubEnv('APNS_KEY_P8', P8.replace(/\n/g, '\\n'));
  vi.stubEnv('APNS_KEY_ID', 'ABC123DEFG');
  vi.stubEnv('APNS_TEAM_ID', 'KCVVLA6MCA');
  vi.stubEnv('APNS_ENV', '');
});
afterEach(() => vi.unstubAllEnvs());

describe('APNs provider token', () => {
  it('is a valid ES256 JWT with the key id and team id', () => {
    const [h, c, sig] = providerToken().split('.');
    expect(JSON.parse(Buffer.from(h, 'base64url'))).toEqual({ alg: 'ES256', kid: 'ABC123DEFG' });
    expect(JSON.parse(Buffer.from(c, 'base64url')).iss).toBe('KCVVLA6MCA');
    const ok = crypto.verify('sha256', Buffer.from(`${h}.${c}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig, 'base64url'));
    expect(ok).toBe(true);
  });
});

describe('sendPush', () => {
  it('posts an alert to the production host with the bundle topic', async () => {
    const { connect, calls } = fakeConnect(() => ({ status: 200 }));
    const res = await sendPush(['tok1'], { title: 'T', body: 'B', data: { type: 'test' } }, { connect });
    expect(res).toEqual([{ deviceToken: 'tok1', ok: true, status: 200, reason: '' }]);
    expect(calls[0].host).toBe('https://api.push.apple.com');
    expect(calls[0].headers['apns-topic']).toBe('co.aynahealth.app');
    expect(calls[0].headers['apns-push-type']).toBe('alert');
    expect(calls[0].payload).toEqual({ aps: { alert: { title: 'T', body: 'B' }, sound: 'default' }, type: 'test' });
  });

  it('reports per-token failures without throwing', async () => {
    const { connect } = fakeConnect((t) => (t === 'bad' ? { status: 400, body: { reason: 'BadDeviceToken' } } : { status: 200 }));
    const res = await sendPush(['good', 'bad'], { title: 'T', body: 'B' }, { connect });
    expect(res.find((r) => r.deviceToken === 'bad')).toMatchObject({ ok: false, status: 400, reason: 'BadDeviceToken' });
  });

  it('does nothing when APNs is not configured', async () => {
    vi.stubEnv('APNS_KEY_P8', '');
    expect(apnsConfigured()).toBe(false);
    const res = await sendPush(['t'], { title: 'T', body: 'B' });
    expect(res[0]).toMatchObject({ ok: false, reason: 'apns_not_configured' });
  });
});

describe('pushToUser', () => {
  it('returns zero devices when the user has no registered phone', async () => {
    const admin = { from: () => ({ select: () => ({ eq: () => ({ eq: async () => ({ data: [], error: null }) }) }) }) };
    expect(await pushToUser(admin, 'u1', { title: 'T', body: 'B' })).toEqual({ sent: 0, failed: 0, devices: 0 });
  });
});
