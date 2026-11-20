// Wires the Vice Cover Lab editor: photo slots, layout and grade pickers,
// per-panel crop and position, caption editing, undo/redo, PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (shots.js).
import { GRADES, LAYOUTS, defaultState } from './grades.js';
import { drawCover, coverRects, panelAt } from './cover.js';
import { runShot } from './shots.js';

const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

const state = defaultState();
const photos = [];
let selected = 0;
let sizeKey = 'wide';
let history = [];
let historyAt = -1;

const stage = document.getElementById('stage');
const thumbs = document.getElementById('thumbs');
const status = document.getElementById('status');

function pushHistory() {
  history = history.slice(0, historyAt + 1);
  history.push(JSON.stringify(state));
  if (history.length > 50) history.shift();
  historyAt = history.length - 1;
  syncHistoryButtons();
}

function applyHistory(index) {
  const next = JSON.parse(history[index]);
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, next);
  historyAt = index;
  ensurePanels();
  syncControls();
  redraw();
  syncHistoryButtons();
}

function syncHistoryButtons() {
  document.getElementById('undo').disabled = historyAt <= 0;
  document.getElementById('redo').disabled = historyAt >= history.length - 1;
}

function ensurePanels() {
  const count = coverRects(state, 100, 100).length;
  while (state.panels.length < count) {
    const i = state.panels.length;
    state.panels.push({ photo: photos.length ? i % photos.length : -1, zoom: 1, ox: 0, oy: 0 });
  }
  state.panels.length = count;
}

function redraw() {
  const size = SIZES[sizeKey];
  if (stage.width !== size.w || stage.height !== size.h) {
    stage.width = size.w;
    stage.height = size.h;
  }
  drawCover(stage, photos.map((p) => p.img), state, selected);
  syncPanelControls();
}

function syncPanelControls() {
  const panel = state.panels[selected];
  if (!panel) return;
  document.getElementById('zoom').value = panel.zoom;
  document.getElementById('zoomVal').textContent = `${panel.zoom.toFixed(2)}x`;
  document.getElementById('panelLabel').textContent = `Panel ${selected + 1} of ${state.panels.length}`;
}

function syncControls() {
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('titleScale').value = state.titleScale;
  document.getElementById('titlePos').value = state.titlePos;
  document.querySelectorAll('#layouts button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#grades button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#sizes button').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === sizeKey);
  });
  for (const id of ['frame', 'grain', 'vignette', 'sun', 'palms']) {
    document.getElementById(id).checked = state[id];
  }
}

function buildPickers() {
  const layoutsEl = document.getElementById('layouts');
  Object.entries(LAYOUTS).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = key;
    b.textContent = def.label;
    b.addEventListener('click', () => {
      state.layout = key;
      ensurePanels();
      selected = 0;
      pushHistory();
      syncControls();
      redraw();
    });
    layoutsEl.appendChild(b);
  });
  const gradesEl = document.getElementById('grades');
  Object.entries(GRADES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = key;
    b.textContent = def.label;
    b.style.setProperty('--sw', `linear-gradient(135deg, ${def.top}, ${def.bottom})`);
    b.addEventListener('click', () => {
      state.grade = key;
      pushHistory();
      syncControls();
      redraw();
    });
    gradesEl.appendChild(b);
  });
  const sizesEl = document.getElementById('sizes');
  Object.entries(SIZES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.size = key;
    b.textContent = def.label;
    b.addEventListener('click', () => {
      sizeKey = key;
      syncControls();
      redraw();
    });
    sizesEl.appendChild(b);
  });
}

function addPhoto(img, name) {
  photos.push({ img, name });
  const thumb = document.createElement('button');
  thumb.type = 'button';
  thumb.className = 'thumb';
  thumb.title = name;
  const timg = document.createElement('img');
  timg.src = img.src;
  timg.alt = name;
  thumb.appendChild(timg);
  thumb.addEventListener('click', () => {
    state.panels[selected].photo = photos.length - 1;
    pushHistory();
    redraw();
    status.textContent = `${name} in panel ${selected + 1}`;
  });
  thumb.addEventListener('dblclick', () => {
    state.panels.forEach((p) => {
      p.photo = photos.length - 1;
    });
    pushHistory();
    redraw();
    status.textContent = `${name} in every panel`;
  });
  thumbs.appendChild(thumb);
  ensurePanels();
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addSample(name) {
  try {
    const img = await loadImage(`samples/${name}.jpg`);
    addPhoto(img, name);
    state.panels.forEach((p, i) => {
      if (p.photo < 0) p.photo = (photos.length - 1 + i) % photos.length;
    });
    pushHistory();
    redraw();
    status.textContent = `Sample photo ${name} loaded`;
  } catch (e) {
    status.textContent = `Could not load sample ${name}`;
  }
}

function exportPNG(key) {
  const size = SIZES[key];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, photos.map((p) => p.img), state);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      status.textContent = `Saved vice-cover-${size.w}x${size.h}.png`;
      resolve(blob);
    }, 'image/png');
  });
}

