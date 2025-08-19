// src/renderer/audio/tracks.ts
import type { TrackMeta } from '../../shared/types';

export const TRACKS: TrackMeta[] = [
  { id: 'rain',    name: 'Rain',    fileName: 'rain.wav',    icon: 'rain',    defaultVolume: 0.9, key: '1' },
  { id: 'fire',    name: 'Fire',    fileName: 'fire.wav',    icon: 'fire',    defaultVolume: 0.8, key: '2' },
  { id: 'wind',    name: 'Wind',    fileName: 'wind.wav',    icon: 'wind',    defaultVolume: 0.8, key: '3' },
  { id: 'cafe',    name: 'Cafe',    fileName: 'cafe.wav',    icon: 'cafe',    defaultVolume: 0.7, key: '4' },
  { id: 'bird',    name: 'Birds',   fileName: 'bird.wav',    icon: 'bird',    defaultVolume: 0.7, key: '5' },

  // NEW
  { id: 'thunder', name: 'Thunder', fileName: 'thunder.wav', icon: 'thunder', defaultVolume: 0.8, key: '6' },
  { id: 'river',   name: 'River',   fileName: 'river.wav',   icon: 'river',   defaultVolume: 0.7, key: '7' },
  { id: 'ocean',   name: 'Ocean',   fileName: 'ocean.wav',   icon: 'ocean',   defaultVolume: 0.8, key: '8' },
  { id: 'night',   name: 'Night',   fileName: 'night.wav',   icon: 'night',   defaultVolume: 0.6, key: '9' },
];
