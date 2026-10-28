"""Render the film frame by frame in headless Chromium.

  python3 render.py stills 2.6 7.8 12.8 ...      -> out/still_<t>.png (1920x1080 preview)
  python3 render.py frames --fps 60 --workers 2  -> out/master_4k.mov (ProRes 422 HQ, 3840x2160)

Each worker opens the page, calls setTime(t) for its frames, and pipes PNG
screenshots straight into its own ffmpeg; the segments are then joined
losslessly. Deterministic: the same inputs always give the same frames.
"""
import argparse, json, os, subprocess, sys, time
from concurrent.futures import ProcessPoolExecutor
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)


def open_page(p, scale):
    b = p.chromium.launch(args=['--allow-file-access-from-files', '--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none'])
    pg = b.new_page(viewport={'width': 1920, 'height': 1080}, device_scale_factor=scale)
    manifest = json.load(open(os.path.join(ASSETS, 'manifest.json')))
    pg.add_init_script('window.MANIFEST = %s;' % json.dumps(manifest))
    pg.on('pageerror', lambda e: print('PAGEERROR', e, file=sys.stderr))
    pg.goto('file://' + os.path.join(HERE, 'index.html'))
    pg.evaluate('window.ready')
    pg.wait_for_timeout(400)
    return b, pg


def stills(times, scale=1):
    with sync_playwright() as p:
        b, pg = open_page(p, scale)
        for t in times:
            pg.evaluate(f'window.setTime({t})')
            path = os.path.join(OUT, f'still_{t:05.2f}.png')
            pg.screenshot(path=path)
            print(path)
        b.close()


def segment(args):
    idx, f0, f1, fps = args
    seg = os.path.join(OUT, f'seg_{idx}.mov')
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(fps), '-c:v', 'png', '-i', '-',
                           '-c:v', 'prores_ks', '-profile:v', '3', '-pix_fmt', 'yuv422p10le', '-vendor', 'apl0',
                           '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', seg], stdin=subprocess.PIPE)
    t0 = time.time()
    with sync_playwright() as p:
        b, pg = open_page(p, 2)
        for f in range(f0, f1):
            pg.evaluate(f'window.setTime({f / fps})')
            ff.stdin.write(pg.screenshot(type='png'))
            if (f - f0) % 120 == 0:
                print(f'[w{idx}] frame {f}/{f1}  {(time.time() - t0) / max(1, f - f0 + 1):.2f}s/frame', flush=True)
        b.close()
    ff.stdin.close(); ff.wait()
    return seg


def frames(fps, workers, limit=None):
    with sync_playwright() as p:
        b, pg = open_page(p, 1); dur = pg.evaluate('window.DURATION'); b.close()
    total = int(round(dur * fps)) if not limit else int(limit * fps)
    step = (total + workers - 1) // workers
    jobs = [(i, i * step, min(total, (i + 1) * step), fps) for i in range(workers)]
    with ProcessPoolExecutor(workers) as ex:
        segs = list(ex.map(segment, jobs))
    lst = os.path.join(OUT, 'segs.txt')
    open(lst, 'w').write(''.join(f"file '{s}'\n" for s in segs))
    master = os.path.join(OUT, 'master_4k_silent.mov')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', master], check=True)
    print('wrote', master, total, 'frames')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('mode', choices=['stills', 'frames'])
    ap.add_argument('times', nargs='*', type=float)
    ap.add_argument('--fps', type=int, default=60)
    ap.add_argument('--workers', type=int, default=2)
    ap.add_argument('--limit', type=float, default=None, help='render only the first N seconds (test)')
    a = ap.parse_args()
    if a.mode == 'stills': stills(a.times)
    else: frames(a.fps, a.workers, a.limit)
