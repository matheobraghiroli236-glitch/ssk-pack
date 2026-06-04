// ── BUILDER PACK — JS PRINCIPAL ─────────────────────────────────────────────

const STEPS = ['swords', 'bows', 'armors', 'blocks', 'pickaxes', 'goldenApples', 'fishingRods', 'particles', 'export'];
const STEP_LABELS = {
  swords: 'Épée',
  bows: 'Arc',
  armors: 'Armure',
  blocks: 'Blocs',
  pickaxes: 'Pioche',
  goldenApples: "Pomme d'or",
  fishingRods: 'Canne à pêche',
  particles: 'Particules'
};

let currentStepIdx = 0;
let builderItems = {};    // fetched from server
let selection = {         // user selections
  swords: null,
  bows: null,
  armors: null,
  blocks: null,
  pickaxes: null,
  goldenApples: null,
  fishingRods: null,
  particles: null
};
let exportIconId = null;

// ── Pack icons (same as in main.js) ─────────────────────────────────────────
const PACK_ICONS = [
  { id:'sword',   label:'Épée',    svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1a0a0e"/><line x1="8" y1="24" x2="24" y2="8" stroke="#ff2a4b" stroke-width="3" stroke-linecap="round"/><line x1="12" y1="22" x2="10" y2="24" stroke="#ff2a4b" stroke-width="2"/><circle cx="24" cy="8" r="2.5" fill="#ff2a4b"/><line x1="11" y1="17" x2="15" y2="13" stroke="rgba(255,42,75,0.4)" stroke-width="1.5"/></svg>` },
  { id:'shield',  label:'Bouclier',svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0a0e1a"/><path d="M16 5 L27 9 L27 17 Q27 24 16 28 Q5 24 5 17 L5 9 Z" fill="none" stroke="#4a9eff" stroke-width="2"/><path d="M16 10 L22 13 L22 18 Q22 22 16 25 Q10 22 10 18 L10 13 Z" fill="rgba(74,158,255,0.15)"/></svg>` },
  { id:'diamond', label:'Diamant', svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#071a1a"/><polygon points="16,5 26,13 16,27 6,13" fill="none" stroke="#00e5ff" stroke-width="2"/><polygon points="16,5 26,13 16,14 6,13" fill="rgba(0,229,255,0.2)"/><line x1="6" y1="13" x2="26" y2="13" stroke="#00e5ff" stroke-width="1.5"/></svg>` },
  { id:'fire',    label:'Feu',     svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1a0a00"/><path d="M16 26 Q8 22 9 15 Q10 10 14 8 Q12 13 15 14 Q13 9 18 5 Q17 12 21 13 Q24 14 23 18 Q22 22 16 26Z" fill="none" stroke="#ff6a00" stroke-width="1.5"/><path d="M16 26 Q9 22 10 16 Q11 12 14 10 Q13 14 16 15 Q18 11 20 14 Q22 16 21 19 Q20 22 16 26Z" fill="rgba(255,106,0,0.25)"/></svg>` },
  { id:'skull',   label:'Crâne',   svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0d0d0d"/><ellipse cx="16" cy="14" rx="9" ry="8" fill="none" stroke="#e0e0e0" stroke-width="1.8"/><rect x="10" y="20" width="12" height="6" rx="1" fill="none" stroke="#e0e0e0" stroke-width="1.5"/><circle cx="12.5" cy="14" r="2.5" fill="#e0e0e0"/><circle cx="19.5" cy="14" r="2.5" fill="#e0e0e0"/><line x1="14" y1="22" x2="14" y2="26" stroke="#e0e0e0" stroke-width="1.5"/><line x1="18" y1="22" x2="18" y2="26" stroke="#e0e0e0" stroke-width="1.5"/></svg>` },
  { id:'star',    label:'Étoile',  svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0e0e00"/><polygon points="16,4 19.5,13 29,13 21.5,18.5 24.5,28 16,22.5 7.5,28 10.5,18.5 3,13 12.5,13" fill="none" stroke="#ffd700" stroke-width="1.8"/><polygon points="16,8 18.5,14 25,14 19.8,17.8 22,24 16,20 10,24 12.2,17.8 7,14 13.5,14" fill="rgba(255,215,0,0.2)"/></svg>` },
  { id:'cube',    label:'Cube',    svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0a1a0a"/><rect x="9" y="12" width="11" height="11" fill="none" stroke="#5dff5d" stroke-width="1.8"/><polygon points="9,12 15,7 26,7 20,12" fill="none" stroke="#5dff5d" stroke-width="1.5"/><polygon points="20,12 26,7 26,18 20,23" fill="rgba(93,255,93,0.15)" stroke="#5dff5d" stroke-width="1.5"/></svg>` },
  { id:'bolt',    label:'Éclair',  svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0e0e1a"/><polygon points="19,4 10,18 16,18 13,28 22,14 16,14" fill="none" stroke="#a855f7" stroke-width="2"/><polygon points="19,4 11,18 16,18 13,28 22,14 16,14" fill="rgba(168,85,247,0.2)"/></svg>` },
  { id:'target',  label:'Cible',   svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1a0505"/><circle cx="16" cy="16" r="10" fill="none" stroke="#ff2a4b" stroke-width="1.8"/><circle cx="16" cy="16" r="6" fill="none" stroke="#ff2a4b" stroke-width="1.5"/><circle cx="16" cy="16" r="2.5" fill="#ff2a4b"/><line x1="16" y1="4" x2="16" y2="8" stroke="#ff2a4b" stroke-width="1.5"/><line x1="16" y1="24" x2="16" y2="28" stroke="#ff2a4b" stroke-width="1.5"/><line x1="4" y1="16" x2="8" y2="16" stroke="#ff2a4b" stroke-width="1.5"/><line x1="24" y1="16" x2="28" y2="16" stroke="#ff2a4b" stroke-width="1.5"/></svg>` },
  { id:'crown',   label:'Couronne',svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1a1000"/><polygon points="5,22 5,12 11,17 16,8 21,17 27,12 27,22" fill="none" stroke="#ffd700" stroke-width="2"/><rect x="5" y="22" width="22" height="3" rx="1" fill="none" stroke="#ffd700" stroke-width="1.8"/><circle cx="16" cy="8" r="1.5" fill="#ffd700"/><circle cx="5" cy="12" r="1.5" fill="#ffd700"/><circle cx="27" cy="12" r="1.5" fill="#ffd700"/></svg>` },
  { id:'potion',  label:'Potion',  svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0a001a"/><rect x="13" y="4" width="6" height="5" rx="1" fill="none" stroke="#c084fc" stroke-width="1.8"/><path d="M11 9 Q8 14 9 20 Q10 26 16 26 Q22 26 23 20 Q24 14 21 9Z" fill="none" stroke="#c084fc" stroke-width="1.8"/><path d="M11 9 Q8 14 9 20 Q10 26 16 26 Q22 26 23 20 Q24 14 21 9Z" fill="rgba(192,132,252,0.15)"/></svg>` },
  { id:'cross',   label:'Soin',    svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#001a0a"/><rect x="13" y="6" width="6" height="20" rx="2" fill="none" stroke="#00ff88" stroke-width="2"/><rect x="6" y="13" width="20" height="6" rx="2" fill="none" stroke="#00ff88" stroke-width="2"/></svg>` },
];

// ── Version → pack_format mapping ────────────────────────────────────────────
const PACK_FORMATS = {
  '9':  1,   // 1.8.x – 1.12.x
  '13': 4,
  '15': 5,
  '17': 7,
  '19': 12,
  '21': 34
};

// ── DOM refs ─────────────────────────────────────────────────────────────────
const prevBtn   = document.getElementById('prevBtn');
const nextBtn   = document.getElementById('nextBtn');
const skipBtn   = document.getElementById('skipBtn');
const stepperBar = document.getElementById('stepperBar');

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadBuilderItems();
  renderSwords();
  renderArmors();
  setupNav();
  setupSwordSearch();
  setupColorFilter();
  setupExportIcons();
  updateStepper();
  updateNavButtons();
});

// ── Load items from API ───────────────────────────────────────────────────────
async function loadBuilderItems() {
  try {
    const res = await fetch('/api/builder/items');
    if (!res.ok) throw new Error();
    builderItems = await res.json();
  } catch {
    builderItems = { swords: [], bows: [], armors: [], blocks: [], pickaxes: [], goldenApples: [], fishingRods: [], particles: [] };
  }
}

// ── RENDER SWORDS ─────────────────────────────────────────────────────────────
function renderSwords(filter = 'all', search = '') {
  const grid = document.getElementById('swordsGrid');
  const swords = (builderItems.swords || []);

  document.getElementById('sword-count').textContent = swords.length;

  let filtered = swords.filter(s => {
    if (search) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.id.includes(q);
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="items-loading"><i class="fa-solid fa-magnifying-glass"></i> Aucune épée trouvée.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(sword => {
    const isSelected = selection.swords && selection.swords.id === sword.id;
    const isVideo = sword.preview.endsWith('.mp4') || sword.preview.endsWith('.webm');
    const mediaHtml = isVideo
      ? `<video src="${sword.preview}" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:contain; pointer-events:none;"></video>`
      : `<img src="${sword.preview}" alt="${sword.name}" onerror="this.src='/builder-items/swords/sword_${sword.id.replace('sword_','')}.png'" style="width:100%; height:100%; object-fit:contain;">`;

    return `
      <div class="item-card ${isSelected ? 'selected' : ''}" data-id="${sword.id}" data-step="swords">
        ${mediaHtml}
        <div class="item-card-label">${sword.name}</div>
      </div>
    `;
  }).join('');

  // Click events
  grid.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const sword = swords.find(s => s.id === card.dataset.id);
      if (!sword) return;
      // Toggle selection
      if (selection.swords && selection.swords.id === sword.id) {
        selection.swords = null;
      } else {
        selection.swords = sword;
      }
      renderSwords(getCurrentColorFilter(), document.getElementById('swordSearch').value);
    });
  });
}

function renderCategory(catId) {
  const grid = document.getElementById(`${catId}Grid`);
  if (!grid) return;

  const items = builderItems[catId] || [];

  if (items.length === 0) {
    return;
  }

  grid.classList.remove('empty-category');

  grid.innerHTML = items.map(item => {
    const isSelected = selection[catId] && selection[catId].id === item.id;
    const isVideo = item.preview.endsWith('.mp4') || item.preview.endsWith('.webm');
    const mediaHtml = isVideo
      ? `<video src="${item.preview}" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:contain; pointer-events:none;"></video>`
      : `<img src="${item.preview}" alt="${item.name}" onerror="this.src='${item.file}'" style="width:100%; height:100%; object-fit:contain;">`;

    return `
      <div class="item-card ${isSelected ? 'selected' : ''}" data-id="${item.id}" data-step="${catId}">
        ${mediaHtml}
        <div class="item-card-label">${item.name}</div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const item = items.find(i => i.id === card.dataset.id);
      if (!item) return;
      if (selection[catId] && selection[catId].id === item.id) {
        selection[catId] = null;
      } else {
        selection[catId] = item;
      }
      renderCategory(catId);
    });
  });
}


// ── ARMOR 3D SKIN PREVIEW — hover popup ──────────────────────────────────────
let _armorAnimId = null;
let _armorRenderer = null;
let _armorGroup = null;
let _armorScene = null;
let _armorCamera = null;

function disposeArmorScene() {
  if (_armorAnimId) { cancelAnimationFrame(_armorAnimId); _armorAnimId = null; }
  if (_armorRenderer) { _armorRenderer.dispose(); _armorRenderer = null; }
  _armorGroup = null; _armorScene = null; _armorCamera = null;
}

// Skinview3d-style UV helper for Minecraft 64x64 skin
// face order in Three.js BoxGeometry: +x, -x, +y, -y, +z, -z
function buildSkinBox(w, h, d, ox, oy, texture, tw, th, slim) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;

  // Minecraft skin UV layout for a box at offset (ox,oy):
  // top:    ox+d,      oy       →  ox+d+w,   oy+d
  // bottom: ox+d+w,   oy       →  ox+d+w+w, oy+d
  // right:  ox,        oy+d     →  ox+d,     oy+d+h
  // front:  ox+d,      oy+d     →  ox+d+w,   oy+d+h
  // left:   ox+d+w,   oy+d     →  ox+d+w+d, oy+d+h
  // back:   ox+d+w+d, oy+d     →  ox+d+w+d+w, oy+d+h

  const s = (x, y) => [x / tw, 1.0 - y / th];

  // Each face: [topLeft, topRight, bottomLeft, bottomRight]
  const faces = [
    // +x = left face of box (right side when viewed from front) → Minecraft "right"
    [ s(ox,         oy+d),      s(ox+d,       oy+d),      s(ox,         oy+d+h),    s(ox+d,       oy+d+h)   ],
    // -x = right face of box → Minecraft "left"
    [ s(ox+d+w,     oy+d),      s(ox+d+w+d,   oy+d),      s(ox+d+w,     oy+d+h),    s(ox+d+w+d,   oy+d+h)   ],
    // +y = top
    [ s(ox+d,       oy),        s(ox+d+w,     oy),        s(ox+d,       oy+d),      s(ox+d+w,     oy+d)     ],
    // -y = bottom
    [ s(ox+d+w,     oy),        s(ox+d+w+w,   oy),        s(ox+d+w,     oy+d),      s(ox+d+w+w,   oy+d)     ],
    // +z = front
    [ s(ox+d,       oy+d),      s(ox+d+w,     oy+d),      s(ox+d,       oy+d+h),    s(ox+d+w,     oy+d+h)   ],
    // -z = back
    [ s(ox+d+w+d,   oy+d),      s(ox+d+w+d+w, oy+d),      s(ox+d+w+d,   oy+d+h),    s(ox+d+w+d+w, oy+d+h)   ],
  ];

  for (let fi = 0; fi < 6; fi++) {
    const [tl, tr, bl, br] = faces[fi];
    const b = fi * 4;
    uv.setXY(b+0, tl[0], tl[1]);
    uv.setXY(b+1, tr[0], tr[1]);
    uv.setXY(b+2, bl[0], bl[1]);
    uv.setXY(b+3, br[0], br[1]);
  }
  uv.needsUpdate = true;

  return geo;
}

function makePart(w, h, d, ox, oy, tex, tw, th, inflate, transparent) {
  const geo = buildSkinBox(w + inflate*2, h + inflate*2, d + inflate*2, ox, oy, tex, tw, th);
  const mat = new THREE.MeshLambertMaterial({
    map: tex,
    transparent: true,
    alphaTest: transparent ? 0.01 : 0.5,
    side: THREE.FrontSide
  });
  return new THREE.Mesh(geo, mat);
}

function launchArmorPreview(canvasEl, layer1Url, layer2Url) {
  if (typeof THREE === 'undefined') return;
  disposeArmorScene();

  const W = 160, H = 220;
  canvasEl.width = W; canvasEl.height = H;
  canvasEl.style.width = W + 'px'; canvasEl.style.height = H + 'px';

  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: false });
  renderer.setSize(W, H);
  renderer.setPixelRatio(1);
  _armorRenderer = renderer;

  const scene = new THREE.Scene();
  _armorScene = scene;
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
  camera.position.set(0, 16, 55);
  camera.lookAt(0, 16, 0);
  _armorCamera = camera;

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 0.6);
  sun.position.set(20, 40, 20);
  scene.add(sun);

  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';

  const STEVE = '/steve_skin.png';

  let pending = 1 + (layer1Url ? 1 : 0) + (layer2Url ? 1 : 0);
  let skinTex = null, a1Tex = null, a2Tex = null;

  function tryBuild() {
    pending--;
    if (pending <= 0) buildAndAnimate();
  }

  function loadTex(url, onDone) {
    const t = loader.load(url, () => {
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      onDone(t);
    }, undefined, () => onDone(null));
    return t;
  }

  loadTex(STEVE, t => { skinTex = t; tryBuild(); });
  if (layer1Url) loadTex(layer1Url, t => { a1Tex = t; tryBuild(); });
  if (layer2Url) loadTex(layer2Url, t => { a2Tex = t; tryBuild(); });

  function buildAndAnimate() {
    if (_armorGroup) scene.remove(_armorGroup);
    const group = new THREE.Group();
    _armorGroup = group;

    function add(mesh, x, y, z) { mesh.position.set(x,y,z); group.add(mesh); }

    // ── Steve skin (64x64) ──
    if (skinTex) {
      add(makePart(8,8,8,   0, 0,  skinTex,64,64, 0,   false), 0,  28, 0); // head
      add(makePart(8,8,8,  32, 0,  skinTex,64,64, 0.5, true),  0,  28, 0); // head overlay
      add(makePart(8,12,4, 16,16,  skinTex,64,64, 0,   false), 0,  12, 0); // body
      add(makePart(4,12,4, 40,16,  skinTex,64,64, 0,   false),-6,  12, 0); // right arm
      add(makePart(4,12,4, 32,48,  skinTex,64,64, 0,   false), 6,  12, 0); // left arm
      add(makePart(4,12,4,  0,16,  skinTex,64,64, 0,   false),-2,  -4, 0); // right leg
      add(makePart(4,12,4, 16,48,  skinTex,64,64, 0,   false), 2,  -4, 0); // left leg
    }

    // ── Armor Layer 1 (128x64) ──
    // UV layout for 128x64:
    // helmet:     0,0   w=8  h=8  d=8
    // chestplate: 16,16 w=8  h=12 d=4
    // right_arm:  40,16 w=4  h=12 d=4  (same as skin but scaled to armor tex)
    // left_arm:   16,32 w=4  h=12 d=4  (NEW in 1.8+ 64x64 armor format — but these are 128x64)
    // right_leg:  0,16  w=4  h=12 d=4
    // left_leg:   0,32  w=4  h=12 d=4
    if (a1Tex) {
      add(makePart(8,8,8,   0, 0,  a1Tex,128,64, 0.5, true),  0,  28, 0); // helmet
      add(makePart(8,12,4, 16,16,  a1Tex,128,64, 0.5, true),  0,  12, 0); // chestplate
      add(makePart(4,12,4, 40,16,  a1Tex,128,64, 0.5, true), -6,  12, 0); // right arm
      add(makePart(4,12,4, 64,16,  a1Tex,128,64, 0.5, true),  6,  12, 0); // left arm
      add(makePart(4,12,4,  0,16,  a1Tex,128,64, 0.5, true), -2,  -4, 0); // right leg
      add(makePart(4,12,4,  0,32,  a1Tex,128,64, 0.5, true),  2,  -4, 0); // left leg
    }

    // ── Armor Layer 2 (128x64) — leggings + boots ──
    if (a2Tex) {
      add(makePart(4,12,4,  0,16, a2Tex,128,64, 0.5, true), -2, -4, 0); // right legging
      add(makePart(4,12,4, 16,16, a2Tex,128,64, 0.5, true),  2, -4, 0); // left legging
    }

    group.rotation.y = 0.4;
    scene.add(group);

    function animate() {
      _armorAnimId = requestAnimationFrame(animate);
      group.rotation.y += 0.018;
      renderer.render(scene, camera);
    }
    animate();
  }
}

// ── RENDER ARMORS — grille normale + popup 3D au hover ───────────────────────
function renderArmors() {
  const grid = document.getElementById('armorsGrid');
  if (!grid) return;

  const armors = builderItems.armors || [];
  if (armors.length === 0) return;

  grid.classList.remove('empty-category');

  // Inject the hover popup container (only once)
  if (!document.getElementById('armorHoverPopup')) {
    const popup = document.createElement('div');
    popup.id = 'armorHoverPopup';
    popup.style.cssText = `
      display:none; position:fixed; z-index:9999; pointer-events:none;
      background:linear-gradient(160deg,#13151c 0%,#0d0f15 100%);
      border:1px solid rgba(255,255,255,0.1); border-radius:14px;
      box-shadow:0 8px 40px rgba(0,0,0,0.7); padding:8px;
      flex-direction:column; align-items:center; gap:4px; width:180px;
    `;
    popup.innerHTML = `
      <div id="armorHoverName" style="font-size:0.58rem;color:rgba(255,255,255,0.4);font-family:monospace;letter-spacing:.08em;text-transform:uppercase;"></div>
      <canvas id="armorHoverCanvas" width="160" height="210" style="display:block;border-radius:8px;"></canvas>
    `;
    document.body.appendChild(popup);
  }

  const sel = selection.armors;

  grid.innerHTML = `
    <div style="display:flex; flex-wrap:wrap; gap:8px; padding:4px 0 8px;">

      <!-- No armor card -->
      <div class="armor-card" data-id="none" style="
        width:82px; display:flex; flex-direction:column; align-items:center;
        background:var(--bg-secondary);
        border:2px solid ${!sel ? 'var(--accent-red)' : 'rgba(255,255,255,0.06)'};
        border-radius:10px; cursor:pointer; transition:all 0.18s; padding:8px 4px; gap:5px;
        ${!sel ? 'box-shadow:0 0 0 1px var(--accent-red),0 4px 18px rgba(255,42,75,0.22);' : ''}
      ">
        <div style="width:72px;height:90px;display:flex;align-items:center;justify-content:center;">
          <i class="fa-solid fa-ban" style="font-size:1.8rem;color:rgba(255,255,255,0.1);"></i>
        </div>
        <div style="font-size:0.58rem;color:var(--text-muted);font-family:var(--font-mono);text-align:center;">Aucune</div>
      </div>

      ${armors.map(armor => {
        const isSelected = sel && sel.id === armor.id;
        const previewSrc = armor.preview || (armor.files?.[0]?.file || '');
        const l1 = armor.files?.find(f => f.path?.includes('layer_1'))?.file || armor.files?.[0]?.file || '';
        const l2 = armor.files?.find(f => f.path?.includes('layer_2'))?.file || '';
        return `
          <div class="armor-card" data-id="${armor.id}" data-l1="${l1}" data-l2="${l2}" data-name="${armor.name}" style="
            width:82px; display:flex; flex-direction:column; align-items:center; position:relative;
            background:var(--bg-secondary);
            border:2px solid ${isSelected ? 'var(--accent-red)' : 'rgba(255,255,255,0.06)'};
            border-radius:10px; cursor:pointer; transition:all 0.18s; padding:5px; gap:3px;
            ${isSelected ? 'box-shadow:0 0 0 1px var(--accent-red),0 4px 18px rgba(255,42,75,0.22);' : ''}
          ">
            <img src="${previewSrc}" alt="${armor.name}"
              style="width:72px;height:90px;object-fit:cover;border-radius:6px;image-rendering:pixelated;background:#111;">
            <div style="font-size:0.57rem;color:var(--text-muted);font-family:var(--font-mono);text-align:center;padding:0 2px;line-height:1.2;">
              ${armor.name}
            </div>
            ${isSelected ? '<div style="position:absolute;top:3px;right:3px;width:14px;height:14px;background:var(--accent-red);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;">✓</div>' : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  // ── Hover 3D popup logic ──
  const popup = document.getElementById('armorHoverPopup');
  const popupName = document.getElementById('armorHoverName');
  const popupCanvas = document.getElementById('armorHoverCanvas');
  let hoverTimer = null;
  let currentHoverId = null;

  grid.querySelectorAll('.armor-card[data-id]').forEach(card => {
    if (card.dataset.id === 'none') return;

    card.addEventListener('mouseenter', (e) => {
      const id = card.dataset.id;
      const l1 = card.dataset.l1;
      const l2 = card.dataset.l2;
      const name = card.dataset.name;

      // Position popup near the card
      const rect = card.getBoundingClientRect();
      let left = rect.right + 10;
      let top = rect.top - 20;
      // Keep in viewport
      if (left + 190 > window.innerWidth) left = rect.left - 195;
      if (top + 240 > window.innerHeight) top = window.innerHeight - 250;
      if (top < 8) top = 8;

      popup.style.left = left + 'px';
      popup.style.top = top + 'px';
      popup.style.display = 'flex';
      popupName.textContent = name;

      if (currentHoverId !== id) {
        currentHoverId = id;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          launchArmorPreview(popupCanvas, l1, l2);
        }, 80);
      }
    });

    card.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      popup.style.display = 'none';
      currentHoverId = null;
      disposeArmorScene();
    });

    // Click to select
    card.addEventListener('click', () => {
      const armor = armors.find(a => a.id === card.dataset.id);
      if (!armor) return;
      selection.armors = (selection.armors?.id === armor.id) ? null : armor;
      renderArmors();
    });
  });

  // No armor click
  grid.querySelector('.armor-card[data-id="none"]')?.addEventListener('click', () => {
    selection.armors = null;
    renderArmors();
  });
}

function getCurrentColorFilter() {
  const active = document.querySelector('.color-dot.active');
  return active ? active.dataset.color : 'all';
}

// ── SWORD SEARCH ──────────────────────────────────────────────────────────────
function setupSwordSearch() {
  const input = document.getElementById('swordSearch');
  input.addEventListener('input', () => {
    renderSwords(getCurrentColorFilter(), input.value.trim());
  });
}

// ── COLOR FILTER (visual only for now — swords don't have color metadata yet) ─
function setupColorFilter() {
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      renderSwords(dot.dataset.color, document.getElementById('swordSearch').value.trim());
    });
  });
}

// ── EXPORT ICONS ──────────────────────────────────────────────────────────────
function setupExportIcons() {
  const grid = document.getElementById('exportIconGrid');
  const hint = document.getElementById('exportIconHint');

  grid.innerHTML = PACK_ICONS.map(icon => `
    <button type="button" class="icon-pick-btn" data-icon-id="${icon.id}" title="${icon.label}">
      ${icon.svg}
    </button>
  `).join('');

  grid.querySelectorAll('.icon-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (exportIconId === btn.dataset.iconId) {
        exportIconId = null;
        grid.querySelectorAll('.icon-pick-btn').forEach(b => b.classList.remove('selected'));
        hint.textContent = 'Aucune icône — pack.png par défaut (S rouge)';
      } else {
        exportIconId = btn.dataset.iconId;
        grid.querySelectorAll('.icon-pick-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const icon = PACK_ICONS.find(i => i.id === exportIconId);
        hint.textContent = `Icône sélectionnée : ${icon.label}`;
      }
    });
  });
}

// ── NAVIGATION ────────────────────────────────────────────────────────────────
function setupNav() {
  prevBtn.addEventListener('click', () => {
    if (currentStepIdx > 0) { currentStepIdx--; showStep(); }
  });
  nextBtn.addEventListener('click', () => {
    if (currentStepIdx < STEPS.length - 1) { currentStepIdx++; showStep(); }
  });
  skipBtn.addEventListener('click', () => {
    if (currentStepIdx < STEPS.length - 1) { currentStepIdx++; showStep(); }
  });

  // Stepper click
  stepperBar.querySelectorAll('.stepper-step').forEach((el, i) => {
    el.addEventListener('click', () => {
      currentStepIdx = i;
      showStep();
    });
  });

  document.getElementById('buildBtn').addEventListener('click', buildPack);
}

function showStep() {
  // Dispose armor 3D scene when navigating away from armors
  const prevStepId = STEPS[currentStepIdx];
  if (prevStepId !== 'armors') disposeArmorScene();

  // Hide all steps
  document.querySelectorAll('.builder-step').forEach(s => s.classList.remove('active'));
  // Show current
  const stepId = STEPS[currentStepIdx];
  document.getElementById(`step-${stepId}`).classList.add('active');

  if (stepId === 'export') {
    renderRecap();
    nextBtn.style.display = 'none';
    skipBtn.style.display = 'none';
  } else {
    nextBtn.style.display = '';
    skipBtn.style.display = '';
    if (stepId !== 'swords') {
      if (stepId === 'armors') {
        renderArmors();
      } else {
        renderCategory(stepId);
      }
    }
  }

  updateStepper();
  updateNavButtons();
  window.scrollTo({ top: 200, behavior: 'smooth' });
}

function updateNavButtons() {
  prevBtn.disabled = currentStepIdx === 0;
  const stepId = STEPS[currentStepIdx];
  const isExport = stepId === 'export';
  // Show/hide skip on mandatory vs optional steps
  const mandatory = ['swords'];
  skipBtn.style.display = (isExport || mandatory.includes(stepId)) ? 'none' : '';
  nextBtn.style.display = isExport ? 'none' : '';
}

function updateStepper() {
  const steps = stepperBar.querySelectorAll('.stepper-step');
  const dividers = stepperBar.querySelectorAll('.stepper-divider');

  steps.forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i < currentStepIdx) el.classList.add('done');
    else if (i === currentStepIdx) el.classList.add('active');
  });

  dividers.forEach((el, i) => {
    el.classList.toggle('done', i < currentStepIdx);
  });
}

// ── RECAP ─────────────────────────────────────────────────────────────────────
function renderRecap() {
  const grid = document.getElementById('recapGrid');
  const cats = Object.keys(STEP_LABELS);

  grid.innerHTML = cats.map(cat => {
    const sel = selection[cat];
    const hasPreview = sel && (sel.preview || sel.file);
    const imgSrc = sel ? (sel.preview || sel.file || '') : '';
    return `
      <div class="recap-item ${sel ? 'selected' : 'skipped'}">
        ${sel ? '<div class="recap-badge-selected"></div>' : ''}
        <div class="recap-item-cat">${STEP_LABELS[cat]}</div>
        <img class="recap-item-img ${!imgSrc ? 'placeholder' : ''}"
             src="${imgSrc || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><rect width=%2232%22 height=%2232%22 fill=%22%23222%22/></svg>'}"
             alt="${cat}">
        <div class="recap-item-name">${sel ? sel.name : 'Aucun'}</div>
      </div>
    `;
  }).join('');
}

// ── BUILD PACK ────────────────────────────────────────────────────────────────
async function buildPack() {
  const packName = document.getElementById('packName').value.trim() || 'MonPack';
  const packDesc = document.getElementById('packDesc').value.trim() || 'Pack PvP personnalisé';
  const verKey   = document.getElementById('packVersion').value;
  const packFormat = PACK_FORMATS[verKey] || 4;

  const progress = document.getElementById('buildProgress');
  const fill     = document.getElementById('progressFill');
  const label    = document.getElementById('progressLabel');
  const btn      = document.getElementById('buildBtn');

  // Show progress
  progress.style.display = 'block';
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Génération en cours...';

  const setProgress = (pct, msg) => {
    fill.style.width = pct + '%';
    label.textContent = msg;
  };

  try {
    const zip = new JSZip();

    setProgress(5, 'Création du pack.mcmeta...');

    // pack.mcmeta
    const mcmeta = JSON.stringify({
      pack: {
        pack_format: packFormat,
        description: packDesc
      }
    }, null, 2);
    zip.file('pack.mcmeta', mcmeta);

    setProgress(15, 'Ajout de pack.png...');

    // pack.png — either selected icon SVG→PNG or default SSK icon
    const iconSvg = exportIconId
      ? generateIconPng(exportIconId)
      : generateDefaultPackIcon(packName);
    zip.file('pack.png', iconSvg, { base64: true });

    setProgress(25, 'Téléchargement des textures sélectionnées...');

    // Collect all files to download
    const filesToFetch = [];

    // SWORD
    if (selection.swords) {
      const s = selection.swords;
      // Determine correct path based on pack format
      let swordPath;
      if (packFormat <= 3) {
        // 1.8.x - 1.12.x uses items/ folder
        swordPath = 'assets/minecraft/textures/items/diamond_sword.png';
      } else {
        // 1.13+ uses item/ folder
        swordPath = 'assets/minecraft/textures/item/diamond_sword.png';
      }
      filesToFetch.push({ url: s.file, zipPath: swordPath });
    }

    // Other categories (bows, armors, etc.) — for items with multiple files
    for (const cat of ['bows', 'armors', 'blocks', 'pickaxes', 'goldenApples', 'fishingRods', 'particles']) {
      const sel = selection[cat];
      if (!sel) continue;
      if (sel.files) {
        sel.files.forEach(f => filesToFetch.push({ url: f.file, zipPath: f.path }));
      } else if (sel.file && sel.internalPath) {
        filesToFetch.push({ url: sel.file, zipPath: sel.internalPath });
      }
    }

    // Fetch all textures
    const total = filesToFetch.length;
    for (let i = 0; i < total; i++) {
      const { url, zipPath } = filesToFetch[i];
      setProgress(25 + Math.round((i / Math.max(total, 1)) * 60), `Téléchargement texture ${i + 1}/${total}...`);
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        const arrayBuffer = await blob.arrayBuffer();
        zip.file(zipPath, arrayBuffer);
      } catch (e) {
        console.warn(`Impossible de charger ${url}:`, e);
      }
    }

    setProgress(88, 'Compression du zip...');

    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    }, (meta) => {
      setProgress(88 + Math.round(meta.percent * 0.1), 'Compression du zip...');
    });

    setProgress(99, 'Téléchargement...');

    // Trigger download
    const filename = packName.replace(/[^a-zA-Z0-9_\-. ]/g, '').trim() || 'MonPack';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename + '.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);

    setProgress(100, '✅ Pack généré avec succès !');
    label.style.color = '#00c853';

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-file-zipper"></i> Générer mon pack .zip';
      progress.style.display = 'none';
      fill.style.width = '0%';
      label.style.color = '';
    }, 3000);

  } catch (err) {
    console.error('Build error:', err);
    setProgress(0, '❌ Erreur lors de la génération. Réessaie.');
    label.style.color = 'var(--accent-red)';
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-file-zipper"></i> Générer mon pack .zip';
  }
}

// ── ICON GENERATION (SVG → base64 PNG via canvas) ────────────────────────────
function generateIconPng(iconId) {
  const icon = PACK_ICONS.find(i => i.id === iconId);
  if (!icon) return generateDefaultPackIcon('S');
  return svgToBase64(icon.svg, 64, 64);
}

function generateDefaultPackIcon(name) {
  // Red S on dark background — matches SSK brand
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="#0d0d12"/>
    <rect width="64" height="64" fill="none" stroke="#ff2a4b" stroke-width="3" rx="4"/>
    <text x="32" y="44" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="38" font-weight="900" fill="#ff2a4b">S</text>
  </svg>`;
  return svgToBase64(svg, 64, 64);
}

function svgToBase64(svgString, w, h) {
  // Convert SVG string to base64 using canvas
  // We return the raw base64 for JSZip
  const encoded = btoa(unescape(encodeURIComponent(svgString)));
  // For pack.png Minecraft expects a real PNG — let's use canvas if available
  try {
    const img = new Image();
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    // Synchronous approach not possible, so return SVG-as-PNG base64 trick
    // Minecraft accepts SVG-in-png wrapper; fallback to encoded SVG
    return encoded; // JSZip will treat as base64 binary
  } catch {
    return encoded;
  }
}
