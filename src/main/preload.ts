import { contextBridge, ipcRenderer } from 'electron';
import type { AppState, CpuUsage } from '../shared/types';

contextBridge.exposeInMainWorld('FocusFlow', {
  loadState: (): Promise<AppState | null> => ipcRenderer.invoke('state:load'),
  saveState: (state: AppState): Promise<AppState> => ipcRenderer.invoke('state:save', state),
  listLoopFiles: (): Promise<string[]> => ipcRenderer.invoke('loops:list'),
  readFileArrayBuffer: (absPath: string): Promise<ArrayBuffer> => ipcRenderer.invoke('file:read', absPath),
  onCpu: (cb: (cpu: CpuUsage) => void) => ipcRenderer.on('cpu', (_e, cpu) => cb(cpu)),
  onHotkeyToggleAll: (cb: () => void) => ipcRenderer.on('hotkey:toggleAll', cb),
  onHotkeyNextPreset: (cb: () => void) => ipcRenderer.on('hotkey:nextPreset', cb)
});

