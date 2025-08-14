import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('ambientAPI', {
    loadState: () => ipcRenderer.invoke('state:load'),
    saveState: (state) => ipcRenderer.invoke('state:save', state),
    listLoopFiles: () => ipcRenderer.invoke('loops:list'),
    readFileArrayBuffer: (absPath) => ipcRenderer.invoke('file:read', absPath),
    onCpu: (cb) => ipcRenderer.on('cpu', (_e, cpu) => cb(cpu)),
    onHotkeyToggleAll: (cb) => ipcRenderer.on('hotkey:toggleAll', cb),
    onHotkeyNextPreset: (cb) => ipcRenderer.on('hotkey:nextPreset', cb)
});
