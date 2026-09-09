/* global process, Buffer */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// `vite dev` only serves the SPA — it has no serverless runtime, so every
// /api/*.js route (Vercel functions) 404s under plain `npm run dev`. That
// silently breaks anything that depends on a real backend call while testing
// locally: the contact form's Resend send, and separately the mobile
// Preferences screen's GET/PATCH of notification-preferences (which showed
// "Couldn't load your preferences" and made night mode etc. disappear
// entirely — not because the feature broke, but because there was nothing
// at localhost:5173/api/notification-preferences to answer the request).
//
// This plugin re-creates just enough of Vercel's request handling to run
// the real api/*.js handler for each listed route during local dev: it
// loads .env the same way Vercel's dashboard env vars would be present at
// request time (Vite's own `import.meta.env` handling doesn't touch
// process.env, which is what every handler reads), reads the request body,
// and adapts Node's raw req/res into the (req, res) => res.status(n).json(x)
// shape every handler expects. Method validation (GET/PATCH/POST/etc.) is
// left to each handler itself, same as it already does on Vercel, rather
// than duplicating that logic here per route.
//
// Scoped to an explicit route list rather than a generic catch-all for all
// ~50 api/*.js files — most of those call third-party services (Twilio,
// FDA, PubMed, LLM providers) or are cron-only sweeps, and blindly proxying
// all of them is a bigger, riskier surface than actually needed. Add a route
// here only once something under it is actually being tested locally.
const LOCAL_API_ROUTES = [
  'contact',
  'notification-preferences',
  'export-data',
]

function apiDevProxy(routes, env) {
  return {
    name: 'api-dev-proxy',
    configureServer(server) {
      routes.forEach((route) => {
        server.middlewares.use(`/api/${route}`, async (req, res) => {
          try {
            Object.entries(env).forEach(([key, value]) => {
              if (value && process.env[key] === undefined) process.env[key] = value
            })

            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const raw = Buffer.concat(chunks).toString('utf8')
            let body = {}
            try { body = raw ? JSON.parse(raw) : {} } catch { /* handler validates and rejects malformed bodies itself */ }

            const { default: handler } = await server.ssrLoadModule(`/api/${route}.js`)
            const vercelRes = {
              statusCode: 200,
              setHeader: (key, value) => res.setHeader(key, value),
              status(code) { this.statusCode = code; return this },
              end(payload) { res.statusCode = this.statusCode; res.end(payload) },
              json(payload) {
                res.statusCode = this.statusCode
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(payload))
              },
            }
            await handler(Object.assign(req, { body }), vercelRes)
          } catch (err) {
            console.error(`[dev] /api/${route} proxy failed:`, err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Local dev proxy error — check the terminal running `npm run dev`.' }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: '/',
    plugins: [react(), apiDevProxy(LOCAL_API_ROUTES, env)],
    test: {
      environment: 'node',
    },
  }
})
