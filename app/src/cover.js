// Draws the cover: multi-panel photo layout, sunset-or-neon grade, white
// poster frame, halftone title band, grain and vignette. Pure canvas 2D,
// no library, deterministic: the same state always paints the same pixels.
import { GRADES, LAYOUTS } from './grades.js';

/** Seeded random, so the grain tile is identical on every run. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let noiseTile = null;
function grainTile() {
  if (noiseTile) return noiseTile;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(128, 128);
  const rnd = mulberry32(20261121);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  noiseTile = tile;
  return tile;
}

/** Panel rects for a cover of w x h, with the white frame and gutters. */
export function coverRects(state, w, h) {
  const g = state.frame ? Math.max(4, Math.round(Math.min(w, h) * 0.014)) : 0;
  const o = g / 2;
  const raw = LAYOUTS[state.layout].panels(w - 2 * o, h - 2 * o);
  return raw.map((r) => ({
    x: r.x + o + g / 2,
    y: r.y + o + g / 2,
    w: r.w - g,
    h: r.h - g,
  }));
}

/** Which panel (if any) contains the point px, py on a w x h cover. */
export function panelAt(state, w, h, px, py) {
  const rects = coverRects(state, w, h);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return i;
  }
  return -1;
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom/pan. */
function drawPanelPhoto(ctx, photo, rect, panel, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!photo) {
    const fill = ctx.createLinearGradient(x, y, x, y + h);
    fill.addColorStop(0, grade.top);
    fill.addColorStop(1, grade.bottom);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  } else {
    const iw = photo.naturalWidth;
    const ih = photo.naturalHeight;
    const scale = Math.max(w / iw, h / ih) * (panel.zoom || 1);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = x + (w - dw) / 2 + (panel.ox || 0) * w;
    const dy = y + (h - dh) / 2 + (panel.oy || 0) * h;
    if (grade.mono) ctx.filter = 'grayscale(1) contrast(1.12) brightness(1.03)';
    ctx.drawImage(photo, dx, dy, dw, dh);
    ctx.filter = 'none';
  }
  const wash = ctx.createLinearGradient(x, y, x, y + h);
  wash.addColorStop(0, grade.top + '00');
  wash.addColorStop(0.55, grade.top + '22');
  wash.addColorStop(1, grade.bottom + '66');
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = grade.wash;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Retro striped sun disc, only where the first panel is wide enough to hold
 *  it as a sky element (the hero and full-bleed layouts). */
function drawSunDisc(ctx, rect, grade) {
  const r = Math.min(rect.w, rect.h) * 0.17;
  const cx = rect.x + rect.w * 0.8;
  const cy = rect.y + rect.h * 0.26;
  const sun = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  sun.addColorStop(0, '#fff7c0');
  sun.addColorStop(0.6, '#ffb347');
  sun.addColorStop(1, '#ff5e3a');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = sun;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = grade.top;
  for (let i = 0; i < 3; i++) {
    const by = cy + r * (0.08 + i * 0.3);
    ctx.fillRect(cx - r, by, r * 2, r * 0.09);
  }
  ctx.restore();
}

/** Two flat palm silhouettes tucked into the first panel's lower corner:
 *  filled tapered trunks and leaf blades, drawn as solid shapes so they
 *  read as poster art rather than linework. */
function drawPalmSilhouettes(ctx, rect) {
  const s = Math.min(rect.w, rect.h);
  const base = rect.y + rect.h;
  const ink = 'rgba(26, 11, 46, 0.92)';
  ctx.save();
  ctx.fillStyle = ink;
  const palm = (bx, ph, lean) => {
    const topX = bx + lean * ph;
    const topY = base - ph;
    const tw = s * 0.014;
    ctx.beginPath();
    ctx.moveTo(bx - tw, base);
    ctx.quadraticCurveTo(bx + lean * ph * 0.35 - tw, base - ph * 0.55, topX - tw * 0.6, topY);
    ctx.lineTo(topX + tw * 0.6, topY);
    ctx.quadraticCurveTo(bx + lean * ph * 0.35 + tw, base - ph * 0.55, bx + tw, base);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * (0.06 + (i / 5) * 0.88);
      const len = ph * (0.36 - Math.abs(i - 2.5) * 0.035);
      const dir = lean < 0 ? -1 : 1;
      const ex = topX + Math.cos(a) * len * dir;
      const ey = topY - Math.sin(a) * len * 0.4 + len * 0.2;
      const mx = topX + Math.cos(a) * len * 0.55 * dir;
      const my = topY - Math.sin(a) * len * 0.55;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(mx, my - len * 0.1, ex, ey);
      ctx.quadraticCurveTo(mx, my + len * 0.08, topX, topY);
      ctx.closePath();
      ctx.fill();
    }
  };
  palm(rect.x + rect.w * 0.08, s * 0.38, 0.14);
  palm(rect.x + rect.w * 0.2, s * 0.27, -0.08);
  ctx.restore();
}

