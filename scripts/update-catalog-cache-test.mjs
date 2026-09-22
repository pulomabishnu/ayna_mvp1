import fs from 'node:fs';

const path = 'api/products.test.js';
let text = fs.readFileSync(path, 'utf8');

text = text.replace(
  "it('sets a long-lived public cache header on a successful response', async () => {",
  "it('sets the five-minute shared-catalog cache header on a successful response', async () => {",
);
text = text.replace(
  "expect(res.headers['cache-control']).toMatch(/s-maxage=3600/);",
  "expect(res.headers['cache-control']).toMatch(/s-maxage=300/);",
);

if (!text.includes("five-minute shared-catalog cache header") || !text.includes("/s-maxage=300/")) {
  throw new Error('Could not align products cache test with the intended five-minute live catalog refresh policy.');
}

fs.writeFileSync(path, text);
console.log('Catalog cache regression test aligned to the five-minute shared backend refresh.');
