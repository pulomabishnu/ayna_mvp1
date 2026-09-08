/* global process, Buffer */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// `vite dev` only serves the SPA — it has no serverless runtime, so every
// /api/*.js route (Vercel functions) 404s under plain `npm run dev`. That
// silently breaks anything that depends on a real backend call while testing
// locally (the contact form's Resend send, in particular — it was showing
// "We could not send your message" locally even though the endpoint itself
// is correctly wired, because there was nothing at localhost:5173/api/contact
// to answer the request at all).
//
// This plugin re-creates just enough of Vercel's request handling to run
// api/contact.js for real during local dev: it loads .env the same way
// Vercel's dashboard env vars would be present at request time (Vite's own
// `import.meta.env` handling doesn't touch process.env, which is what the
// handler reads), reads the request body, and adapts Node's raw req/res into
// the (req, res) => res.status(n).json(x) shape the handler expects.
//
// Scoped to just /api/contact rather than a generic catch-all for all ~50
// api/*.js files — most of those call third-party services (Twilio, FDA,
// PubMed, LLM providers) or are cron-only sweeps, and blindly proxying all
// of them is a bigger, riskier surface than what was actually asked for here.
function contactApiDevProxy(env) {
  return {
    name: 'contact-api-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/contact', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        try {
          Object.entries(env).forEach(([key, value]) => {
            if (value && process.env[key] === undefined) process.env[key] = value
          })

          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const raw = Buffer.concat(chunks).toString('utf8')
          let body = {}
          try { body = raw ? JSON.parse(raw) : {} } catch { /* handler validates and rejects malformed bodies itself */ }

          const { default: handler } = await server.ssrLoadModule('/api/contact.js')
          const vercelRes = {
            statusCode: 200,
            setHeader: (key, value) => res.setHeader(key, value),
            status(code) { this.statusCode = code; return this },
            json(payload) {
              res.statusCode = this.statusCode
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(payload))
            },
          }
          await handler(Object.assign(req, { body }), vercelRes)
        } catch (err) {
          console.error('[dev] /api/contact proxy failed:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Local dev proxy error — check the terminal running `npm run dev`.' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: '/',
    plugins: [react(), contactApiDevProxy(env)],
    test: {
      environment: 'node',
    },
  }
})
