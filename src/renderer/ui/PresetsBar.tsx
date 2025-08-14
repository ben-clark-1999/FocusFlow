import React, { useMemo, useState } from 'react';
import type { Preset } from '../../shared/types';

export default function PresetsBar({
  presets, onSave, onLoad, onDelete
}: {
  presets: Preset[];
  onSave: (name: string, overwrite: boolean) => void;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
}) {
  const [sel, setSel] = useState<string>('');
  const [name, setName] = useState('');
  const exists = useMemo(() => presets.some(p => p.name === name), [presets, name]);

  return (
    <div className="presets">
      <div className="row">
        <label className="select">
          <span>Presets</span>
          <select value={sel} onChange={e => setSel(e.target.value)} aria-label="Presets">
            <option value="">Select…</option>
            {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </label>
        <button className="btn" disabled={!sel} onClick={() => onLoad(sel)}>Load</button>
        <button className="btn danger" disabled={!sel} onClick={() => { onDelete(sel); setSel(''); }}>Delete</button>
      </div>

      <div className="row">
        <input className="input" placeholder="Preset name" value={name} onChange={e => setName(e.target.value)} />
        <button className="btn primary" disabled={!name} onClick={() => onSave(name, false)}>Save</button>
        <button className="btn" disabled={!exists} onClick={() => onSave(name, true)}>Overwrite</button>
      </div>
    </div>
  );
}