/** Halftone dots along the title band's edge. */
function drawHalftoneDots(ctx, x, y, w, color, r) {
  ctx.save();
  ctx.fillStyle = color;
  const step = Math.max(12, r * 5);
  for (let px = x + step / 2; px < x + w; px += step) {
    ctx.beginPath();
    ctx.arc(px, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The title band: dark gradient, halftone rule, Anton title, script subtitle. */
function drawTitleBand(ctx, state, w, h, grade) {
  const bandH = h * 0.17;
  const by = state.titlePos === 'top' ? 0 : h - bandH;
  const band = ctx.createLinearGradient(0, by, 0, by + bandH);
  if (state.titlePos === 'top') {
    band.addColorStop(0, 'rgba(10, 5, 20, 0.78)');
    band.addColorStop(1, 'rgba(10, 5, 20, 0)');
  } else {
    band.addColorStop(0, 'rgba(10, 5, 20, 0)');
    band.addColorStop(1, 'rgba(10, 5, 20, 0.78)');
  }
  ctx.fillStyle = band;
  ctx.fillRect(0, by, w, bandH);
  const ruleY = state.titlePos === 'top' ? by + bandH - 2 : by + 2;
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, ruleY, w, Math.max(2, h * 0.004));
  drawHalftoneDots(ctx, 0, state.titlePos === 'top' ? by + bandH - h * 0.014 : by + h * 0.014, w, grade.accent, Math.max(2, h * 0.003));

  const title = (state.title || '').trim().toUpperCase();
  const centerY = by + bandH * (state.titlePos === 'top' ? 0.46 : 0.52);
  if (title) {
    let size = h * 0.105 * (state.titleScale || 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.03;
    for (;;) {
      ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
      if (ctx.measureText(title).width <= w * 0.92 || size <= 14) break;
      size -= 2;
    }
    try {
      ctx.letterSpacing = '2px';
    } catch (e) {
      /* older canvas: no letter spacing */
    }
    ctx.fillText(title, w / 2, centerY);
    try {
      ctx.letterSpacing = '0px';
    } catch (e) {
      /* ignore */
    }
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subSize = Math.max(14, h * 0.032 * (state.titleScale || 1));
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = subSize * 0.2;
    ctx.fillText(sub, w / 2, centerY + h * 0.048);
    ctx.shadowBlur = 0;
  }
}

/** Grain + vignette over the whole cover. */
function drawFinish(ctx, w, h, state) {
  if (state.grain) {
    const tile = grainTile();
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (state.vignette) {
    const v = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.42,
      w / 2, h / 2, Math.max(w, h) * 0.75,
    );
    v.addColorStop(0, 'rgba(10, 5, 20, 0)');
    v.addColorStop(1, 'rgba(10, 5, 20, 0.38)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }
}

/**
 * Draws the cover for `state` onto `canvas` (at the canvas's own size).
 * `photos` is an array of images (or nulls); each panel names one by index.
 * `selected` (optional) is a panel index to outline for the editor preview.
 */
export function drawCover(canvas, photos, state, selected = -1) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const rects = coverRects(state, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: -1, zoom: 1, ox: 0, oy: 0 };
    const photo = panel.photo >= 0 ? photos[panel.photo] || null : null;
    drawPanelPhoto(ctx, photo, rect, panel, grade);
  });
  if (grade.sun && state.sun && rects.length && (state.layout === 'hero' || state.layout === 'full')) {
    drawSunDisc(ctx, rects[0], grade);
  }
  if (state.palms && rects.length) drawPalmSilhouettes(ctx, rects[0]);
  drawTitleBand(ctx, state, w, h, grade);
  drawFinish(ctx, w, h, state);
  if (selected >= 0 && rects[selected]) {
    const r = rects[selected];
    ctx.save();
    ctx.strokeStyle = grade.accent;
    ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.006);
    ctx.setLineDash([14, 8]);
    ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    ctx.restore();
  }
}
