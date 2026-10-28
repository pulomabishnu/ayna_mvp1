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
    """The real component alone: everything else hidden, its own pixels kept.
    Rendered in a tall viewport so a card that runs past the fold is captured whole;
    its slot (where it lifts from) is its place on the captured screen."""
    r0 = rect(pg, handle)
    scroller = pg.evaluate_handle("""(e) => { let s = e.parentElement; while (s && !(s.scrollHeight > s.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(s).overflowY))) s = s.parentElement; return s || document.scrollingElement; }""", handle)
    top0 = pg.evaluate('(s) => s.scrollTop', scroller)
    pg.set_viewport_size({'width': W, 'height': 2400}); pg.wait_for_timeout(400)
    pg.evaluate("([e, s]) => { s.scrollTop += e.getBoundingClientRect().top - 40; }", [handle, scroller]); pg.wait_for_timeout(300)
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
    pg.set_viewport_size({'width': W, 'height': VH}); pg.wait_for_timeout(400)
    pg.evaluate('([s, t]) => { s.scrollTop = t; }', [scroller, top0]); pg.wait_for_timeout(300)
    from PIL import Image
    im = Image.open(f'{OUT}/elements/{name}.png').convert('RGBA'); a = im.getchannel('A').point(lambda v: 0 if v < 48 else v); im.putalpha(a); im.save(f'{OUT}/elements/{name}.png')
    manifest['elements'][name] = {'kind': 'iso', 'screen': screen_name, 'file': f'elements/{name}.png',
                                  'box': [r0[0] - pad, r0[1] - pad, clip['width'], clip['height']]}
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
    # Shot 1-2: before Oura is connected. The list (scrolled to apps), then Oura's consent screen.
    b, pg = session(p, 'healthdemo=1&ourafilm=pre')
    health_data(pg)
    scroll_to(pg, pg.locator('section.ay-hc-group h2', has_text='Apps and wearables').first.element_handle(), 64)
    screen(pg, 'list_pre')
    row = find(pg, 'button.ay-hc-row', 'Oura')
    region(pg, 'oura_row', 'list_pre', [row], pad=0); tap_point(pg, 'oura_row', row)
    row.click(); pg.wait_for_timeout(1300); keep_top(pg)
    screen(pg, 'consent_0')
    SCROLLER = """(e) => { let s = e.parentElement; while (s && !(s.scrollHeight > s.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(s).overflowY))) s = s.parentElement; return s || document.scrollingElement; }"""
    for i, cat in enumerate(['Sleep', 'Temperature']):   # the two rows above the fold
        sw = pg.locator(f'button[aria-label="Share {cat}"]').first
        h = sw.element_handle(); scroller = pg.evaluate_handle(SCROLLER, h)
        top = pg.evaluate('(s) => s.scrollTop', scroller)
        tap_point(pg, f'toggle_{i + 1}', h)
        sw.click(); pg.wait_for_timeout(450)
        pg.evaluate('([s, t]) => { s.scrollTop = t; }', [scroller, top]); pg.wait_for_timeout(250)
        screen(pg, f'consent_{i + 1}')
    ps = pg.locator('div.ay-hc-facts > p')
    reads = ps.filter(has_text='What ayna reads.').first.element_handle()
    never = ps.filter(has_text='What ayna never reads.').first.element_handle()
    region(pg, 'facts', 'consent_2', [reads, never], pad=12)
    b.close()

    # Connected state (fixture: Oura connected), plus the real policy line.
    b, pg = session(p, 'healthdemo=1')
    health_data(pg)
    act(pg, 'btn', 'Oura'); pg.wait_for_timeout(1000); keep_top(pg)
    screen(pg, 'oura_on')
    region(pg, 'policy', 'oura_on', [find(pg, 'div.ay-hc-facts p.ay-hc-small')], pad=12)
    b.close()

    # Shot 3: discovery, from what she told ayna (the real quiz, fictional answers).
    b, ctx, pg = open_app(p, query='healthdemo=1', scale=3)
    pg.set_viewport_size({'width': W, 'height': VH}); pg.wait_for_timeout(400)
    from quiz_probe import run
    assert run(pg, json.load(open(os.path.join(HERE, 'persona_actions.json')))[:-2])
    pg.wait_for_timeout(1800)
    screen(pg, 'results')
    region(pg, 'focus', 'results', [find(pg, 'p.ay-ob-ready__lead'), find(pg, 'ol.ay-ob-ready__list')], pad=14)
    iso(pg, 'lead_card', 'results', find(pg, 'li.ay-ob-match.is-lead'), pad=12)
    frag = pg.locator('li.ay-ob-match').filter(has_text='Fragrance-free, which you asked for').first.element_handle()
    pg.evaluate("(e) => { const ul = e.closest('ul'); ul.scrollLeft = e.offsetLeft - ul.offsetLeft - 24; }", frag); pg.wait_for_timeout(700)
    screen(pg, 'results_swiped')
    iso(pg, 'frag_card', 'results_swiped', frag, pad=12)
    for n in ('results', 'results_swiped'): manifest['edges'][n][1] = manifest['edges'][n][0]
    b.close()

    # Shot 4: her Oura nights, in her insights.
    b, pg = session(p, 'healthdemo=1')
    act(pg, 'btn', 'Your data'); pg.wait_for_timeout(1000)
    screen(pg, 'dash')
    act(pg, 'tab', 'Sleep'); pg.wait_for_timeout(1300)
    screen(pg, 'sleep')
    iso(pg, 'source_line', 'sleep', find(pg, 'p.ay-db-source'), pad=8)
    iso(pg, 'sleep_card', 'sleep', pg.locator('section.ay-db-card').filter(has=pg.locator('h2', has_text='Less sleep than usual')).first.element_handle(), pad=14)
    b.close()

    # Close: the real wordmark, as the app renders it.
    b, ctx, pg = open_app(p, query='healthdemo=1', scale=8, state=os.path.join(HERE, 'persona_state.json'))
    pg.wait_for_timeout(2500)
    h = pg.locator('button.ayna-shared-wordmark').first.element_handle()
    iso(pg, 'wordmark', 'wordmark', h, pad=6)
    b.close()

json.dump(manifest, open(f'{OUT}/manifest.json', 'w'), indent=1)
print('done', len(manifest['screens']), 'screens', len(manifest['elements']), 'elements')
