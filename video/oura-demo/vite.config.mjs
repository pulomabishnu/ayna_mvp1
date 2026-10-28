// FILM-ONLY dev server. Serves the real ayna app from the repo root, unchanged,
// except that the dev-only demo module (src/health/devDemo.js, read only behind
// import.meta.env.DEV + ?healthdemo=1) is swapped for the fictional Oura fixture.
// Never used for production builds.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
export default defineConfig({
  root: repo, configFile: false, plugins: [react()],
  resolve: { alias: [{ find: /^(\.\.\/)+health\/devDemo\.js$/, replacement: path.join(here, 'fixture/ouraDemoFixture.js') }] },
  server: { port: 5199, strictPort: true, fs: { allow: [repo] } },
});
