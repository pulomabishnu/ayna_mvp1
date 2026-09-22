import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const path = 'api/search-suggestions.integration.test.js';
const baselineCommit = '11826cc3fa3e315fbd73f096ab7ea45040245c46';
const original = execFileSync('git', ['show', `${baselineCommit}:${path}`], { encoding: 'utf8' });
const bad = 'const payload = await claudeOk().text();';
const fixed = "const payload = (await claudeOk().json()).content[0].text;";

if (!original.includes(bad)) {
  throw new Error('Expected OpenAI fallback fixture anchor is missing from preserved search test baseline.');
}

const restored = original.replace(bad, fixed);
const testCount = (restored.match(/\bit\('/g) || []).length;
if (testCount !== 28) {
  throw new Error(`Expected 28 preserved search-suggestion tests, found ${testCount}.`);
}

fs.writeFileSync(path, restored);
console.log('Restored all 28 search-suggestion regression tests with only the deterministic OpenAI payload fix.');
