import React from 'react';

type Props = {
  masterVolume: number;
  crossfade: number;
  onMaster: (v: number) => void;
  onCrossfade: (v: number) => void;
  onPlayPauseAll: () => void;
  onStopAll: () => void;
  onSave: () => void;
};

export default function MasterControls({
  masterVolume,
  crossfade,
  onMaster,
  onCrossfade,
  onPlayPauseAll,
  onStopAll,
  onSave,
}: Props) {
  return (
    <section className="card controls-card">
      <header className="card__header">
        <h2 className="card__title">Controls</h2>
      </header>

      {/* Master volume */}
      <label className="ff-slider">
        <span className="slider__label">Master Volume</span>
        <input
          className="ff-range"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={masterVolume}
          // Keep filled gradient in sync
          style={{ ['--val' as any]: masterVolume }}
          // Live updates while dragging
          onInput={(e) => onMaster(Number((e.target as HTMLInputElement).value))}
          // Redundant: some browsers only fire change on mouseup
          onChange={(e) => onMaster(Number((e.target as HTMLInputElement).value))}
          aria-label="Master volume"
        />
      </label>

      {/* Crossfade */}
      <label className="ff-slider">
        <span className="slider__label">Crossfade (seconds)</span>
        <input
          className="ff-range"
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={crossfade}
          style={{ ['--val' as any]: crossfade / 2 }}
          onInput={(e) => onCrossfade(Number((e.target as HTMLInputElement).value))}
          onChange={(e) => onCrossfade(Number((e.target as HTMLInputElement).value))}
          aria-label="Crossfade duration"
        />
      </label>

      <div className="btn-row">
        <button className="btn" onClick={onPlayPauseAll}>
          Play / Pause All
        </button>
        <button className="btn" onClick={onStopAll}>
          Stop All
        </button>
        <button className="btn ghost" onClick={onSave}>
          Save Session
        </button>
      </div>
    </section>
  );
}
