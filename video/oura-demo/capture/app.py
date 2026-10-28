"""Shared capture harness: the real ayna mobile app on the film dev server.

Service-boundary mocks (documented in README):
  * Google Fonts -> the same families served locally (Fontsource), offline sandbox.
  * GET /api/pro?action=features -> {"enabled": false}: the Pro gate then renders
    exactly what a member with access sees. No Pro UI is shown in the film.
Nothing else is intercepted. Health data comes from the dev-only fixture.
"""
from playwright.sync_api import sync_playwright
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
FONT_CSS = open(os.path.join(HERE, 'fonts.css')).read()
BASE = 'http://localhost:5199/mobile-preview'
W, H = 393, 852  # iPhone 16 Pro logical points

def _pro(route):
    if 'action=features' in route.request.url:
        return route.fulfill(status=200, content_type='application/json', body=json.dumps({'enabled': False, 'premiumReadIds': []}))
    return route.continue_()

def open_app(p, query='healthdemo=1', scale=3, storage=None, state=None):
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=scale, is_mobile=True, has_touch=True,
                        timezone_id='America/New_York', locale='en-US', storage_state=state)
    ctx.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=FONT_CSS))
    ctx.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    ctx.route('**/api/pro**', _pro)
    if storage:
        ctx.add_init_script('(() => { const s = %s; for (const k in s) { try { if (!localStorage.getItem(k)) localStorage.setItem(k, s[k]); } catch {} } })()' % json.dumps(storage))
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: print('PAGEERROR', str(e)[:200]))
    pg.goto(f'{BASE}?{query}', wait_until='load')
    pg.wait_for_function('document.fonts.status === "loaded"'); pg.wait_for_timeout(1800)
    return b, ctx, pg

def tap(pg, text, exact=True, last=False, wait=900):
    loc = pg.get_by_text(text, exact=exact)
    (loc.last if last else loc.first).click(); pg.wait_for_timeout(wait)
