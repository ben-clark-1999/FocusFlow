import React, { useEffect, useMemo, useRef, useState } from 'react';
import SoundCard from './SoundCard';
import MasterControls from './MasterControls';
import PresetsBar from './PresetsBar';
import StatusBar from './StatusBar';
import AmbientDecor from './AmbientDecor';
import Hero from './Hero';
import Waterline from './Waterline';

import { AudioEngine } from '../audio/engine';
import { TRACKS } from '../audio/tracks';

import type { AppState, Preset, TrackState, FocusFlow } from '../../shared/types';

/* ---------- defaults ---------- */
const DEFAULT_STATE: AppState = {
  theme: 'dark',                 // default theme (no “system”)
  masterVolume: 0.8,
  crossfadeSec: 0.8,
  lastSaved: null,
  // All tracks OFF at startup
  tracks: TRACKS.map(t => ({ id: t.id, enabled: false, volume: t.defaultVolume })),
  presets: []
} as any;

/* ---------- globals ---------- */
declare global {
  interface Window { FocusFlow: FocusFlow; }
}
const loopUrl = (fileName: string) =>
  new URL(`../../../assets/loops/${fileName}`, import.meta.url).href;

/* ---------- app ---------- */
export default function App() {
  const engineRef = useRef<AudioEngine | null>(null);
  const htmlAudioRef = useRef<Record<string, HTMLAudioElement>>({});
  const usingFallbackRef = useRef(false);

  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  // Theme options (no “system”)
  // type ThemeKey = 'dark' | 'dark-soft' | 'light' | 'light-warm';
  type ThemeKey = 'dark' | 'neon-dark' | 'light' | 'light-warm';
  const [theme, setTheme] = useState<ThemeKey>('dark');

  const [cpu, setCpu] = useState(0);
  const didBindResume = useRef(false);

  const trackIndex = useMemo(() => {
    const map = new Map<string, number>();
    state.tracks.forEach((t, i) => map.set(t.id, i));
    return map;
  }, [state.tracks]);

  /* bootstrap */
  useEffect(() => {
    const engine = new AudioEngine();
    engineRef.current = engine;
    (engine as any).setMasterVolume?.(DEFAULT_STATE.masterVolume);
    (engine as any).setCrossfade?.(DEFAULT_STATE.crossfadeSec);

    // Prepare HTMLAudio fallback for each track (always available)
    const fallbackEls: Record<string, HTMLAudioElement> = {};
    for (const t of TRACKS) {
      const el = new Audio(loopUrl(t.fileName));
      el.loop = true;
      el.preload = 'auto';
      el.volume = clamp01(DEFAULT_STATE.masterVolume * t.defaultVolume);
      fallbackEls[t.id] = el;
    }
    htmlAudioRef.current = fallbackEls;

    let cancelled = false;
    (async () => {
      const loaded = (await window.FocusFlow?.loadState?.()) ?? DEFAULT_STATE;
      if (cancelled) return;

      // Coerce theme to one of the supported keys
      const loadedTheme = (loaded as any).theme as ThemeKey;
      setTheme(
        loadedTheme === 'dark' || loadedTheme === 'neon-dark' || loadedTheme === 'light' || loadedTheme === 'light-warm'
          ? loadedTheme
          : 'dark'
      );

      // Start with everything OFF
      const cleared: AppState = {
        ...loaded,
        theme: undefined as any, // UI owns theme now
        tracks: TRACKS.map(t => {
          const prev = loaded.tracks.find(x => x.id === t.id);
          return {
            id: t.id,
            enabled: false,
            volume: prev ? prev.volume : t.defaultVolume
          };
        })
      };

      setState(cleared);

      // Try preload/Electron file list
      let engineLoadedAny = false;
      try {
        const files = await window.FocusFlow?.listLoopFiles?.();
        if (files?.length) {
          for (const t of TRACKS) {
            const match = files.find(f => f.endsWith('/'+t.fileName) || f.endsWith('\\'+t.fileName));
            if (match) { await (engine as any).loadBuffer?.(t.id, match); engineLoadedAny = true; }
          }
        }
      } catch {}

      // Fallback to Vite asset URLs
      if (!engineLoadedAny) {
        for (const t of TRACKS) {
          try { await (engine as any).loadBuffer?.(t.id, loopUrl(t.fileName)); } catch {}
        }
      }

      // Decide if engine can handle playback; else use HTMLAudio
      const e: any = engineRef.current;
      const canPlay = !!(e?.setTrackState || e?.playLoop || e?.playTrack || e?.play || e?.startTrack);
      usingFallbackRef.current = !canPlay;

      // Apply all-off state to audio and stop any fallbacks
      commitAppStateToEngine(cleared);
      Object.values(htmlAudioRef.current).forEach(a => { try { a.pause(); a.currentTime = 0; } catch {} });
    })();

    const iv = window.setInterval(() => {
      const e: any = engineRef.current;
      const c = e?.getCpuUsage?.() ?? e?.getCPU?.() ?? e?.cpu?.();
      if (typeof c === 'number') setCpu(c);
    }, 800);

    return () => {
      cancelled = true; clearInterval(iv);
      try { (engine as any).dispose?.(); } catch {}
      engineRef.current = null;
      Object.values(htmlAudioRef.current).forEach(a => { try { a.pause(); } catch {} });
    };
  }, []);

  /* resume on first gesture (autoplay policy) */
  useEffect(() => {
    if (didBindResume.current) return; didBindResume.current = true;
    const resumeAll = () => {
      const e: any = engineRef.current;
      try { e?.resume?.(); } catch {}
      try { e?.resumeAudio?.(); } catch {}
      try { e?.context?.resume?.(); } catch {}
      window.removeEventListener('pointerdown', resumeAll);
      window.removeEventListener('keydown', resumeAll);
    };
    window.addEventListener('pointerdown', resumeAll, { once: true });
    window.addEventListener('keydown', resumeAll, { once: true });
  }, []);

  /* theming (no “system”: set attribute directly) */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  /* engine helpers */
  function commitTrackToEngine(id: string, enabled: boolean, volume: number) {
    const e: any = engineRef.current;

    // HTMLAudio fallback
    if (!e || usingFallbackRef.current) {
      const a = htmlAudioRef.current[id];
      if (a) {
        a.volume = clamp01(volume * state.masterVolume);
        if (enabled) a.play().catch(()=>{}); else { try { a.pause(); a.currentTime = 0; } catch {} }
      }
      return;
    }

    try { const meta = TRACKS.find(m => m.id === id); if (meta) e?.ensureBuffer?.(id, loopUrl(meta.fileName)); } catch {}
    e?.setTrackVolume?.(id, volume);
    e?.setMasterVolume?.(state.masterVolume);
    e?.setCrossfade?.(state.crossfadeSec);
    if (enabled) {
      e?.setTrackEnabled?.(id, true); e?.unmuteTrack?.(id);
      e?.startTrack?.(id); e?.playLoop?.(id); e?.playTrack?.(id); e?.play?.(id);
    } else {
      e?.setTrackEnabled?.(id, false); e?.muteTrack?.(id);
      e?.stopTrack?.(id); e?.stopLoop?.(id); e?.pauseTrack?.(id); e?.stop?.(id);
    }
    e?.setTrackState?.(id, enabled, volume);
  }

  function commitAppStateToEngine(next: AppState) {
    const e: any = engineRef.current;
    for (const t of next.tracks) {
      const a = htmlAudioRef.current[t.id];
      if (a) a.volume = clamp01(t.volume * next.masterVolume);
    }
    if (!e || usingFallbackRef.current) return;
    e?.setMasterVolume?.(next.masterVolume);
    e?.setCrossfade?.(next.crossfadeSec);
    for (const t of next.tracks) commitTrackToEngine(t.id, t.enabled, t.volume);
  }

  /* UI actions */
  function setTrackState(id: string, enabled: boolean, volume: number) {
    setState(prev => ({ ...prev, tracks: prev.tracks.map(t => t.id === id ? { ...t, enabled, volume } : t)}));
    queueMicrotask(() => commitTrackToEngine(id, enabled, volume));
  }
  function toggleTrack(id: string) {
    let nextEnabled=false, vol=0;
    setState(prev => {
      const idx = prev.tracks.findIndex(t => t.id === id); if (idx === -1) return prev;
      const cur = prev.tracks[idx]; nextEnabled = !cur.enabled; vol = cur.volume;
      const copy = prev.tracks.slice(); copy[idx] = { ...cur, enabled: nextEnabled }; return { ...prev, tracks: copy };
    });
    queueMicrotask(() => commitTrackToEngine(id, nextEnabled, vol));
  }
  function setMasterVolume(v: number) {
    setState(prev => ({ ...prev, masterVolume: v }));
    queueMicrotask(() => {
      for (const t of state.tracks){ const a = htmlAudioRef.current[t.id]; if (a) a.volume = clamp01(t.volume * v); }
      (engineRef.current as any)?.setMasterVolume?.(v);
    });
  }
  function setCrossfade(v: number) { setState(prev => ({ ...prev, crossfadeSec: v })); queueMicrotask(() => (engineRef.current as any)?.setCrossfade?.(v)); }
  function applyPreset(p: Preset) {
    setState(prev => ({ ...prev, masterVolume: p.masterVolume, crossfadeSec: p.crossfadeSec, tracks: p.tracks.map(t=>({...t})) }));
    queueMicrotask(() => {
      for (const t of p.tracks){ const a = htmlAudioRef.current[t.id]; if (a) a.volume = clamp01(t.volume * p.masterVolume); }
      const e: any = engineRef.current; e?.setMasterVolume?.(p.masterVolume); e?.setCrossfade?.(p.crossfadeSec);
      for (const t of p.tracks) commitTrackToEngine(t.id, t.enabled, t.volume);
    });
  }
  function savePreset(name: string, overwrite: boolean) {
    setState(prev => {
      const i = prev.presets.findIndex(p => p.name === name);
      const snapshot: Preset = { name, masterVolume: prev.masterVolume, crossfadeSec: prev.crossfadeSec, tracks: prev.tracks.map(t=>({...t})) } as any;
      let arr = prev.presets.slice();
      if (i >= 0 && overwrite) arr[i] = snapshot; else if (i === -1) arr.push(snapshot);
      const next = { ...prev, presets: arr, lastSaved: new Date().toISOString() };
      queueMicrotask(() => window.FocusFlow?.saveState?.(next).catch(()=>{}));
      return next;
    });
  }
  function loadPreset(name: string) { const p = state.presets.find(x=>x.name===name); if (p) applyPreset(p); }
  function deletePreset(name: string) { setState(prev => ({ ...prev, presets: prev.presets.filter(p => p.name !== name) })); }
  function onPlayPauseAll() {
    const e: any = engineRef.current;
    if (usingFallbackRef.current || !e?.playPauseAll) {
      const anyPlaying = Object.values(htmlAudioRef.current).some(a => !a.paused);
      if (anyPlaying) Object.values(htmlAudioRef.current).forEach(a=>{ try{ a.pause(); }catch{} });
      else state.tracks.forEach(t => { if (t.enabled) htmlAudioRef.current[t.id]?.play().catch(()=>{}); });
    } else { e.playPauseAll?.(); e.toggleAll?.(); }
  }
  function onStopAll() { const e:any = engineRef.current; Object.values(htmlAudioRef.current).forEach(a=>{ try{ a.pause(); a.currentTime=0; }catch{} }); e?.stopAll?.(); e?.stop?.(); }
  function onSaveSession() { const snap = { ...state, lastSaved: new Date().toISOString() }; setState(snap); window.FocusFlow?.saveState?.(snap).catch(()=>{}); }

  /* shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return; const n = Number(e.key);
      if (n>=1 && n<=TRACKS.length) toggleTrack(TRACKS[n-1].id);
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);

  const withState = useMemo(() => {
    const map = new Map(state.tracks.map<[string, TrackState]>(t => [t.id, t]));
    return TRACKS.map(meta => ({ meta, ts: map.get(meta.id)! }));
  }, [state.tracks]);

  const scrollToMixer = () => {
    const el = document.getElementById('mixer'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app">
      <AmbientDecor />

      {/* HERO */}
      <Hero onStart={scrollToMixer} />

      {/* Theme dropdown (no “system”) */}
      <div className="theme-select">
        <label htmlFor="theme" className="visually-hidden">Theme</label>
        <select
          id="theme"
          className="ff-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value as ThemeKey)}
          aria-label="Theme"
        >
          <option value="dark">Dark</option>
          <option value="neon-dark">Neon Dark</option>   {/* renamed */}
          <option value="light">Light</option>
          <option value="light-warm">Light – Warm</option>
        </select>

      </div>

      {/* MIXER */}
      <section id="mixer" className="mixer">
        <MasterControls
          masterVolume={state.masterVolume}
          crossfade={state.crossfadeSec}
          onMaster={setMasterVolume}
          onCrossfade={setCrossfade}
          onPlayPauseAll={onPlayPauseAll}
          onStopAll={onStopAll}
          onSave={onSaveSession}
        />

        <PresetsBar presets={state.presets} onSave={savePreset} onLoad={loadPreset} onDelete={deletePreset} />

        <main className="grid">
          {withState.map(({ meta, ts }) => (
            <SoundCard
              key={meta.id}
              meta={meta}
              state={ts}
              getRemaining={() => null}
              onToggle={(on) => setTrackState(ts.id, on, ts.volume)}
              onVolume={(v) => setTrackState(ts.id, ts.enabled, v)}
            />
          ))}
        </main>
      </section>

      <Waterline />
      <StatusBar cpu={cpu} lastSaved={state.lastSaved} />
    </div>
  );
}

function clamp01(x:number){ return Math.max(0, Math.min(1, x)); }
