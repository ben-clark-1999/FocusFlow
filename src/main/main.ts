import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const isDev = !app.isPackaged;
let win: BrowserWindow | null = null;

// --- helpers ---
const fromURL = (u: string | URL) =>
  fileURLToPath(typeof u === 'string' ? new URL(u, import.meta.url) : u);

function getUserStatePath() {
  return path.join(app.getPath('userData'), 'ambiently-state.json');
}

function ensureDefaultState(): void {
  const p = getUserStatePath();
  if (!fs.existsSync(p)) {
    const defaultState = {
      theme: 'system',
      masterVolume: 0.8,
      crossfadeSec: 0.8,
      lastSaved: null,
      tracks: [
        { id: 'rain', enabled: false, volume: 0.9 },
        { id: 'fire', enabled: false, volume: 0.8 },
        { id: 'wind', enabled: false, volume: 0.8 },
        { id: 'cafe', enabled: false, volume: 0.7 },
        { id: 'bird', enabled: false, volume: 0.7 }
      ],
      presets: [
        {
          name: 'Focus',
          createdAt: new Date().toISOString(),
          masterVolume: 0.7, crossfadeSec: 0.8,
          tracks: [
            { id: 'rain', enabled: true,  volume: 0.7 },
            { id: 'fire', enabled: false, volume: 0.5 },
            { id: 'wind', enabled: true,  volume: 0.5 },
            { id: 'cafe', enabled: false, volume: 0.4 },
            { id: 'bird', enabled: true,  volume: 0.3 }
          ]
        },
        {
          name: 'Sleep',
          createdAt: new Date().toISOString(),
          masterVolume: 0.5, crossfadeSec: 1.5,
          tracks: [
            { id: 'rain', enabled: true,  volume: 0.5 },
            { id: 'fire', enabled: true,  volume: 0.5 },
            { id: 'wind', enabled: false, volume: 0.3 },
            { id: 'cafe', enabled: false, volume: 0.2 },
            { id: 'bird', enabled: true,  volume: 0.6 }
          ]
        },
        {
          name: 'Cafe Rain',
          createdAt: new Date().toISOString(),
          masterVolume: 0.8, crossfadeSec: 0.8,
          tracks: [
            { id: 'rain', enabled: true,  volume: 0.8 },
            { id: 'fire', enabled: false, volume: 0.2 },
            { id: 'wind', enabled: false, volume: 0.3 },
            { id: 'cafe', enabled: true,  volume: 0.7 },
            { id: 'bird', enabled: false, volume: 0.2 }
          ]
        }
      ]
    };
    fs.writeFileSync(p, JSON.stringify(defaultState, null, 2), 'utf-8');
  }
}

function getLoopsPath() {
  return isDev
    ? path.resolve(process.cwd(), 'assets/loops')
    : path.join(process.resourcesPath, 'loops');
}

// ---- state migration: map any 'brown' -> 'bird' so old saves don't crash ----
function migrateState(state: any): { state: any; changed: boolean } {
  if (!state) return { state, changed: false };
  let changed = false;
  const mapId = (id: string) => {
    if (id === 'brown') {
      changed = true;
      return 'bird';
    }
    return id;
  };
  if (Array.isArray(state.tracks)) {
    state.tracks = state.tracks.map((t: any) => ({ ...t, id: mapId(t.id) }));
  }
  if (Array.isArray(state.presets)) {
    state.presets = state.presets.map((p: any) => ({
      ...p,
      tracks: Array.isArray(p.tracks)
        ? p.tracks.map((t: any) => ({ ...t, id: mapId(t.id) }))
        : p.tracks
    }));
  }
  return { state, changed };
}

function createWindow() {
  // Use a CommonJS wrapper to load the ESM preload (prevents ERR_REQUIRE_ESM)
  const preloadWrapperPath = fromURL('./preload-wrapper.cjs');
  const prodIndexUrl = new URL('../renderer/index.html', import.meta.url).toString();

  win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#111111',
    webPreferences: {
      preload: preloadWrapperPath, // wrapper, not preload.js directly
      sandbox: false
    }
  });

  const indexURL = isDev ? 'http://localhost:5173' : prodIndexUrl;
  win.loadURL(indexURL);
  win.once('ready-to-show', () => win?.show());

  // Hotkeys
  app.whenReady().then(() => {
    globalShortcut.register('CommandOrControl+Shift+Space', () => {
      win?.webContents.send('hotkey:toggleAll');
    });
    globalShortcut.register('CommandOrControl+Shift+Right', () => {
      win?.webContents.send('hotkey:nextPreset');
    });
  });
}

app.whenReady().then(() => {
  ensureDefaultState();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  setInterval(() => {
    const cpu = process.getCPUUsage();
    win?.webContents.send('cpu', { percent: Math.round((cpu.percentCPUUsage || 0) * 100) / 100 });
  }, 2000);
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});

// ---------------------- IPC ----------------------
ipcMain.handle('state:load', async () => {
  try {
    const p = getUserStatePath();
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const { state, changed } = migrateState(raw);
    if (changed) {
      fs.writeFileSync(p, JSON.stringify(state, null, 2), 'utf-8');
    }
    return state;
  } catch {
    return null;
  }
});

ipcMain.handle('state:save', async (_e, state) => {
  const p = getUserStatePath();
  const next = { ...state, lastSaved: new Date().toISOString() };
  fs.writeFileSync(p, JSON.stringify(next, null, 2), 'utf-8');
  return next;
});

ipcMain.handle('loops:list', async () => {
  const base = getLoopsPath();
  const files = fs.existsSync(base) ? fs.readdirSync(base) : [];
  return files.filter(f => /\.(wav|mp3|ogg)$/i.test(f)).map(f => path.join(base, f));
});

ipcMain.handle('file:read', async (_e, absPath: string) => {
  return fs.readFileSync(absPath).buffer;
});
