// icons.tsx — central place to resolve icon asset URLs
// (works in Vite/Electron because import.meta.url is the current module URL)

export type IconId =
  | 'rain' | 'fire' | 'wind' | 'cafe' | 'bird'
  | 'thunder' | 'river' | 'ocean' | 'night';

export const ICONS: Record<IconId, string> = {
  rain:     new URL('../../../assets/icons/rain.png',     import.meta.url).href,
  fire:     new URL('../../../assets/icons/fire.png',     import.meta.url).href,
  wind:     new URL('../../../assets/icons/wind.png',     import.meta.url).href,
  cafe:     new URL('../../../assets/icons/cafe.png',     import.meta.url).href,
  bird:     new URL('../../../assets/icons/bird.png',     import.meta.url).href,

  // NEW
  thunder:  new URL('../../../assets/icons/thunder.png',  import.meta.url).href,
  river:    new URL('../../../assets/icons/river.png',    import.meta.url).href,
  ocean:    new URL('../../../assets/icons/ocean.png',    import.meta.url).href,
  night:    new URL('../../../assets/icons/night.png',    import.meta.url).href,
};
