"""Synthesized product foley for the film. No music, no stock audio.

Every sound sits on a real event in index.html's timeline:
  taps on the screen       -> a soft tactile tap
  consent toggles          -> a small mechanical tick
  a component lifts        -> a barely audible material shift
  a component lands home   -> a tiny soft landing tone
  the policy line comes up -> one quiet two-note lift (the only "musical" moment)
  the wordmark             -> one soft tone, then silence to the end
plus a very low warm room tone that fades out before the close.

Writes out/sound.wav (48 kHz, 32-bit stereo). The film also works muted.
"""
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 38.0
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(7)  # deterministic
mix = np.zeros((int(SR * DUR), 2))

db = lambda d: 10 ** (d / 20)
def band(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lowp(x, f, order=2): return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)
def env(n, a, d):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), np.exp(-(t - a) / d))
    return e

def place(sig, t, gain_db, pan=0.0):
    i = int(t * SR); sig = sig * db(gain_db)
    j = min(len(mix), i + len(sig)); sig = sig[: j - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    mix[i:j, 0] += sig * l * 1.414; mix[i:j, 1] += sig * r * 1.414

def tap():
    n = int(SR * 0.09); t = np.arange(n) / SR
    click = band(rng.standard_normal(n), 1800, 5200) * env(n, 0.0015, 0.012)
    body = np.sin(2 * np.pi * 190 * t) * env(n, 0.002, 0.022) * 0.7
    return click * 0.6 + body

def tick():
    n = int(SR * 0.05); t = np.arange(n) / SR
    return band(rng.standard_normal(n), 3000, 8000) * env(n, 0.001, 0.007) * 0.8 + np.sin(2 * np.pi * 1750 * t) * env(n, 0.001, 0.010) * 0.25

def shift(length=0.55):
    n = int(SR * length); t = np.arange(n) / SR
    noise = band(rng.standard_normal(n), 250, 2400)
    e = np.sin(np.pi * np.clip(t / length, 0, 1)) ** 2
    return lowp(noise * e, 1800)

def land():
    n = int(SR * 0.6); t = np.arange(n) / SR
    tone = (np.sin(2 * np.pi * 660 * t) + 0.28 * np.sin(2 * np.pi * 990 * t)) * env(n, 0.006, 0.17)
    return tone + band(rng.standard_normal(n), 2000, 6000) * env(n, 0.001, 0.006) * 0.3

def bell(freqs, length, decay):
    n = int(SR * length); t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * t) for f, a in freqs)
    return s * env(n, 0.012, decay)

# taps (screen) and ticks (consent toggles)
for t, p in [(1.35, 0.2)]: place(tap(), t, -17, p)
for t in (4.82, 5.42): place(tick(), t, -21, 0.25)
# lifts: material shift, very quiet
for t, p in [(1.55, -0.3), (6.25, -0.3), (10.85, -0.35), (11.35, -0.25), (14.95, -0.3), (19.10, -0.3), (25.35, -0.5), (25.6, 0.5)]:
    place(shift(), t, -33, p)
# lands home
for t, p in [(3.80, -0.15), (8.90, -0.15), (14.15, -0.15), (17.85, -0.15), (24.05, -0.15), (31.6, 0.0)]:
    place(land(), t, -32, p)
# the policy line comes forward: the one tonal lift
place(bell([(523.25, 1.0), (1046.5, 0.18)], 2.2, 0.75), 26.9, -33, -0.08)
place(bell([(783.99, 1.0), (1567.98, 0.12)], 2.2, 0.85), 27.12, -35, 0.08)
# wordmark: one soft tone, then silence
place(bell([(392.0, 1.0), (587.33, 0.45)], 3.0, 0.9), 32.85, -34, 0.0)

# room tone: warm, very low, gone before the close
n = len(mix); t = np.arange(n) / SR
bed = sum(a * np.sin(2 * np.pi * f * t + ph) for f, a, ph in [(110, 1, 0), (164.81, .55, 1.1), (220, .3, 2.3)])
bed *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t)
bed = lowp(bed + band(rng.standard_normal(n), 120, 900) * 0.35, 700)
shape = np.clip(t / 1.5, 0, 1) * np.clip((32.2 - t) / 1.8, 0, 1)
mix[:, 0] += bed * shape * db(-43); mix[:, 1] += np.roll(bed, 240) * shape * db(-43)

# master: gentle limit, final fade, -1 dBTP-ish ceiling
mix *= db(11)  # sparse foley: about -31 LUFS integrated, peaks near -3.5 dBFS
mix *= np.clip((DUR - t) / 0.4, 0, 1)[:, None]
peak = np.abs(mix).max(); mix *= min(1.0, db(-1) / peak) if peak > 0 else 1
out = os.path.join(HERE, 'out', 'sound.wav')
wavfile.write(out, SR, (mix * (2 ** 31 - 1)).astype(np.int32))
print('wrote', out, f'peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS')
