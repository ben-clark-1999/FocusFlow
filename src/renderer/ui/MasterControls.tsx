import React from 'react';

export default function MasterControls({
  masterVolume, crossfade,
  onMaster, onCrossfade, onPlayPauseAll, onStopAll, onSave
}: {
  masterVolume: number; crossfade: number;
  onMaster: (v: number) => void; onCrossfade: (v: number) => void;
  onPlayPauseAll: () => void; onStopAll: () => void; onSave: () => void;
}) {
  return (
    <div className="mc">
      <div className="mc__left">
        <button className="btn primary" onClick={onPlayPauseAll}>Play / Pause All</button>
        <button className="btn" onClick={onStopAll}>Stop</button>
        <button className="btn ghost" onClick={onSave} title="Save session">Save</button>
      </div>
      <div className="mc__sliders">
        <label className="slider compact">
          <span>Master</span>
          <input type="range" min={0} max={1} step={0.01} value={masterVolume} onChange={e => onMaster(Number(e.target.value))} />
        </label>
        <label className="slider compact">
          <span>Crossfade</span>
          <input type="range" min={0} max={2} step={0.1} value={crossfade} onChange={e => onCrossfade(Number(e.target.value))} />
        </label>
      </div>
    </div>
  );
}
