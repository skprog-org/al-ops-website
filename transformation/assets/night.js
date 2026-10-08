// Shared kit for the night interior scenes (growth3d.js, ops3d.js, cx3d.js): the flat night palette of the reference
// illustration, people in everyday clothes, furniture, the back wall with a window onto the city at dusk, lighting and camera.
import * as THREE from './vendor/three.module.min.js';
import { mat, box, cyl, put, flat } from './motion.js';

// palette: slate navy, periwinkle and paper white
export const N = {
  bg: 0x161b26, wall: 0x1c2230, floor: 0x141923, skirting: 0x232a39,
  board: 0x262d3c, boardEdge: 0x30384a, header: 0x4c5466, card: 0xeeeee8, cardBlue: 0x6889d0, line: 0x8a909c,
  frame: 0x10141c, sill: 0x252b38, tower: 0x1f2a3d, tower2: 0x243049, lit: 0xc3c9d6,
  table: 0x464f62, tableLeg: 0x2b313d, chair: 0x2a2f3a, paper: 0xeeeeea, ink: 0x3c4352, device: 0xd8d2c6, laptop: 0x232833,
  skin1: 0x5a3a28, skin2: 0xe2bc9b, skin3: 0x8a5a3a, skin4: 0xd8b393,
  hair1: 0x1a1412, hair2: 0x7a5236, hair3: 0x3a2618, hair4: 0x17171b,
  topBlue: 0x5b7fcf, topCream: 0xdcd6ca, topNavy: 0x27324d, topGrey: 0x8e99ae, legs: 0x2a2d36, shoe: 0x15171c,
  accent: 0x5ee0cf, amber: 0xf2c46d,
};

// a mono caption on a bar, for board headers and screens
export function labelTexture(text, { bg = '#4c5466', fg = '#c9ceda', w = 256, h = 32, size = 17, align = 'left' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg; g.font = '500 ' + size + 'px ui-monospace, Menlo, monospace'; g.textBaseline = 'middle'; g.textAlign = align;
  g.fillText(text.toUpperCase().split('').join(String.fromCharCode(8202)), align === 'center' ? w / 2 : 12, h / 2 + 1);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function label(text, w, h, o = {}) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: labelTexture(text, o), roughness: .9 }));
}

export function paper(lines = 2) {
  const g = new THREE.Group();
  put(g, box(.44, .006, .31, N.paper, .002, { rough: .95 }), 0, 0, 0);
  for (let i = 0; i < lines; i++) put(g, box(.3 - i * .08, .004, .012, N.ink, 0, { cast: false }), -.04 + i * .04, .005, -.06 + i * .07);
  return g;
}

