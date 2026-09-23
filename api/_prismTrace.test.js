/* global process */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { callAnthropic } from './_llm.js';
import { hashedSessionId, traceSessionId, traceMessages } from './_prismTrace.js';

const realFetch = globalThis.fetch;
const ENV_KEYS = ['ANTHROPIC_API_KEY', 'PRISMTRACE_API_KEY', 'PRISMTRACE_PROJECT_ID', 'PRISMTRACE_HOST'];
let savedEnv;

function anthropicOk(text) {
  return { ok: true, status: 200, headers: new Headers(), json: async () => ({ content: [{ text }], stop_reason: 'end_turn' }) };
}
function anthropicFail(status) {
  return { ok: false, status, headers: new Headers(), text: async () => 'bad key' };
}
const ingestOk = { ok: true, status: 200, text: async () => '' };

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.ANTHROPIC_API_KEY = 'test-anthropic';
  delete process.env.PRISMTRACE_API_KEY;
  delete process.env.PRISMTRACE_PROJECT_ID;
  delete process.env.PRISMTRACE_HOST;
});
afterEach(() => {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  globalThis.fetch = realFetch;
});

describe('PRISM tracing in api/_llm.js', () => {
  it('makes no extra request when PRISMTRACE_API_KEY is unset', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(anthropicOk('hi'));
    globalThis.fetch = fetchMock;
    await callAnthropic({ prompt: 'hello', trace: { name: 'ask-ayna' } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).trace).toBeUndefined();
  });

  it('posts one trace per call with the key header, route name and session id', async () => {
    process.env.PRISMTRACE_API_KEY = 'pt-sk-test';
    process.env.PRISMTRACE_PROJECT_ID = 'proj-1';
    process.env.PRISMTRACE_HOST = 'https://prism.example';
    const fetchMock = vi.fn().mockResolvedValueOnce(anthropicOk('hi there')).mockResolvedValueOnce(ingestOk);
    globalThis.fetch = fetchMock;

    const out = await callAnthropic({ system: 'sys', prompt: 'hello', trace: { name: 'ask-ayna', sessionId: 's-1' } });
    expect(out.text).toBe('hi there');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).trace).toBeUndefined();

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://prism.example/api/traces');
    expect(init.headers['X-PRISMtrace-Key']).toBe('pt-sk-test');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      project_id: 'proj-1',
      output_message: 'hi there',
      session_id: 's-1',
      input_messages: [{ role: 'system', content: 'sys' }, { role: 'user', content: 'hello' }],
      metadata: { name: 'ask-ayna', provider: 'anthropic' },
    });
  });

  it('traces provider errors and still throws them; an ingest failure never breaks the call', async () => {
    process.env.PRISMTRACE_API_KEY = 'pt-sk-test';
    process.env.PRISMTRACE_PROJECT_ID = 'proj-1';
    const fetchMock = vi.fn().mockResolvedValueOnce(anthropicFail(401)).mockRejectedValueOnce(new Error('ingest down'));
    globalThis.fetch = fetchMock;
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(callAnthropic({ prompt: 'hello' })).rejects.toMatchObject({ status: 401 });
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.metadata.error_status).toBe(401);
  });

  it('hashes session ids so raw user ids are not sent', () => {
    const id = hashedSessionId('sms', 'user-123');
    expect(id).toMatch(/^sms:[0-9a-f]{16}$/);
    expect(id).not.toContain('user-123');
    expect(hashedSessionId('sms', 'user-123')).toBe(id);
    expect(hashedSessionId('sms', undefined)).toBeUndefined();
  });

  it('groups a chat by conversation id, else by hashed user + day, else nothing', () => {
    expect(traceSessionId('ask-ayna', { conversationId: 'abc12345-conv', userId: 'u1' })).toBe('ask-ayna:abc12345-conv');
    const byUser = traceSessionId('ask-ayna', { conversationId: 'bad id!', userId: 'u1' });
    expect(byUser).toMatch(/^ask-ayna:[0-9a-f]{16}$/);
    expect(byUser).toBe(traceSessionId('ask-ayna', { userId: 'u1' }));
    expect(traceSessionId('ask-ayna', {})).toBeUndefined();
  });

  it('builds the conversation turns from the UI history, dropping system rows', () => {
    const turns = traceMessages(
      [{ role: 'assistant', text: 'Hi!' }, { role: 'system', text: 'Updated your profile' }, { role: 'user', text: 'cramps?' }, { role: 'assistant', text: 'Try heat.' }],
      '  what else?  '
    );
    expect(turns).toEqual([
      { role: 'assistant', content: 'Hi!' },
      { role: 'user', content: 'cramps?' },
      { role: 'assistant', content: 'Try heat.' },
      { role: 'user', content: 'what else?' },
    ]);
    expect(traceMessages(undefined, 'hello')).toEqual([{ role: 'user', content: 'hello' }]);
  });

  it('sends the conversation turns as input_messages and keeps the rendered prompt in metadata', async () => {
    process.env.PRISMTRACE_API_KEY = 'pt-sk-test';
    process.env.PRISMTRACE_PROJECT_ID = 'proj-1';
    const fetchMock = vi.fn().mockResolvedValueOnce(anthropicOk('answer')).mockResolvedValueOnce(ingestOk);
    globalThis.fetch = fetchMock;
    const messages = [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }, { role: 'user', content: 'c' }];
    await callAnthropic({ system: 'sys', prompt: 'FULL PROMPT', trace: { name: 'ask-ayna', sessionId: 'ask-ayna:conv-1234', messages } });
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.input_messages).toEqual([{ role: 'system', content: 'sys' }, ...messages]);
    expect(body.session_id).toBe('ask-ayna:conv-1234');
    expect(body.metadata.prompt).toBe('FULL PROMPT');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).messages).toEqual([{ role: 'user', content: 'FULL PROMPT' }]);
  });
});
