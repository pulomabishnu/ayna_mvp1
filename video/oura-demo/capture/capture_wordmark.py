"""Capture every product state and component the film uses, from the REAL app.

Output (video/oura-demo/assets/):
  screens/<name>.png    full app screen at 3x (1179 x 2292 px = 393 x 764 pt)
  elements/<name>.png   one real component, isolated from the live DOM with its
                        own styling and shadow, transparent around it
  manifest.json         each element's box on its screen (pt), plus tap points

Screen height is 764 pt = an iPhone 16 Pro's 852 pt minus the 54 pt status bar
and 34 pt home-indicator areas, which the device frame draws.

Run with the film dev server up (see README). Needs persona_state.json
(python3 make_persona.py).
"""
import json, os
from app import *
from quiz_probe import act

OUT = os.path.abspath(os.path.join(HERE, '..', 'assets'))
os.makedirs(f'{OUT}/screens', exist_ok=True)
os.makedirs(f'{OUT}/elements', exist_ok=True)
VH = 764
manifest = {'scale': 3, 'screen_pt': [W, VH], 'screens': {}, 'elements': {}, 'taps': {}}

ISO_CSS = """
html, body { background: transparent !important; }
html::before, html::after, body::before, body::after { display: none !important; }
body *:not(.__iso):not(.__iso *):not(.__anc) { visibility: hidden !important; }
.__anc { background: transparent !important; background-image: none !important; box-shadow: none !important;
         border-color: transparent !important; outline: none !important; }
.__anc::before, .__anc::after { display: none !important; }
"""

def rect(pg, handle):
    return pg.evaluate('(e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }', handle)

def screen(pg, name):
    pg.wait_for_timeout(600)
    pg.screenshot(path=f'{OUT}/screens/{name}.png')
    manifest['screens'][name] = f'screens/{name}.png'
    # the app's own colour at the very top and bottom, for the status bar and home-indicator strips
    from PIL import Image
    im = Image.open(f'{OUT}/screens/{name}.png').convert('RGB'); w, h = im.size
    manifest.setdefault('edges', {})[name] = ['#%02x%02x%02x' % im.getpixel((w // 2, 3)), '#%02x%02x%02x' % im.getpixel((w // 2, h - 3))]
    print('screen', name)

def region(pg, name, screen_name, handles, pad=10):
    """Masked region of a captured screen (same pixels), for text blocks with no card of their own."""
    rs = [rect(pg, h) for h in handles]
    x0 = min(r[0] for r in rs) - pad; y0 = min(r[1] for r in rs) - pad
    x1 = max(r[0] + r[2] for r in rs) + pad; y1 = max(r[1] + r[3] for r in rs) + pad
    manifest['elements'][name] = {'kind': 'region', 'screen': screen_name, 'box': [x0, y0, x1 - x0, y1 - y0]}
    print('region', name)

def iso(pg, name, screen_name, handle, pad=14):
    """The real component alone: everything else hidden, its own pixels kept."""
    r = rect(pg, handle)
    pg.evaluate("""([e, css]) => {
        let n = e.parentElement; while (n) { n.classList.add('__anc');
            for (const [k, v] of [['background', 'transparent'], ['background-image', 'none'], ['box-shadow', 'none'], ['border-color', 'transparent'], ['outline', 'none']]) n.style.setProperty(k, v, 'important');
            n = n.parentElement; }
        e.classList.add('__iso');
        const s = document.createElement('style'); s.id = '__iso_css'; s.textContent = css; document.head.appendChild(s);
    }""", [handle, ISO_CSS])
    pg.wait_for_timeout(250)
    clip = {'x': r[0] - pad, 'y': r[1] - pad, 'width': r[2] + 2 * pad, 'height': r[3] + 2 * pad}
    pg.screenshot(path=f'{OUT}/elements/{name}.png', clip=clip, omit_background=True)
    pg.evaluate("""(e) => {
        document.getElementById('__iso_css')?.remove();
        document.querySelectorAll('.__anc').forEach((n) => { n.classList.remove('__anc'); for (const k of ['background', 'background-image', 'box-shadow', 'border-color', 'outline']) n.style.removeProperty(k); });
        e.classList.remove('__iso');
    }""", handle)
    from PIL import Image
    im = Image.open(f'{OUT}/elements/{name}.png').convert('RGBA'); a = im.getchannel('A').point(lambda v: 0 if v < 48 else v); im.putalpha(a); im.save(f'{OUT}/elements/{name}.png')
    manifest['elements'][name] = {'kind': 'iso', 'screen': screen_name, 'file': f'elements/{name}.png',
                                  'box': [clip['x'], clip['y'], clip['width'], clip['height']]}
    print('iso', name)

def tap_point(pg, name, handle):
    r = rect(pg, handle); manifest['taps'][name] = [r[0] + r[2] / 2, r[1] + r[3] / 2]

def find(pg, selector, text=None):
    loc = pg.locator(selector)
    if text: loc = loc.filter(has_text=text)
    return loc.first.element_handle()

def scroll_to(pg, handle, top):
    """Scroll the element's scrolling container so the element sits `top` pt from the top."""
    pg.evaluate("""([e, top]) => {
        let s = e.parentElement; while (s && !(s.scrollHeight > s.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(s).overflowY))) s = s.parentElement;
        const scroller = s || document.scrollingElement;
        const dy = e.getBoundingClientRect().top - top; scroller.scrollBy(0, dy);
    }""", [handle, top])
    pg.wait_for_timeout(500)

def session(p, query):
    b, ctx, pg = open_app(p, query=query, scale=3, state=os.path.join(HERE, 'persona_state.json'))
    pg.set_viewport_size({'width': W, 'height': VH}); pg.wait_for_timeout(500)
    return b, pg

def health_data(pg):
    for k, v in [['btn', 'Your data'], ['wait', '900'], ['btn', 'Manage connected apps'], ['wait', '1100']]: act(pg, k, v)

def keep_top(pg):
    pg.evaluate("() => document.querySelectorAll('.ay-hc-scroll').forEach((s) => { s.scrollTop = 0; })")


with sync_playwright() as p:
    manifest.update(json.load(open(f'{OUT}/manifest.json')) if os.path.exists(f'{OUT}/manifest.json') else {})
    # Close: the real wordmark, as the app renders it.
    b, ctx, pg = open_app(p, query='healthdemo=1', scale=8, state=os.path.join(HERE, 'persona_state.json'))
    pg.wait_for_timeout(2500)
    h = pg.locator('button.ayna-shared-wordmark').first.element_handle()
    iso(pg, 'wordmark', 'wordmark', h, pad=6)
    b.close()

json.dump(manifest, open(f'{OUT}/manifest.json', 'w'), indent=1)
print('done', len(manifest['screens']), 'screens', len(manifest['elements']), 'elements')