// ------------------------------------------------------------- people: everyday clothes, faces left plain
export function person({ top, skin, hair, bun = false, legs = N.legs } = {}) {
  const g = new THREE.Group();
  const limb = (r, len, color) => {
    const p = new THREE.Group(), m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mat(color, .95));
    m.position.y = -len / 2 - r * .5; m.castShadow = true; p.add(m); return p;
  };
  const legL = limb(.08, .74, legs), legR = limb(.08, .74, legs);
  put(g, legL, -.1, .9, 0); put(g, legR, .1, .9, 0);
  for (const l of [legL, legR]) put(l, box(.13, .08, .27, N.shoe, .03), 0, -.88, .05);
  put(g, box(.46, .64, .27, top, .11, { rough: .95 }), 0, 1.2, 0);
  const armL = limb(.065, .56, top), armR = limb(.065, .56, top);
  put(g, armL, -.29, 1.47, 0); put(g, armR, .29, 1.47, 0);
  for (const a of [armL, armR]) { const h = new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 8), mat(skin, .9)); h.castShadow = true; put(a, h, 0, -.68, 0); }
  const hand = put(armR, new THREE.Object3D(), 0, -.74, .03);
  put(g, cyl(.055, .1, skin, 10), 0, 1.54, 0);
  const head = put(g, new THREE.Group(), 0, 1.68, 0);
  const face = new THREE.Mesh(new THREE.SphereGeometry(.12, 18, 14), mat(skin, .9)); face.castShadow = true; head.add(face);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.128, 18, 10, 0, Math.PI * 2, 0, Math.PI * .62), mat(hair, .9));
  cap.rotation.x = -.7; cap.position.set(0, .012, -.014); head.add(cap);       // covers the crown and the back, leaves the face
  if (bun) put(head, new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 10), mat(hair, .9)), 0, .1, -.1);
  Object.assign(g.userData, { legL, legR, armL, armR, head, hand });
  return g;
}
export const SEATED = -.42;                           // seated on a 0.46 m chair: the body sits this much lower
export function seat(p) {                             // thighs forward, hands toward the table
  const u = p.userData;
  u.legL.rotation.x = u.legR.rotation.x = -Math.PI / 2; u.armL.rotation.x = u.armR.rotation.x = -1.15; u.armL.rotation.z = -.12; u.armR.rotation.z = .12;
  return p;
}
export function chair(facing = 0) {
  const g = new THREE.Group();
  put(g, box(.48, .05, .46, N.chair, .02), 0, .46, 0);
  put(g, box(.46, .5, .04, N.chair, .02), 0, .76, -.22);
  for (const [x, z] of [[-.21, -.2], [.21, -.2], [-.21, .2], [.21, .2]]) put(g, box(.035, .46, .035, N.chair, .01), x, .23, z);
  g.rotation.y = facing; return g;
}
export function checkBadge(color = N.accent) {
  const g = new THREE.Group();
  const disc = cyl(.15, .04, color, 28, { material: mat(color, .4, { emissive: color, emissiveIntensity: .45 }) });
  disc.rotation.x = Math.PI / 2; g.add(disc);
  const a = box(.036, .09, .02, N.bg, .008, { cast: false }); a.position.set(-.036, -.012, .027); a.rotation.z = Math.PI / 4;
  const b = box(.036, .156, .02, N.bg, .008, { cast: false }); b.position.set(.03, .018, .027); b.rotation.z = -Math.PI / 5.5;
  g.add(a, b); return g;
}
// an office desk with a monitor on its far side; the person working at it sits on the +z side, facing the wall
export function desk(root, x, z, { monitor = true } = {}) {
  put(root, box(1.5, .05, .7, N.table, .02), x, .74, z);
  for (const dx of [-.68, .68]) put(root, box(.05, .72, .6, N.tableLeg, .01), x + dx, .36, z);
  if (!monitor) return null;
  const m = new THREE.MeshStandardMaterial({ color: N.cardBlue, emissive: N.cardBlue, emissiveIntensity: .25, roughness: .6 });
  put(root, box(.58, .36, .06, 0x2c3342, .02), x, 1.03, z - .16);              // monitor back, seen from the room
  put(root, new THREE.Mesh(new THREE.PlaneGeometry(.5, .28), m), x, 1.03, z - .2, Math.PI);   // the screen faces the person
  put(root, box(.06, .14, .06, 0x1a1f2a, .01), x, .82, z - .2);
  return m;
}

// a wall display: an edge, a dark panel slightly proud of the wall
export function wallScreen(root, { x, y, w, h, z = 0 }) {
  put(root, box(w + .05, h + .05, .05, N.boardEdge, .03), x, y, z + .02);
  put(root, box(w, h, .06, N.board, .025, { rough: .85 }), x, y, z + .03);
}

// ------------------------------------------------------------- the back wall, its window, and the city beyond
let hashI = 0; const rnd = () => { const x = Math.sin(++hashI * 12.9898) * 43758.5453; return x - Math.floor(x); };
function skyTexture() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d'), grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#2b3553'); grd.addColorStop(.55, '#46506a'); grd.addColorStop(.85, '#7a7a84'); grd.addColorStop(1, '#a08f80');
  g.fillStyle = grd; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const TOWERS = [[-1.4, 1.1, 2.0, -11], [.9, 2.9, 1.9, -12], [2.9, .6, 1.6, -10], [4.6, 2.0, 1.2, -11.5], [6.4, -.2, 1.9, -10],
  [8.2, 3.0, 2.0, -12], [10.0, .8, 1.5, -10.5], [11.8, 2.4, 1.6, -12], [1.6, -.4, 2.6, -16], [7.0, 1.4, 2.8, -17], [10.4, 1.6, 2.0, -18]];
