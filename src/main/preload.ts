import { contextBridge, ipcRenderer } from 'electron';
import type { AppState, CpuUsage } from '../shared/types';

contextBridge.exposeInMainWorld('ambientAPI', {
  loadState: (): Promise<AppState | null> => ipcRenderer.invoke('state:load'),
  saveState: (state: AppState): Promise<AppState> => ipcRenderer.invoke('state:save', state),
  listLoopFiles: (): Promise<string[]> => ipcRenderer.invoke('loops:list'),
  readFileArrayBuffer: (absPath: string): Promise<ArrayBuffer> => ipcRenderer.invoke('file:read', absPath),
  onCpu: (cb: (cpu: CpuUsage) => void) => ipcRenderer.on('cpu', (_e, cpu) => cb(cpu)),
  onHotkeyToggleAll: (cb: () => void) => ipcRenderer.on('hotkey:toggleAll', cb),
  onHotkeyNextPreset: (cb: () => void) => ipcRenderer.on('hotkey:nextPreset', cb)
});

declare global {
  interface Window {
    ambientAPI: {
      loadState(): Promise<AppState | null>;
      saveState(state: AppState): Promise<AppState>;
      listLoopFiles(): Promise<string[]>;
      readFileArrayBuffer(absPath: string): Promise<ArrayBuffer>;
      onCpu(cb: (cpu: CpuUsage) => void): void;
      onHotkeyToggleAll(cb: () => void): void;
      onHotkeyNextPreset(cb: () => void): void;
    };
  }
}
