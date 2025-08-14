#!/usr/bin/env python3
"""
Generates seamless placeholder loops (15s, 44.1kHz) with a tiny edge crossfade
to avoid clicks. Outputs to assets/loops/*.wav

- bird.wav  : bird noise (low, warm)
- wind.wav   : Band-passed noise with slow amplitude LFO
- rain.wav   : Pink-ish noise with random drops
- fire.wav   : Crackle + low whoosh
- cafe.wav   : Murmur band-pass + clinks (random pings)

Requires: numpy, soundfile
    pip install numpy soundfile
"""
import os, numpy as np, soundfile as sf

SR = 44100
DUR = 15.0
N = int(DUR*SR)

def crossfade_loop(x, fade=1024):
    w = np.linspace(0,1,fade)
    x[:fade] = x[:fade]*(1-w) + x[-fade:]*w
    return x

def norm(x, target=-12.0):
    # normalize to target dBFS
    rms = np.sqrt(np.mean(x**2)+1e-12)
    db = 20*np.log10(rms+1e-9)
    gain = 10**((target - db)/20)
    return np.clip(x*gain, -1, 1)

def bird_noise(n):
    # Integrate white noise
    w = np.random.randn(n)/5
    b = np.cumsum(w)
    b = b/np.max(np.abs(b))
    return b

def pink_like(n):
    # crude 1/f by filtering white
    x = np.random.randn(n)
    from scipy.signal import lfilter
    b=[0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a=[1, -2.494956002, 2.017265875, -0.522189400]
    y = lfilter(b,a,x)
    y /= np.max(np.abs(y)+1e-9)
    return y

def bandpass(x, low, high, sr=SR):
    from scipy.signal import butter, sosfilt
    sos = butter(4, [low/(sr/2), high/(sr/2)], btype='band', output='sos')
    return sosfilt(sos, x)

def write(name, x):
    os.makedirs('assets/loops', exist_ok=True)
    sf.write(f'assets/loops/{name}.wav', x.astype(np.float32), SR)

# bird
x = bird_noise(N)
x = crossfade_loop(x.copy())
write('bird', norm(x, -18))

# Wind
x = bandpass(np.random.randn(N), 100, 1000)
lfo = (np.sin(2*np.pi*np.linspace(0,DUR,N)/12)+1)/2*0.4 + 0.6
x = x * lfo
x = crossfade_loop(x.copy())
write('wind', norm(x, -20))

# Rain
x = pink_like(N)*0.5 + np.random.randn(N)*0.05
# random drops (short bursts)
for _ in range(600):
    i = np.random.randint(0, N-400)
    drop = np.hanning(400)*0.4
    x[i:i+400] += drop*np.random.uniform(0.6,1.0)
x = bandpass(x, 500, 7000)
x = crossfade_loop(x.copy())
write('rain', norm(x, -18))

# Fire (crackle)
x = bird_noise(N)*0.2 + bandpass(np.random.randn(N), 80, 400)*0.4
for _ in range(500):
    i = np.random.randint(0, N-200)
    spark = (np.random.rand(200)**3)*0.6
    x[i:i+200] += spark*np.hanning(200)
x = crossfade_loop(x.copy())
write('fire', norm(x, -18))

# Cafe (murmur + clinks)
x = bandpass(np.random.randn(N), 200, 1500)*0.4
for _ in range(120):
    i = np.random.randint(0, N-1000)
    ping = np.sin(2*np.pi*np.linspace(0, 800, 1000)/800)*np.hanning(1000)*0.1
    x[i:i+1000] += ping
x = crossfade_loop(x.copy())
write('cafe', norm(x, -20))

print("Generated loops in assets/loops/*.wav")
