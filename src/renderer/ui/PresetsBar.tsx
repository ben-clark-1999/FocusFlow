import React, { useMemo, useState } from 'react';
import type { Preset } from '../../shared/types';

type Props = {
  presets: Preset[];
  onSave: (name: string, overwrite: boolean) => void;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
};

export default function PresetsBar({ presets, onSave, onLoad, onDelete }: Props) {
  const [name, setName] = useState('');
  const [overwrite, setOverwrite] = useState(false);

  const options = useMemo(
    () => presets.map(p => ({ label: p.name, value: p.name })),
    [presets]
  );

  return (
    <section className="card presets-card">
      <header className="card__header">
        <h2 className="card__title">Presets</h2>
      </header>

      <div className="presets-bar">
        {/* Select preset */}
        <div className="field">
          <label className="visually-hidden" htmlFor="preset-select">Select preset</label>
          <select
            id="preset-select"
            className="ff-select"
            aria-label="Select preset"
            onChange={(e) => {
              const v = e.target.value;
              if (v) onLoad(v);
            }}
            defaultValue=""
          >
            <option value="" disabled>Select…</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <button
          className="btn"
          onClick={() => {
            const el = document.getElementById('preset-select') as HTMLSelectElement | null;
            const v = el?.value || '';
            if (v) onDelete(v);
          }}
          aria-label="Delete selected preset"
        >
          Delete
        </button>

        {/* Name + Save */}
        <div className="field grow">
          <label className="visually-hidden" htmlFor="preset-name">Preset name</label>
          <input
            id="preset-name"
            className="ff-input"
            placeholder="Preset name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <button
          className="btn"
          onClick={() => name.trim() && onSave(name.trim(), overwrite)}
        >
          Save
        </button>

        <label className="toggle-chip">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
          />
          <span>Overwrite</span>
        </label>
      </div>
    </section>
  );
}
