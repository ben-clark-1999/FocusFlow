import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AudioEngine } from '../audio/engine';
import type { AppState, Preset } from '../../shared/types';
import SoundCard from './SoundCard';
import MasterControls from './MasterControls';
import PresetsBar from './PresetsBar';
import StatusBar from './StatusBar';
import { TRACKS } from '../audio/tracks';

const DEFAULT_STATE: AppState = {
  theme: 'system',
  masterVolume: 0.8,
  crossfadeSec: 0.8,
  lastSaved: null,
  tracks: TRACKS.map(t => ({ id: t.id, enabled: false, volume: t.defaultVolume })),
  presets: []
};

export default function App() {
  const engineRef = useRef<AudioEngine | null>(null);
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [cpu, setCpu] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!('ambientAPI' in window)) return;
    const engine = new AudioEngine();
    engineRef.current = engine;
    engine.setTracks(TRACKS);
    engine.setMasterVolume(DEFAULT_STATE.masterVolume);
    engine.setCrossfade(DEFAULT_STATE.crossfadeSec);

    let cancelled = false;
    (async () => {
      const saved = (await window.ambientAPI.loadState()) ?? DEFAULT_STATE;
      if (cancelled) return;
      setTheme(saved.theme);
      setState(saved);

      const files = await window.ambientAPI.listLoopFiles();
      for (const t of TRACKS) {
        const match = files.find(f => f.endsWith('/' + t.fileName) || f.endsWith('\\' + t.fileName));
        if (match) { try { await engine.loadBuffer(t.id, match); } catch (e) { console.warn('decode', t.id, e);} }
      }

      engine.setMasterVolume(saved.masterVolume);
      engine.setCrossfade(saved.crossfadeSec);
      engine.applyState(saved.tracks);
      if (!cancelled) setReady(true);
    })();

    window.ambientAPI.onCpu(({ percent }) => setCpu(percent));
    window.ambientAPI.onHotkeyToggleAll(() => onToggleAll());
    window.ambientAPI.onHotkeyNextPreset(() => nextPreset());

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  async function setTrackState(id: string, enabled: boolean, volume: number) {
    const engine = engineRef.current; if (!engine) return;
    await engine.resumeIfSuspended();
    engine.setCrossfade(state.crossfadeSec);
    await engine.setTrack(id, enabled, volume);
    setState(s => ({ ...s, tracks: s.tracks.map(t => t.id === id ? { ...t, enabled, volume } : t) }));
  }
  async function onToggleAll() {
    const engine = engineRef.current; if (!engine) return;
    await engine.resumeIfSuspended();
    engine.toggleAll(state.tracks);
    const anyOn = state.tracks.some(t => t.enabled);
    setState(s => ({ ...s, tracks: s.tracks.map(t => ({ ...t, enabled: !anyOn })) }));
  }
  function stopAll() {
    engineRef.current?.stopAll(state.tracks);
    setState(s => ({ ...s, tracks: s.tracks.map(t => ({ ...t, enabled: false })) }));
  }
  function saveStateToDisk(next: AppState | null = null) {
    const payload = next ?? state;
    window.ambientAPI.saveState(payload).then(saved => setState(saved));
  }
  function savePreset(name: string, overwrite: boolean) {
    const base: Preset = {
      name,
      createdAt: new Date().toISOString(),
      masterVolume: state.masterVolume,
      crossfadeSec: state.crossfadeSec,
      tracks: state.tracks.map(t => ({ ...t }))
    };
    setState(s => {
      const others = overwrite ? s.presets.filter(p => p.name !== name) : s.presets;
      const next = { ...s, presets: [...others, base], lastSaved: new Date().toISOString() };
      window.ambientAPI.saveState(next); return next;
    });
  }
  function loadPreset(name: string) {
    const p = state.presets.find(x => x.name === name); if (!p || !engineRef.current) return;
    const engine = engineRef.current;
    engine.setMasterVolume(p.masterVolume); engine.setCrossfade(p.crossfadeSec);
    engine.applyState(p.tracks);
    setState(s => ({ ...s, masterVolume: p.masterVolume, crossfadeSec: p.crossfadeSec, tracks: p.tracks.map(t => ({ ...t })) }));
  }
  function deletePreset(name: string) {
    setState(s => { const next = { ...s, presets: s.presets.filter(p => p.name !== name) }; window.ambientAPI.saveState(next); return next; });
  }
  function nextPreset() { if (state.presets.length) loadPreset(state.presets[0].name); }

  const visible = useMemo(() => {
    const pool = focusMode ? state.tracks.filter(t => t.enabled) : state.tracks;
    return pool.map(ts => ({ ts, meta: TRACKS.find(m => m.id === ts.id) })).filter(p => !!p.meta) as any[];
  }, [state.tracks, focusMode]);

  return (
    <div className="shell">
      <header className="appbar">
        <div className="brand">
          <div className="logo-dot" aria-hidden="true" />
          <span>Ambiently</span>
        </div>
        <div className="actions">
          <select
            aria-label="Theme"
            value={theme}
            onChange={(e) => { const next = e.target.value as any; setTheme(next); saveStateToDisk({ ...state, theme: next }); }}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <button className="btn ghost" onClick={() => setFocusMode(f => !f)} aria-pressed={focusMode}>
            {focusMode ? 'Exit Focus' : 'Focus Mode'}
          </button>
        </div>
      </header>

      <section className="section">
        <PresetsBar presets={state.presets} onSave={savePreset} onLoad={loadPreset} onDelete={deletePreset} />
      </section>

      {!ready && <div className="loading">Loading audio…</div>}

      <main className="grid">
        {visible.map(({ meta, ts }) => (
          <SoundCard
            key={meta.id}
            meta={meta}
            state={ts}
            getRemaining={() => engineRef.current?.getLoopTimeRemaining(ts.id) ?? null}
            onToggle={(on) => setTrackState(ts.id, on, ts.volume)}
            onVolume={(v) => setTrackState(ts.id, ts.enabled, v)}
          />
        ))}
      </main>

      <div className="dock">
        <MasterControls
          masterVolume={state.masterVolume}
          crossfade={state.crossfadeSec}
          onMaster={(v) => { engineRef.current?.setMasterVolume(v); setState(s => ({ ...s, masterVolume: v })); }}
          onCrossfade={(v) => { engineRef.current?.setCrossfade(v); setState(s => ({ ...s, crossfadeSec: v })); }}
          onPlayPauseAll={onToggleAll}
          onStopAll={stopAll}
          onSave={() => saveStateToDisk()}
        />
      </div>

      <StatusBar cpu={cpu} lastSaved={state.lastSaved} />
    </div>
  );
}
