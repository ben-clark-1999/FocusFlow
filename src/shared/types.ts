export type TrackId = 'rain' | 'fire' | 'wind' | 'cafe' | 'bird';

export interface TrackMeta {
  id: string;
  name: string;
  fileName: string;
  icon: string;
  defaultVolume: number;
  key: string;
}

export interface TrackState {
  id: string;
  enabled: boolean;
  volume: number;
}

export interface Preset {
  name: string;
  createdAt: string;
  masterVolume: number;
  crossfadeSec: number;
  tracks: TrackState[];
}

export interface AppState {
  theme: 'light' | 'dark' | 'system';
  masterVolume: number;
  crossfadeSec: number;
  lastSaved: string | null;
  tracks: TrackState[];
  presets: Preset[];
}

export interface CpuUsage {
  percent: number; // 0..100
}

export interface FocusFlow {
  loadState(): Promise<AppState | null>;
  saveState(state: AppState): Promise<AppState>;
  listLoopFiles(): Promise<string[]>;
  readFileArrayBuffer(absPath: string): Promise<ArrayBuffer>;
  onCpu(cb: (cpu: CpuUsage) => void): void;
  onHotkeyToggleAll(cb: () => void): void;
  onHotkeyNextPreset(cb: () => void): void;
}

declare global {
  interface Window {
    FocusFlow: FocusFlow;
  }
}
export {};