// towers with lit windows; `lights` are shared materials the scene brightens and dims over the loop. dx shifts the skyline
export function sky(root, { dx = 0, dy = 0 } = {}) {
  put(root, new THREE.Mesh(new THREE.PlaneGeometry(90, 34), new THREE.MeshBasicMaterial({ map: skyTexture(), fog: false })), 3 + dx, 5.5 + dy, -40);
}
export function city(root, lights, { dx = 0, dy = 0 } = {}) {
  hashI = 0;
  sky(root, { dx, dy });
  TOWERS.forEach(([x, h, w, z], i) => {
    const base = -5.5, d = 2.2, color = i % 3 ? N.tower : N.tower2;
    x += dx; h += dy;
    put(root, box(w, h - base, d, color, .02, { cast: false, rough: 1 }), x, base + (h - base) / 2, z);
    for (let yy = h - .45; yy > -3; yy -= .56) for (let xx = -w / 2 + .3; xx < w / 2 - .2; xx += .44) {
      if (rnd() > .5) continue;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.13, .16), lights[Math.floor(rnd() * lights.length)]);
      put(root, m, x + xx, yy, z + d / 2 + .01);
    }
  });
}
export function cityLights(n = 4) { return Array.from({ length: n }, () => new THREE.MeshBasicMaterial({ color: N.lit, fog: false })); }
export function twinkle(lights, t, loop) {
  lights.forEach((m, i) => { const k = .55 + .45 * (.5 + .5 * Math.sin(t * Math.PI * 2 * (i + 1) / loop + i * 1.7)); m.color.setHex(N.lit).multiplyScalar(k); });
}

// floor, back wall at z = 0 cut around the window, frame, mullions and sill. win: { x0, x1, y0, y1, panes }
export function backWall(root, win, { wall = N.wall, floor = N.floor } = {}) {
  put(root, flat(60, 40, floor), 0, 0, 8);
  const Z = -.1, T = .2, H = 9;
  put(root, box(20, H, T, wall, 0, { rough: 1 }), win.x0 - 10, H / 2, Z);
  put(root, box(20, H, T, wall, 0, { rough: 1 }), win.x1 + 10, H / 2, Z);
  put(root, box(win.x1 - win.x0, win.y0, T, wall, 0, { rough: 1 }), (win.x0 + win.x1) / 2, win.y0 / 2, Z);
  put(root, box(win.x1 - win.x0, H - win.y1, T, wall, 0, { rough: 1 }), (win.x0 + win.x1) / 2, (H + win.y1) / 2, Z);
  put(root, box(40, .1, .03, N.skirting, 0, { cast: false }), 0, .05, .01);
  const fx = (win.x0 + win.x1) / 2, fw = win.x1 - win.x0, panes = win.panes || 3;
  put(root, box(fw + .12, .08, .12, N.frame, .01), fx, win.y1 + .02, 0);
  put(root, box(fw + .24, .07, .2, N.sill, .01), fx, win.y0 - .035, .04);
  for (const x of [win.x0 - .03, win.x1 + .03]) put(root, box(.07, win.y1 - win.y0 + .1, .12, N.frame, .01), x, (win.y0 + win.y1) / 2, 0);
  for (let k = 1; k < panes; k++) put(root, box(.045, win.y1 - win.y0, .06, N.frame, 0), win.x0 + fw * k / panes, (win.y0 + win.y1) / 2, -.02);
}

// soft key light from the upper left, sky fill, and a cool glow through the window
export function nightLights(scene, { left = -9, right = 9 } = {}) {
  scene.background = new THREE.Color(N.bg);
  scene.add(new THREE.HemisphereLight(0xc4cee6, 0x2a3040, 1.6));
  const key = new THREE.DirectionalLight(0xe6ebf5, .9);
  key.position.set(-5, 9, 9); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0004; key.shadow.normalBias = .02;
  Object.assign(key.shadow.camera, { left, right, top: 7, bottom: -4, near: 1, far: 30 });
  scene.add(key);
  const windowGlow = new THREE.DirectionalLight(0x8e96b8, .45); windowGlow.position.set(3, 3, -6); scene.add(windowGlow);
}

// renderer and a near eye-level perspective camera; pose(actors, t) places everything for time t
export function nightView(canvas, { scene, actors }, pose, { target, offset, fov = 26 }, { pixelRatio = 1, preserve = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: preserve });
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const camera = new THREE.PerspectiveCamera(fov, 16 / 9, .1, 200);
  const at = new THREE.Vector3(...target);
  camera.position.copy(at).add(new THREE.Vector3(...offset));
  camera.lookAt(at);
  function size(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const v3 = new THREE.Vector3();
  return {
    size,
    renderAt(t) { pose(actors, t); renderer.render(scene, camera); },
    project(x, y, z, w, h) { v3.set(x, y, z).project(camera); return { x: (v3.x + 1) / 2 * w, y: (1 - v3.y) / 2 * h }; },
    dispose() { renderer.dispose(); },
  };
}
