/* global process */
import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createAppleClientSecret,
  decryptAppleRefreshToken,
  encryptAppleRefreshToken,
} from './_appleSignIn.js';

const ENV_KEYS = [
  'APPLE_CLIENT_ID',
  'APPLE_TEAM_ID',
  'APPLE_KEY_ID',
  'APPLE_PRIVATE_KEY',
  'APPLE_TOKEN_ENCRYPTION_KEY',
];
let saved;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  process.env.APPLE_CLIENT_ID = 'co.aynahealth.app';
  process.env.APPLE_TEAM_ID = 'TEAM123456';
  process.env.APPLE_KEY_ID = 'KEY1234567';
  process.env.APPLE_PRIVATE_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' });
  process.env.APPLE_TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('Sign in with Apple server privacy helpers', () => {
  it('encrypts stored refresh tokens and can decrypt only the encrypted record', () => {
    const secret = 'refresh-token-that-must-never-be-stored-in-plaintext';
    const encrypted = encryptAppleRefreshToken(secret);

    expect(encrypted.encrypted_refresh_token).not.toContain(secret);
    expect(encrypted.encryption_iv).toBeTruthy();
    expect(encrypted.encryption_tag).toBeTruthy();
    expect(decryptAppleRefreshToken(encrypted)).toBe(secret);
  });

  it('creates a short-lived three-part ES256 Apple client-secret JWT', () => {
    const now = 1_800_000_000;
    const jwt = createAppleClientSecret(now);
    const parts = jwt.split('.');
    expect(parts).toHaveLength(3);

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    expect(header).toMatchObject({ alg: 'ES256', kid: 'KEY1234567' });
    expect(payload).toMatchObject({
      iss: 'TEAM123456',
      sub: 'co.aynahealth.app',
      aud: 'https://appleid.apple.com',
      iat: now,
      exp: now + 300,
    });
  });
});
