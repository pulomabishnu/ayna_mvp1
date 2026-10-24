import { describe, expect, it, vi, afterEach } from 'vitest';

describe('trace.redact keeps health content out of tracing', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  it('sends no prompt content or raw output to PRISM when redact is set', async () => {
    vi.stubEnv('PRISMTRACE_API_KEY', 'k');
    vi.stubEnv('PRISMTRACE_PROJECT_ID', 'p');
    vi.stubEnv('PRISMTRACE_HOST', 'https://prism.example');
    vi.stubEnv('ANTHROPIC_API_KEY', 'a');
    const posted = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      if (String(url).includes('anthropic')) return { ok: true, status: 200, json: async () => ({ content: [{ text: '{"values":[{"value":412}]}' }], stop_reason: 'end_turn' }) };
      posted.push(String(init?.body || ''));
      return { ok: true, status: 200, json: async () => ({}) };
    }));
    const { callAnthropic } = await import('./_llm.js');
    await callAnthropic({
      prompt: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'SECRETIMAGEDATA' } }],
      trace: { name: 't', redact: true, formatOutput: () => '1 values found' },
    });
    expect(posted.length).toBeGreaterThan(0);
    const messages = posted.map((body) => {
      const payload = JSON.parse(body);
      return JSON.stringify({ input_messages: payload.input_messages, output_message: payload.output_message });
    }).join(' ');
    expect(messages).not.toMatch(/SECRETIMAGEDATA/);
    expect(messages).not.toMatch(/412/);
  });
});
