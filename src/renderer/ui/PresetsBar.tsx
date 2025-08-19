import React, { useMemo, useState } from 'react';
import type { Preset } from '../../shared/types';

export default function PresetsBar({
  presets,
  onSave,
  onLoad,
  onDelete,
}: {
  presets: Preset[];
  onSave: (name: string, overwrite: boolean) => void;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const hasName = name.trim().length > 0;
  const names = useMemo(() => presets.map(p => p.name), [presets]);

  const save = () => {
    if (!hasName) return;
    // Always overwrite if name exists
    const exists = names.includes(name.trim());
    onSave(name.trim(), exists ? true : false);
    setName('');
  };

  return (
    <section className="card presets-card" aria-labelledby="presets-title">
      <h2 id="presets-title" className="card__title">Presets</h2>
      <div className="presets-bar">
        <div className="field">
          <label htmlFor="presetSelect" className="visually-hidden">Select preset</label>
          <select
            id="presetSelect"
            className="ff-select"
            defaultValue=""
            onChange={(e)=> e.target.value && onLoad(e.target.value)}
          >
            <option value="" disabled>Select…</option>
            {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>

        <button
          className="btn"
          type="button"
          onClick={() => {
            const select = document.getElementById('presetSelect') as HTMLSelectElement | null;
            const val = select?.value;
            if (val) onDelete(val);
          }}
        >
          Delete
        </button>

        <div className="field grow">
          <label htmlFor="presetName" className="visually-hidden">Preset name</label>
          <input
            id="presetName"
            className="ff-input"
            placeholder="Preset name"
            value={name}
            onChange={(e)=> setName(e.target.value)}
          />
        </div>

        <button className="btn" type="button" onClick={save} disabled={!hasName}>Save</button>
      </div>
    </section>
  );
}