function wireEditor() {
  document.getElementById('photo').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      const img = await loadImage(URL.createObjectURL(file));
      addPhoto(img, file.name);
    }
    pushHistory();
    redraw();
    status.textContent = `${e.target.files.length} photo(s) added`;
    e.target.value = '';
  });
  document.getElementById('sampleBoulevard').addEventListener('click', () => addSample('boulevard'));
  document.getElementById('samplePier').addEventListener('click', () => addSample('pier'));
  document.getElementById('title').addEventListener('input', (e) => {
    state.title = e.target.value;
    redraw();
  });
  document.getElementById('title').addEventListener('change', pushHistory);
  document.getElementById('subtitle').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    redraw();
  });
  document.getElementById('subtitle').addEventListener('change', pushHistory);
  document.getElementById('titleScale').addEventListener('input', (e) => {
    state.titleScale = parseFloat(e.target.value);
    redraw();
  });
  document.getElementById('titleScale').addEventListener('change', pushHistory);
  document.getElementById('titlePos').addEventListener('change', (e) => {
    state.titlePos = e.target.value;
    pushHistory();
    redraw();
  });
  for (const id of ['frame', 'grain', 'vignette', 'sun', 'palms']) {
    document.getElementById(id).addEventListener('change', (e) => {
      state[id] = e.target.checked;
      pushHistory();
      redraw();
    });
  }
  document.getElementById('zoom').addEventListener('input', (e) => {
    const panel = state.panels[selected];
    if (!panel) return;
    panel.zoom = parseFloat(e.target.value);
    redraw();
  });
  document.getElementById('zoom').addEventListener('change', pushHistory);
  document.getElementById('fit').addEventListener('click', () => {
    const panel = state.panels[selected];
    if (!panel) return;
    panel.zoom = 1;
    panel.ox = 0;
    panel.oy = 0;
    pushHistory();
    redraw();
  });
  document.getElementById('undo').addEventListener('click', () => {
    if (historyAt > 0) applyHistory(historyAt - 1);
  });
  document.getElementById('redo').addEventListener('click', () => {
    if (historyAt < history.length - 1) applyHistory(historyAt + 1);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (historyAt > 0) applyHistory(historyAt - 1);
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      if (historyAt < history.length - 1) applyHistory(historyAt + 1);
    }
  });
  document.getElementById('exportOne').addEventListener('click', () => exportPNG(sizeKey));
  document.getElementById('exportAll').addEventListener('click', async () => {
    for (const key of Object.keys(SIZES)) await exportPNG(key);
  });

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const toCanvas = (e) => {
    const r = stage.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * stage.width,
      y: ((e.clientY - r.top) / r.height) * stage.height,
    };
  };
  stage.addEventListener('pointerdown', (e) => {
    const p = toCanvas(e);
    const hit = panelAt(state, stage.width, stage.height, p.x, p.y);
    if (hit >= 0) {
      selected = hit;
      dragging = true;
      lastX = p.x;
      lastY = p.y;
      stage.setPointerCapture(e.pointerId);
      redraw();
    }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = toCanvas(e);
    const panel = state.panels[selected];
    if (!panel) return;
    panel.ox += (p.x - lastX) / stage.width;
    panel.oy += (p.y - lastY) / stage.height;
    lastX = p.x;
    lastY = p.y;
    redraw();
  });
  stage.addEventListener('pointerup', () => {
    if (dragging) {
      dragging = false;
      pushHistory();
    }
  });
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[selected];
    if (!panel) return;
    panel.zoom = Math.min(3, Math.max(1, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
    redraw();
  }, { passive: false });
}

buildPickers();
wireEditor();
ensurePanels();
syncControls();
pushHistory();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, { state, photos, addSample, loadImage, redraw, setSize: (k) => { sizeKey = k; } });
} else {
  redraw();
}

// Redraw once the display fonts arrive, so the title uses Anton and Pacifico.
// In a ?shot= scene the shot itself waits for the fonts before its one paint,
// so a late redraw here would only repaint the editor's selection outline
// over the finished cover.
if (!shot && document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => redraw());
}
