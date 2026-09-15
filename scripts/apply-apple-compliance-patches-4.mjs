import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, text) { fs.writeFileSync(path, text); }
function mustReplace(path, before, after) {
  let text = read(path);
  if (text.includes(after)) return;
  if (!text.includes(before)) throw new Error(`Missing patch anchor in ${path}: ${before.slice(0, 120)}`);
  text = text.replace(before, after);
  write(path, text);
}

// Make the shared Supabase test client model a real, currently-consented user
// even when an individual test overrides app_metadata/user_metadata to exercise
// premium-role behavior. Tests can pass withAiConsent:false for the denial path.
{
  const path = 'api/_test-helpers.js';
  let text = read(path);
  text = text.replace(
    "export function mockSupabase({\n  user = { id: 'user-1', email: 'u@x.com', app_metadata: {}, user_metadata: { consent_version: 'v2-18plus', consent_given_at: '2026-09-13T00:00:00.000Z', age_18_confirmed: true } },\n  authError = null,\n  rpcResults = {},\n  tableResults = {},\n} = {}) {\n  const rpcCalls = [];",
    "export function mockSupabase({\n  user = { id: 'user-1', email: 'u@x.com', app_metadata: {}, user_metadata: {} },\n  authError = null,\n  rpcResults = {},\n  tableResults = {},\n  withAiConsent = true,\n} = {}) {\n  const consentMetadata = withAiConsent ? {\n    consent_version: 'v2-18plus',\n    consent_given_at: '2026-09-13T00:00:00.000Z',\n    age_18_confirmed: true,\n  } : {};\n  const resolvedUser = user == null ? null : {\n    ...user,\n    user_metadata: { ...consentMetadata, ...(user.user_metadata || {}) },\n  };\n  const rpcCalls = [];"
  );
  text = text.replace(
    "getUser: vi.fn(async () => (authError ? { data: null, error: authError } : { data: { user }, error: null })),\n      admin: {\n        updateUserById: vi.fn(async () => ({ data: {}, error: null })),\n      },",
    "getUser: vi.fn(async () => (authError ? { data: null, error: authError } : { data: { user: resolvedUser }, error: null })),\n      admin: {\n        updateUserById: vi.fn(async () => ({ data: {}, error: null })),\n        getUserById: vi.fn(async (id) => ({\n          data: { user: resolvedUser ? { ...resolvedUser, id } : null },\n          error: resolvedUser ? null : { message: 'user not found' },\n        })),\n      },"
  );
  write(path, text);
}

// The privacy pass deliberately keeps FSA/HSA status out of third-party AI
// prompts. The local ranking layer can use it without transmitting it.
{
  const path = 'api/llm-recommendations.integration.test.js';
  let text = read(path);
  text = text.replace(
    "it('instructs the model to prioritize FSA/HSA-eligible products when the user has one', async () => {",
    "it('does not send FSA/HSA status to the external model', async () => {"
  );
  text = text.replace(
    "    expect(prompt).toContain('FSA/HSA: hsa');\n    expect(prompt).toMatch(/prioritize FSA\\/HSA-eligible products/i);",
    "    expect(prompt).toContain('FSA/HSA: not provided');\n    expect(prompt).not.toContain('FSA/HSA: hsa');"
  );
  write(path, text);
}

// Search beyond the curated catalog is no longer anonymously callable. Update
// the old kill-switch tests into permanent auth + consent regression tests.
{
  const path = 'api/search-suggestions.integration.test.js';
  let text = read(path);
  const oldBlock = `describe('POST /api/search-suggestions — REQUIRE_AUTH_FOR_SEARCH_SUGGESTIONS kill switch', () => {
  it('an anonymous request goes through when the flag is unset', async () => {
    globalThis.fetch = vi.fn(async () => claudeOk());
    const handler = await loadHandler();
    const res = mockRes();

    await handler(searchReq({ query: 'cramp relief' }, {}), res);

    expect(res.statusCode).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('an anonymous request is rejected with 401 when the flag is "1", before spending a Claude call', async () => {
    restoreEnv();
    restoreEnv = withEnv({
      ANTHROPIC_API_KEY: 'test-key',
      REQUIRE_AUTH_FOR_SEARCH_SUGGESTIONS: '1',
      SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    });
    globalThis.__mockSupabase = mockSupabase({ authError: { message: 'no token' } });
    globalThis.fetch = vi.fn();
    const handler = await loadHandler();
    const res = mockRes();

    // No Authorization header at all.
    await handler(searchReq({ query: 'cramp relief' }, {}), res);

    expect(res.statusCode).toBe(401);
    expect(res.body.suggestions).toEqual([]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('an authenticated request goes through when the flag is "true"', async () => {
    restoreEnv();
    restoreEnv = withEnv({
      ANTHROPIC_API_KEY: 'test-key',
      REQUIRE_AUTH_FOR_SEARCH_SUGGESTIONS: 'true',
      SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    });
    globalThis.__mockSupabase = mockSupabase();
    globalThis.fetch = vi.fn(async () => claudeOk());
    const handler = await loadHandler();
    const res = mockRes();

    await handler(searchReq({ query: 'cramp relief' }, { authorization: 'Bearer real-token' }), res);

    expect(res.statusCode).toBe(200);
  });
});`;
  const newBlock = `describe('POST /api/search-suggestions — mandatory auth and AI consent', () => {
  it('rejects an anonymous request with 401 before sending the query anywhere', async () => {
    globalThis.__mockSupabase = mockSupabase({ authError: { message: 'no token' } });
    globalThis.fetch = vi.fn();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(searchReq({ query: 'cramp relief' }, { authorization: undefined }), res);

    expect(res.statusCode).toBe(401);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('rejects a signed-in user without current AI consent with 403 before sending the query anywhere', async () => {
    globalThis.__mockSupabase = mockSupabase({ withAiConsent: false });
    globalThis.fetch = vi.fn();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(searchReq({ query: 'cramp relief' }, { authorization: 'Bearer real-token' }), res);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('ai_consent_required');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('allows a signed-in user with current consent', async () => {
    globalThis.__mockSupabase = mockSupabase();
    globalThis.fetch = vi.fn(async () => claudeOk());
    const handler = await loadHandler();
    const res = mockRes();

    await handler(searchReq({ query: 'cramp relief' }, { authorization: 'Bearer real-token' }), res);

    expect(res.statusCode).toBe(200);
  });
});`;
  if (text.includes(oldBlock)) text = text.replace(oldBlock, newBlock);
  else if (!text.includes("mandatory auth and AI consent")) throw new Error('Missing search auth test block');

  text = text.replace(
    "restoreEnv = withEnv({ ANTHROPIC_API_KEY: undefined });",
    "restoreEnv = withEnv({\n      ANTHROPIC_API_KEY: undefined,\n      SUPABASE_URL: 'https://x.supabase.co',\n      SUPABASE_SERVICE_ROLE_KEY: 'service-key',\n    });"
  );
  write(path, text);
}

// Script 3 originally replaced one social-provider guard. Cover both Google
// and Apple id-token flows so neither can auto-provision an unseen account
// before the visible confirmations are checked.
{
  const path = 'src/mobile/screens/SigninScreen.jsx';
  let text = read(path);
  text = text.replaceAll("    if (mode === 'signup' && !allConsented) {", "    if (!allConsented) {");
  write(path, text);
}

console.log('Compliance regression fixtures aligned.');
