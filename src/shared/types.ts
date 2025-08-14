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

export interface AmbientAPI {
  loadState(): Promise<AppState | null>;
  saveState(state: AppState): Promise<AppState>;
  listLoopFiles(): Promise<string[]>;
  onCpu(callback: (data: CpuUsage) => void): void;
  onHotkeyToggleAll(callback: () => void): void;
  onHotkeyNextPreset(callback: () => void): void;
}

declare global {
  interface Window {
    ambientAPI: AmbientAPI;
  }
}
