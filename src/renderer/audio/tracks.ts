import type { TrackMeta } from '../../shared/types';

export const TRACKS: TrackMeta[] = [
  { id: 'rain',  name: 'Rain',  fileName: 'rain.wav',  icon: '../../assets/icons/rain.svg',  defaultVolume: 0.9, key: '1' },
  { id: 'fire',  name: 'Fire',  fileName: 'fire.wav',  icon: '../../assets/icons/fire.svg',  defaultVolume: 0.8, key: '2' },
  { id: 'wind',  name: 'Wind',  fileName: 'wind.wav',  icon: '../../assets/icons/wind.svg',  defaultVolume: 0.8, key: '3' },
  { id: 'cafe',  name: 'Cafe',  fileName: 'cafe.wav',  icon: '../../assets/icons/cafe.svg',  defaultVolume: 0.7, key: '4' },
  { id: 'bird',  name: 'Birds', fileName: 'bird.wav',  icon: '../../assets/icons/noise.svg', defaultVolume: 0.7, key: '5' }
];
