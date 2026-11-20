// The five colour grades. Each grade is a sunset-or-neon treatment applied
// over every panel: a top-to-bottom gradient wash, a screen tint, and the
// accent colour used for the subtitle and the selected-panel outline.
// All colours are the app's own; no Rockstar artwork or palette is copied.
export const GRADES = {
  sunset: {
    label: 'Sunset',
    top: '#ff9a3d',
    bottom: '#e83e8c',
    wash: 'rgba(255, 110, 90, 0.20)',
    accent: '#ffd166',
    sun: true,
  },
  neon: {
    label: 'Neon Night',
    top: '#ff2e88',
    bottom: '#00c8ff',
    wash: 'rgba(140, 40, 255, 0.22)',
    accent: '#00e5ff',
    sun: false,
  },
  gold: {
    label: 'Vice Gold',
    top: '#f7b733',
    bottom: '#8a4b0f',
    wash: 'rgba(255, 190, 60, 0.16)',
    accent: '#fff3c4',
    sun: true,
  },
  noir: {
    label: 'Mono Noir',
    top: '#8a8a8a',
    bottom: '#111111',
    wash: 'rgba(0, 0, 0, 0.28)',
    accent: '#ffffff',
    sun: false,
    mono: true,
  },
  haze: {
    label: 'Palm Haze',
    top: '#a8d8ea',
    bottom: '#f7a8b8',
    wash: 'rgba(255, 255, 255, 0.12)',
    accent: '#ff8fa3',
    sun: true,
  },
};

/** The six panel layouts, each a function of (w, h) returning panel rects. */
export const LAYOUTS = {
  hero: {
    label: 'Hero + 3',
    panels(w, h) {
      return [
        { x: 0, y: 0, w, h: h * 0.6 },
        { x: 0, y: h * 0.6, w: w / 3, h: h * 0.4 },
        { x: w / 3, y: h * 0.6, w: w / 3, h: h * 0.4 },
        { x: (2 * w) / 3, y: h * 0.6, w: w / 3, h: h * 0.4 },
      ];
    },
  },
  grid: {
    label: 'Four-panel grid',
    panels(w, h) {
      return [
        { x: 0, y: 0, w: w / 2, h: h / 2 },
        { x: w / 2, y: 0, w: w / 2, h: h / 2 },
        { x: 0, y: h / 2, w: w / 2, h: h / 2 },
        { x: w / 2, y: h / 2, w: w / 2, h: h / 2 },
      ];
    },
  },
  full: {
    label: 'Full bleed',
    panels(w, h) {
      return [{ x: 0, y: 0, w, h }];
    },
  },
  triptych: {
    label: 'Triptych',
    panels(w, h) {
      return [
        { x: 0, y: 0, w: w / 3, h },
        { x: w / 3, y: 0, w: w / 3, h },
        { x: (2 * w) / 3, y: 0, w: w / 3, h },
      ];
    },
  },
  split: {
    label: 'Split',
    panels(w, h) {
      return [
        { x: 0, y: 0, w: w * 0.58, h },
        { x: w * 0.58, y: 0, w: w * 0.42, h },
      ];
    },
  },
  story: {
    label: 'Story strip',
    panels(w, h) {
      return [
        { x: 0, y: 0, w, h: h * 0.52 },
        { x: 0, y: h * 0.52, w, h: h * 0.48 },
      ];
    },
  },
};

/** Fresh default state for a new cover. */
export function defaultState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    title: 'NEON COAST',
    subtitle: 'a Vice City story',
    titlePos: 'bottom',
    titleScale: 1,
    frame: true,
    grain: true,
    vignette: true,
    sun: true,
    palms: true,
    panels: [
      { photo: 0, zoom: 1, ox: 0, oy: 0 },
      { photo: 1, zoom: 1, ox: 0, oy: 0 },
      { photo: 0, zoom: 1, ox: 0, oy: 0 },
      { photo: 1, zoom: 1, ox: 0, oy: 0 },
    ],
  };
}
