"""Exploration helper: replay quiz actions on the real app, then dump the screen.
Actions: ["btn", text] | ["role", exact name] | ["text", exact text] | ["label", aria-label]
         ["range", value] | ["fill", text]
"""
import sys, json
from app import *

SET_RANGE = ('(el, v) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;'
             ' set.call(el, v); el.dispatchEvent(new Event("input", {bubbles:true}));'
             ' el.dispatchEvent(new Event("change", {bubbles:true})); }')


def act(pg, kind, val):
    if kind == 'btn': pg.locator('button', has_text=val).first.click(timeout=4000)
    elif kind == 'role': pg.get_by_role('button', name=val, exact=True).first.click(timeout=4000)
    elif kind == 'text': pg.get_by_text(val, exact=True).first.click(timeout=4000)
    elif kind == 'aria': pg.locator(f'button[aria-label="{val}"]').first.click(timeout=4000, force=True)
    elif kind == 'label': pg.get_by_label(val).first.click(timeout=4000)
    elif kind == 'range': pg.locator('input[type=range]').first.evaluate(SET_RANGE, val)
    elif kind == 'fill': pg.locator('input,textarea').first.fill(val)
    elif kind == 'type':
        el = pg.locator(f'input[aria-label="{val[0]}"]').first; el.click(); el.type(val[1], delay=30)
    elif kind == 'key': pg.keyboard.press(val)
    elif kind == 'tapr': pg.mouse.click(330, 430)
    elif kind == 'tab': pg.get_by_role('tab', name=val, exact=True).first.click(timeout=4000)
    elif kind == 'wait': pg.wait_for_timeout(int(val))
    pg.wait_for_timeout(650)


def run(pg, actions):
    pg.wait_for_timeout(1500)
    start = pg.get_by_label('Start the quiz: slide or tap')
    if start.count():
        start.click(timeout=6000)
    else:  # shipped app (PR #88): Home -> Your matches -> Create your health profile
        pg.locator('button', has_text='Your matches').first.click(timeout=6000); pg.wait_for_timeout(1000)
        pg.locator('button', has_text='Create your health profile').first.click(timeout=6000)
    pg.wait_for_timeout(1400)
    for n, (kind, val) in enumerate(actions):
        try:
            act(pg, kind, val)
        except Exception:
            print('FAILED AT', n, kind, val)
            return False
    return True


def labels(pg):
    return pg.evaluate("[...document.querySelectorAll('[aria-label],[role=radio],input')].map(e=>(e.getAttribute('aria-label')||'')+'|'+e.tagName+'|'+(e.type||'')).slice(0,40)")


if __name__ == '__main__':
    actions = json.loads(sys.argv[1]) if len(sys.argv) > 1 else []
    with sync_playwright() as p:
        b, ctx, pg = open_app(p, scale=1)
        run(pg, actions)
        pg.screenshot(path='/home/claude/shots/quiz.png', full_page=True)
        print(pg.locator('body').inner_text()[:1500])
        print('LABELS', labels(pg))
        print('BUTTONS', [t.strip().replace('\n', ' | ') for t in pg.locator('button').all_inner_texts() if t.strip()][:50])
        b.close()
