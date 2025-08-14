import type { TrackMeta, TrackState } from '../../shared/types';

type Player = {
  source: AudioBufferSourceNode | null;
  gain: GainNode;
  buffer: AudioBuffer | null;
  startedAt: number | null; // context time when (re)started
  inTransition: boolean;
};

export class AudioEngine {
  private ctx: AudioContext;
  private master: GainNode;
  private players = new Map<string, Player>();
  private crossfadeSec = 0.8;
  private tracks: TrackMeta[] = [];
  private running = true;

  constructor() {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.ctx.destination);
  }

  setTracks(tracks: TrackMeta[]) {
    this.tracks = tracks;
    for (const t of tracks) {
      if (!this.players.has(t.id)) {
        const gain = this.ctx.createGain();
        gain.gain.value = 0.0;
        gain.connect(this.master);
        this.players.set(t.id, { source: null, gain, buffer: null, startedAt: null, inTransition: false });
      }
    }
  }

  setCrossfade(sec: number) {
    this.crossfadeSec = Math.max(0, Math.min(2, sec));
  }

  setMasterVolume(v: number) {
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(v, now + 0.05);
  }

  async loadBuffer(id: string, fileAbsPath: string) {
    const bytes = await window.ambientAPI.readFileArrayBuffer(fileAbsPath);
    const buf = await this.ctx.decodeAudioData(bytes.slice(0) as ArrayBuffer);
    const p = this.players.get(id)!;
    p.buffer = buf;
  }

  private createSourceFor(id: string): AudioBufferSourceNode {
    const p = this.players.get(id)!;
    if (!p.buffer) throw new Error(`Buffer missing for ${id}`);
    const src = this.ctx.createBufferSource();
    src.buffer = p.buffer;
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = p.buffer.duration;
    src.connect(p.gain);
    return src;
  }

  async applyState(tracks: TrackState[]) {
    // Quick debounce against heavy flapping
    for (const st of tracks) {
      await this.setTrack(st.id, st.enabled, st.volume);
    }
  }

  async setTrack(id: string, enabled: boolean, volume: number) {
    const p = this.players.get(id)!;
    if (p.inTransition) return;
    p.inTransition = true;

    const now = this.ctx.currentTime;
    p.gain.gain.cancelScheduledValues(now);
    const targetVol = enabled ? volume : 0;

    if (enabled) {
      // If no source, create/start fresh
      if (!p.source) {
        p.source = this.createSourceFor(id);
        p.source.start();
        p.startedAt = now;
      }
      p.gain.gain.setValueAtTime(p.gain.gain.value, now);
      p.gain.gain.linearRampToValueAtTime(targetVol, now + this.crossfadeSec);
    } else {
      // Fade out, then stop and disconnect
      p.gain.gain.setValueAtTime(p.gain.gain.value, now);
      p.gain.gain.linearRampToValueAtTime(0.0, now + this.crossfadeSec);
      const src = p.source;
      if (src) {
        // stop slightly after fade completes
        src.stop(now + this.crossfadeSec + 0.02);
        src.disconnect();
        p.source = null;
        p.startedAt = null;
      }
    }

    // Update ongoing volume changes on enabled tracks
    if (enabled && p.source) {
      // Slight ramp to avoid clicks
      p.gain.gain.linearRampToValueAtTime(volume, now + this.crossfadeSec);
    }

    setTimeout(() => { p.inTransition = false; }, Math.max(60, this.crossfadeSec * 1000 + 40));
  }

  getLoopTimeRemaining(id: string): number | null {
    const p = this.players.get(id)!;
    if (!p.buffer || p.startedAt == null) return null;
    const dur = p.buffer.duration;
    const elapsed = this.ctx.currentTime - p.startedAt;
    const remaining = dur - (elapsed % dur);
    return Math.max(0, remaining);
  }

  async resumeIfSuspended() {
    if (this.ctx.state !== 'running') await this.ctx.resume();
  }

  async toggleAll(tracks: TrackState[]) {
    const anyOn = tracks.some(t => t.enabled);
    for (const t of tracks) {
      await this.setTrack(t.id, !anyOn, t.volume);
    }
  }

  stopAll(tracks: TrackState[]) {
    for (const t of tracks) {
      this.setTrack(t.id, false, t.volume);
    }
  }
}
