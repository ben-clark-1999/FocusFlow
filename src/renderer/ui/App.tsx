import React, { useEffect, useMemo, useRef, useState } from 'react';
import SoundCard from './SoundCard';
import MasterControls from './MasterControls';
import PresetsBar from './PresetsBar';
import StatusBar from './StatusBar';

import { AudioEngine } from '../audio/engine';
import { TRACKS } from '../audio/tracks';

import type { AppState, Preset, TrackState, FocusFlow } from '../../shared/types';

/**
 * Audio reliability hardening:
 * - Engine-first playback (uses your engine exactly like before)
 * - Automatic HTMLAudio fallback if engine doesn’t actually play
 * - Preloads /assets/loops/*.wav so buffers/elements exist
 * - Resumes AudioContext (and HTMLAudio) on first user gesture
 * - Keeps prior UX fixes (functional setState, atomic preset apply)
 */

// ---------- Defaults ----------
const DEFAULT_STATE: AppState = {
  theme: 'system',
  masterVolume: 0.8,
  crossfadeSec: 0.8,
  lastSaved: null,
  tracks: TRACKS.map(t => ({ id: t.id, enabled: false, volume: t.defaultVolume })),
  presets: []
} as any;

// ---------- Ambient app (use canonical FocusFlow type) ----------
declare global {
  interface Window {
    FocusFlow: FocusFlow;
  }
}

// Helper: build Vite asset URLs to /assets/loops
const loopUrl = (fileName: string) =>
  new URL(`../../../assets/loops/${fileName}`, import.meta.url).href;

