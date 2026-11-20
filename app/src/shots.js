// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the cover alone, full frame.
// Query params: photo (boulevard|pier), caption, title, subtitle, layout,
// grade, size (square|portrait|wide). window.__shotReady is set once painted.
import { drawCover } from './cover.js';

function ready() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

export async function runShot(shot, query, api) {
  const { state, photos } = api;
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('title')) state.title = query.get('title');
  if (query.get('subtitle')) state.subtitle = query.get('subtitle');
  if (query.get('size')) api.setSize(query.get('size'));
  const photo = query.get('photo') ?? 'boulevard';
  await api.addSample(photo);
  // Load the second sample too, so every panel has a photo to show,
  // then deal the two photos across the panels in turn.
  await api.addSample(photo === 'boulevard' ? 'pier' : 'boulevard');
  state.panels.forEach((p, i) => {
    p.photo = i % 2;
  });
  // Optional per-panel vertical pan (fractions of the panel width), e.g.
  // oy0=0.3 pulls a tall portrait photo down to show its subject's head
  // in a wide hero panel.
  for (let i = 0; i < state.panels.length; i++) {
    const oy = query.get(`oy${i}`);
    if (oy !== null) state.panels[i].oy = parseFloat(oy);
    const zoom = query.get(`zoom${i}`);
    if (zoom !== null) state.panels[i].zoom = parseFloat(zoom);
  }
  if (query.get('caption')) {
    state.title = query.get('caption');
    document.getElementById('title').value = state.title;
  }
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const stage = document.getElementById('stage');
    stage.width = window.innerWidth;
    stage.height = window.innerHeight;
    // Wait for the display fonts, so the title is drawn in Anton/Pacifico
    // rather than a fallback, before the one cover paint.
    if (document.fonts) {
      await Promise.all([
        document.fonts.load('100px Anton'),
        document.fonts.load('40px Pacifico'),
      ]).catch(() => {});
    }
    drawCover(stage, photos.map((p) => p.img), state);
    ready();
    return;
  }
  if (document.fonts) {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('40px Pacifico'),
    ]).catch(() => {});
  }
  api.redraw();
  ready();
}
