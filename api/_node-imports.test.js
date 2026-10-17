/* global process */
// Vercel runs api/*.js as plain Node ES modules, which need file extensions on
// relative imports. Vite and Vitest resolve './products' without one, so a
// missing '.js' passes every other test while the endpoint crashes in
// production (the Oct 13 outage: src/data/careResources.js). This loads
// every endpoint with real Node, the way Vercel does.
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

describe('api endpoints load in plain Node', () => {
  it('imports every api/*.js without a module error', () => {
    const files = fs.readdirSync(path.resolve('api')).filter((f) => f.endsWith('.js') && !f.includes('.test.'));
    const script = `const fs=${JSON.stringify(files)};const bad=[];for(const f of fs){try{await import('./api/'+f)}catch(e){if(/^ERR_(MODULE|UNSUPPORTED|IMPORT)|SyntaxError/.test(String(e&&(e.code||e.name)))||/Cannot find module/.test(String(e&&e.message)))bad.push(f+': '+e.message.split('\\n')[0])}}console.log(JSON.stringify(bad))`;
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: path.resolve('.'), encoding: 'utf8', timeout: 240000, env: { ...process.env, NODE_ENV: 'test' } });
    const line = String(r.stdout || '').trim().split('\n').pop() || '[]';
    expect(JSON.parse(line)).toEqual([]);
  }, 250000);
});