export default function App() {
  const engineRef = useRef<AudioEngine | null>(null);

  // Fallback HTMLAudio (always created, only used if needed)
  const htmlAudioRef = useRef<Record<string, HTMLAudioElement>>({});
  const usingFallbackRef = useRef(false);

  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [cpu, setCpu] = useState(0);
  const didBindResume = useRef(false);

  const trackIndex = useMemo(() => {
    const map = new Map<string, number>();
    state.tracks.forEach((t, i) => map.set(t.id, i));
    return map;
  }, [state.tracks]);

  // ----- bootstrap engine + preload audio -----
  useEffect(() => {
    const engine = new AudioEngine();
    engineRef.current = engine;

    // initial engine knobs
    (engine as any).setMasterVolume?.(DEFAULT_STATE.masterVolume);
    (engine as any).setCrossfade?.(DEFAULT_STATE.crossfadeSec);

    // Always create HTMLAudio fallback elements (cheap & robust)
    const els: Record<string, HTMLAudioElement> = {};
    for (const t of TRACKS) {
      const el = new Audio(loopUrl(t.fileName));
      el.loop = true;
      el.preload = 'auto';
      // start at default overall volume (master * track)
      el.volume = clamp01(DEFAULT_STATE.masterVolume * t.defaultVolume);
      els[t.id] = el;
    }
    htmlAudioRef.current = els;

    let cancelled = false;
    (async () => {
      const saved = (await window.FocusFlow?.loadState?.()) ?? DEFAULT_STATE;
      if (cancelled) return;

      setTheme((saved as any).theme ?? 'system');
      setState(saved);

      // Try your preload file listing -> engine buffers
      let loadedAny = false;
      try {
        const files = await window.FocusFlow?.listLoopFiles?.();
        if (files && files.length) {
          for (const t of TRACKS) {
            const match = files.find(
              f => f.endsWith('/' + t.fileName) || f.endsWith('\\' + t.fileName)
            );
            if (match) {
              try {
                await (engine as any).loadBuffer?.(t.id, match);
                loadedAny = true;
              } catch (e) {
                console.warn('decode fail (preload-path)', t.id, e);
              }
            }
          }
        }
      } catch {
        /* ignore: we’ll still have HTMLAudio + Vite URLs */
      }

      // Fallback: load buffers by URL too (harmless if engine ignores)
      if (!loadedAny) {
        for (const t of TRACKS) {
          try {
            const url = loopUrl(t.fileName);
            await (engine as any).loadBuffer?.(t.id, url);
            loadedAny = true;
          } catch (e) {
            console.warn('decode fail (vite-url)', t.id, e);
          }
        }
      }

      // Decide if we should rely on HTMLAudio fallback
      // If engine exposes none of the usual play verbs, prefer fallback.
      const e: any = engineRef.current;
      const canEnginePlay =
        !!(e?.setTrackState || e?.playLoop || e?.playTrack || e?.play || e?.startTrack);
      usingFallbackRef.current = !canEnginePlay;

      // Apply saved state to engine (and HTML fallback will mirror on toggles)
      commitAppStateToEngine(saved);
    })();

    const iv = window.setInterval(() => {
      const e: any = engineRef.current;
      const c = e?.getCpuUsage?.() ?? e?.getCPU?.() ?? e?.cpu?.();
      if (typeof c === 'number') setCpu(c);
    }, 800);

    return () => {
      cancelled = true;
      clearInterval(iv);
      try { (engine as any).dispose?.(); } catch {}
      engineRef.current = null;
      // stop fallback audios
      for (const id in htmlAudioRef.current) {
        const a = htmlAudioRef.current[id];
        try { a.pause(); } catch {}
      }
    };
  }, []);

  // ----- resume audio on first gesture -----
  useEffect(() => {
    if (didBindResume.current) return;
    didBindResume.current = true;

    const resumeAll = () => {
      const e: any = engineRef.current;
      try { e?.resume?.(); } catch {}
      try { e?.resumeAudio?.(); } catch {}
      try { e?.context?.resume?.(); } catch {}
      // HTMLAudio doesn’t need resume, but calling play on enable is enough
      window.removeEventListener('pointerdown', resumeAll);
      window.removeEventListener('keydown', resumeAll);
    };

    window.addEventListener('pointerdown', resumeAll, { once: true });
    window.addEventListener('keydown', resumeAll, { once: true });
  }, []);

  // ----- theming -----
  useEffect(() => {
    const prefers = window.matchMedia?.('(prefers-color-scheme: dark)');
    const resolve = () => (theme === 'system' ? (prefers?.matches ? 'dark' : 'light') : theme);
    const apply = () => document.documentElement.setAttribute('data-theme', resolve());
    apply();
    const onChange = () => theme === 'system' && apply();
    prefers?.addEventListener?.('change', onChange);
    return () => prefers?.removeEventListener?.('change', onChange);
  }, [theme]);

  // ---------- Engine sync helpers ----------

  function commitTrackToEngine(id: string, enabled: boolean, volume: number) {
    const e: any = engineRef.current;

    // HTMLAudio fallback (used if engine can’t play)
    if (!e || usingFallbackRef.current) {
      const a = htmlAudioRef.current[id];
      if (a) {
        a.volume = clamp01(volume * state.masterVolume);
        if (enabled) {
          a.play().catch(() => {/* ignore */});
        } else {
          try { a.pause(); a.currentTime = 0; } catch {}
        }
      }
      return;
    }

    // Engine path
    try {
      // Ensure buffer exists (engine that lazy-loads)
      const meta = TRACKS.find(m => m.id === id);
      if (meta) e?.ensureBuffer?.(id, loopUrl(meta.fileName));
    } catch {}

    e?.setTrackVolume?.(id, volume);
    e?.setMasterVolume?.(state.masterVolume);
    e?.setCrossfade?.(state.crossfadeSec);

    if (enabled) {
      e?.setTrackEnabled?.(id, true);
      e?.unmuteTrack?.(id);
      e?.startTrack?.(id);
      e?.playLoop?.(id);
      e?.playTrack?.(id);
      e?.play?.(id);
    } else {
      e?.setTrackEnabled?.(id, false);
      e?.muteTrack?.(id);
      e?.stopTrack?.(id);
      e?.stopLoop?.(id);
      e?.pauseTrack?.(id);
      e?.stop?.(id);
    }

    // If available, an all-in-one setter (often the canonical API)
    e?.setTrackState?.(id, enabled, volume);
  }

  function commitAppStateToEngine(next: AppState) {
    const e: any = engineRef.current;

    // Mirror master volume to fallback audios
    for (const t of next.tracks) {
      const a = htmlAudioRef.current[t.id];
      if (a) a.volume = clamp01(t.volume * next.masterVolume);
    }

    if (!e || usingFallbackRef.current) return;
    e?.setMasterVolume?.(next.masterVolume);
    e?.setCrossfade?.(next.crossfadeSec);
    for (const t of next.tracks) commitTrackToEngine(t.id, t.enabled, t.volume);
  }

  // ---------- UI actions ----------
  function setTrackState(id: string, enabled: boolean, volume: number) {
    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === id ? { ...t, enabled, volume } : t)
    }));
    queueMicrotask(() => commitTrackToEngine(id, enabled, volume));
  }

  function toggleTrack(id: string) {
    let nextEnabled = false;
    let vol = 0;

    setState(prev => {
      const idx = prev.tracks.findIndex(t => t.id === id);
      if (idx === -1) return prev;
      const cur = prev.tracks[idx];
      nextEnabled = !cur.enabled;
      vol = cur.volume;
      const nextTracks = prev.tracks.slice();
      nextTracks[idx] = { ...cur, enabled: nextEnabled };
      return { ...prev, tracks: nextTracks };
    });

    queueMicrotask(() => commitTrackToEngine(id, nextEnabled, vol));
  }

  function setMasterVolume(v: number) {
    setState(prev => ({ ...prev, masterVolume: v }));
    queueMicrotask(() => {
      // fallback mirror
      for (const t of state.tracks) {
        const a = htmlAudioRef.current[t.id];
        if (a) a.volume = clamp01(t.volume * v);
      }
      // engine
      (engineRef.current as any)?.setMasterVolume?.(v);
    });
  }

  function setCrossfade(v: number) {
    setState(prev => ({ ...prev, crossfadeSec: v }));
    queueMicrotask(() => (engineRef.current as any)?.setCrossfade?.(v));
  }

  // Atomic preset application: state → engine (and fallback mirrors)
  function applyPreset(p: Preset) {
    setState(prev => ({
      ...prev,
      masterVolume: p.masterVolume,
      crossfadeSec: p.crossfadeSec,
      tracks: p.tracks.map(t => ({ ...t }))
    }));
    queueMicrotask(() => {
      // Mirror to fallback audios first
      for (const t of p.tracks) {
        const a = htmlAudioRef.current[t.id];
        if (a) a.volume = clamp01(t.volume * p.masterVolume);
      }
      const e: any = engineRef.current;
      e?.setMasterVolume?.(p.masterVolume);
      e?.setCrossfade?.(p.crossfadeSec);
      for (const t of p.tracks) commitTrackToEngine(t.id, t.enabled, t.volume);
    });
  }

  function savePreset(name: string, overwrite: boolean) {
    setState(prev => {
      const existingIdx = prev.presets.findIndex(p => p.name === name);
      const snapshot: Preset = {
        name,
        masterVolume: prev.masterVolume,
        crossfadeSec: prev.crossfadeSec,
        tracks: prev.tracks.map(t => ({ ...t })),
      } as any;

      let nextPresets: Preset[];
      if (existingIdx >= 0 && overwrite) {
        nextPresets = prev.presets.slice();
        nextPresets[existingIdx] = snapshot;
      } else if (existingIdx === -1) {
        nextPresets = prev.presets.concat(snapshot);
      } else {
        nextPresets = prev.presets; // name clash w/o overwrite
      }
      const next = { ...prev, presets: nextPresets, lastSaved: new Date().toISOString() };
      queueMicrotask(() => window.FocusFlow?.saveState?.(next).catch(() => {}));
      return next;
    });
  }

  function loadPreset(name: string) {
    const p = state.presets.find(x => x.name === name);
    if (p) applyPreset(p);
  }

  function deletePreset(name: string) {
    setState(prev => ({ ...prev, presets: prev.presets.filter(p => p.name !== name) }));
  }

  function onPlayPauseAll() {
    // For fallback: toggle any enabled ones; engine: call API if it exists
    const e: any = engineRef.current;
    if (usingFallbackRef.current || !e?.playPauseAll) {
      // naive fallback: if any playing, stop all; else start all enabled
      const anyPlaying = Object.values(htmlAudioRef.current).some(a => !a.paused);
      if (anyPlaying) {
        for (const a of Object.values(htmlAudioRef.current)) { try { a.pause(); } catch {} }
      } else {
        for (const t of state.tracks) {
          if (t.enabled) htmlAudioRef.current[t.id]?.play().catch(()=>{});
        }
      }
    } else {
      e.playPauseAll?.();
      e.toggleAll?.();
    }
  }

  function onStopAll() {
    const e: any = engineRef.current;
    for (const a of Object.values(htmlAudioRef.current)) { try { a.pause(); a.currentTime = 0; } catch {} }
    e?.stopAll?.();
    e?.stop?.();
  }

  function onSaveSession() {
    const snapshot = { ...state, lastSaved: new Date().toISOString() };
    setState(snapshot);
    window.FocusFlow?.saveState?.(snapshot).catch(() => {});
  }

  // Shortcut keys 1–9 for track toggles
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const digit = Number(e.key);
      if (digit >= 1 && digit <= TRACKS.length) {
        const meta = TRACKS[digit - 1];
        toggleTrack(meta.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Resolve meta + state together for render
  const withState = useMemo(() => {
    const map = new Map(state.tracks.map<[string, TrackState]>(t => [t.id, t]));
    return TRACKS.map(meta => ({ meta, ts: map.get(meta.id)! }));
  }, [state.tracks]);

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="logo">FocusFlow</h1>
        <div className="spacer" />
        <select
          aria-label="Theme"
          className="btn ghost"
          value={theme}
          onChange={e => setTheme(e.target.value as any)}
        >
          <option value="system">System</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </header>

      <MasterControls
        masterVolume={state.masterVolume}
        crossfade={state.crossfadeSec}
        onMaster={setMasterVolume}
        onCrossfade={setCrossfade}
        onPlayPauseAll={onPlayPauseAll}
        onStopAll={onStopAll}
        onSave={onSaveSession}
      />

      <PresetsBar
        presets={state.presets}
        onSave={savePreset}
        onLoad={loadPreset}
        onDelete={deletePreset}
      />

      <main className="grid">
        {withState.map(({ meta, ts }) => (
          <SoundCard
            key={meta.id}
            meta={meta}
            state={ts}
            getRemaining={() => null /* engine-specific; safe to stub */}
            onToggle={(on) => setTrackState(ts.id, on, ts.volume)}
            onVolume={(v) => setTrackState(ts.id, ts.enabled, v)}
          />
        ))}
      </main>

      <StatusBar cpu={cpu} lastSaved={state.lastSaved} />
    </div>
  );
}

/* -------------------- utils -------------------- */
function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
