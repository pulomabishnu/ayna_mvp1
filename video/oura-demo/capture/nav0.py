"""Explore without persona state: nav0.py '<steps json>' out.png"""
import sys, json
from app import *
from quiz_probe import act, labels
steps = json.loads(sys.argv[1]); out = sys.argv[2] if len(sys.argv) > 2 else '/home/claude/shots/nav.png'
state = sys.argv[3] if len(sys.argv) > 3 else None
q = sys.argv[4] if len(sys.argv) > 4 else 'healthdemo=1'
with sync_playwright() as p:
    b, ctx, pg = open_app(p, query=q, scale=1, state=state)
    pg.wait_for_timeout(1500)
    for k, v in steps:
        try: act(pg, k, v)
        except Exception as e: print('FAILED', k, v); break
    pg.wait_for_timeout(900); pg.screenshot(path=out)
    print(pg.locator('body').inner_text()[:1600])
    print('BUTTONS', [t.strip().replace('\n',' | ')[:60] for t in pg.locator('button').all_inner_texts() if t.strip()][:40])
    print('LABELS', labels(pg))
    b.close()
