import React, { useEffect, useState } from 'react';
import type { TrackMeta, TrackState } from '../../shared/types';
import { TrackIcon } from './icons';

type Props = {
  meta: TrackMeta;
  state: TrackState;
  onToggle: (on: boolean) => void;
  onVolume: (v: number) => void;
  getRemaining: () => number | null;
};

export default function SoundCard({ meta, state, onToggle, onVolume, getRemaining }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const iv = setInterval(() => setRemaining(getRemaining()), 400);
    return () => clearInterval(iv);
  }, [getRemaining]);

  const Icon = TrackIcon[meta.id] ?? TrackIcon.rain;

  return (
    <section className={`card ${state.enabled ? 'card--active' : ''}`} tabIndex={0} aria-label={`${meta.name} card`}>
      <header className="card__header">
        <span className="card__icon-wrap" aria-hidden="true"><Icon className="card__icon" size={26} /></span>
        <h2 className="card__title">{meta.name}</h2>
      </header>

      <button
        className={`btn-toggle ${state.enabled ? 'is-on' : 'is-off'}`}
        onClick={() => onToggle(!state.enabled)}
        aria-pressed={state.enabled}
        title={`Toggle ${meta.name} (key ${meta.key})`}
      >
        {state.enabled ? 'On' : 'Off'}
      </button>

      <label className="slider">
        <span className="slider__label">Volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={state.volume}
          onChange={(e) => onVolume(Number(e.target.value))}
          aria-label={`${meta.name} volume`}
        />
      </label>

      <footer className="card__footer">
        <span className="kbd">Key {meta.key}</span>
        <span className="loop">{remaining != null ? `Loop: ${remaining.toFixed(0)}s` : 'Looping…'}</span>
      </footer>
    </section>
  );
}
