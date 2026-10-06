// Isometric 3D distribution centre at blue hour for the homepage illustration ("A business in motion").
// Real-world scale in metres. Every moving object is posed by renderAt(t) from t alone (12 s loop): no clocks or
// randomness inside, so any moment is seekable and the loop is seamless. build.py renders the static still at STILL_T.
import * as THREE from './vendor/three.module.min.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

export const LOOP = 12;
export const STILL_T = 9.3;
export const ART_W = 2400, ART_H = 1000;

// palette: the site's deep-sea navy and seafoam, with realistic materials lit at dusk
const C = {
  bg: 0x03141e, asphalt: 0x1a3540, apron: 0x2a4855, grass: 0x1b4442, kerb: 0x5c7480,
  paintY: 0xd8c27a, paintW: 0xc8d6da, walkway: 0x2e6f66,
  wall: 0xb7c8cf, joint: 0x8ea3ad, accent: 0x5ee0cf, parapet: 0x9cb0b9, roof: 0x7b919c, sky: 0xa7dbe6, hvac: 0x8697a1,
  seal: 0x0d1820, doorPanel: 0x6c8592, doorDark: 0x07121a, leveler: 0x55646d, bumper: 0x111417,
  glass: 0x113646, glassLit: 0xffe2a8, mullion: 0x2b4552,
  trailer: 0xe2ecef, rib: 0xc9d6db, skirt: 0x253540, chassis: 0x1a2228, tyre: 0x14181c, rim: 0x9aa7af,
  cab: 0x14394c, cab2: 0xd9e1e4, chrome: 0xb6c3ca, lamp: 0xffd38a,
  fork: 0xd9a441, mast: 0x262e35, lpg: 0xd7dde0, wood: 0xa37b4f, carton: 0xc79a62, carton2: 0xb98c56, wrap: 0xe3f1f4,
  hivis: 0xc8e64b, reflect: 0xe6eef0, trousers: 0x1f2b33, skin: 0xd6a77f, skin2: 0x8d5a3b, hat: 0xf2f4f5, hat2: 0x5ee0cf,
  leaf: 0x2a6a5e, leaf2: 0x23594f, trunk: 0x5b4636, pole: 0x56656d, ink: 0x03141e,
};

// ------------------------------------------------------------- easing, tracks, paths
const ease = {
  linear: x => x,
  out: x => 1 - Math.pow(1 - x, 3),
  inOut: x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  back: x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
};
const clamp01 = x => Math.max(0, Math.min(1, x));
const span = (t, a, b, e = 'inOut') => ease[e](clamp01((t - a) / (b - a)));
function track(keys, t) {            // keys: [time, value, easing into this key]
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b[0]) return a[1] + (b[1] - a[1]) * ease[b[2] || 'inOut']((t - a[0]) / (b[0] - a[0]));
  }
  return keys[keys.length - 1][1];
}
const V2 = (x, z) => new THREE.Vector2(x, z);
function bez(p0, p1, p2, p3) {
  return {
    at: u => { const v = 1 - u; return V2(v * v * v * p0.x + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u * u * u * p3.x,
                                            v * v * v * p0.y + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u * u * u * p3.y); },
    tan: u => { const v = 1 - u; return V2(3 * v * v * (p1.x - p0.x) + 6 * v * u * (p2.x - p1.x) + 3 * u * u * (p3.x - p2.x),
                                             3 * v * v * (p1.y - p0.y) + 6 * v * u * (p2.y - p1.y) + 3 * u * u * (p3.y - p2.y)); },
  };
}
const line = (a, b) => bez(a, a.clone().lerp(b, 1 / 3), a.clone().lerp(b, 2 / 3), b);

// forklift route: pick at the outdoor staging row, carry through the drive-in door, reverse out, loop back (heading is continuous)
const FORK_REACH = 1.75;                        // forklift origin to pallet centre
const PICK = V2(9.5, 7.8), DOOR = V2(5.0, 1.3);
const ROUTE = [
  { a: 0.0, b: 0.5, at: PICK, heading: V2(0, -1) },
  { a: 0.5, b: 2.1, path: bez(PICK, V2(9.5, 9.4), V2(9.5, 10.8), V2(11.4, 10.8)), reverse: true },
  { a: 2.1, b: 4.5, path: bez(V2(11.4, 10.8), V2(8.0, 10.8), V2(5.0, 7.4), V2(5.0, 4.2)) },
  { a: 4.5, b: 5.3, path: line(V2(5.0, 4.2), DOOR) },
  { a: 5.3, b: 5.7, at: DOOR, heading: V2(0, -1) },
  { a: 5.7, b: 6.5, path: line(DOOR, V2(5.0, 3.8)), reverse: true },
  { a: 6.5, b: 7.7, path: bez(V2(5.0, 3.8), V2(5.0, 5.2), V2(4.6, 6.2), V2(3.2, 6.2)), reverse: true },
  { a: 7.7, b: 10.5, path: bez(V2(3.2, 6.2), V2(6.2, 6.2), V2(9.5, 12.6), V2(9.5, 10.4)) },
  { a: 10.5, b: 11.4, path: line(V2(9.5, 10.4), PICK) },
  { a: 11.4, b: 12.0, at: PICK, heading: V2(0, -1) },
];
function forkliftPose(t) {
  const s = ROUTE.find(r => t >= r.a && t <= r.b) || ROUTE[0];
  if (!s.path) return { p: s.at, h: s.heading, moving: 0 };
  const u = span(t, s.a, s.b, 'inOut'), tan = s.path.tan(u);
  const dir = tan.clone().divideScalar(tan.length() || 1);
  return { p: s.path.at(u), h: s.reverse ? dir.negate() : dir, moving: Math.sin(Math.PI * u) };
}

// ------------------------------------------------------------- materials and primitives
const mats = new Map();
function mat(color, rough = .7, extra = {}) {
  const key = color + ':' + rough + ':' + JSON.stringify(extra);
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: 0 }, extra)));
  return mats.get(key);
}
const glow = (color, k = 1.4) => mat(color, .5, { emissive: color, emissiveIntensity: k });
function box(w, h, d, color, r = 0.04, o = {}) {
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * .98) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, o.material || mat(color, o.rough));
  m.castShadow = o.cast !== false; m.receiveShadow = true;
  return m;
}
function cyl(r, h, color, seg = 18, o = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(o.r2 == null ? r : o.r2, r, h, seg), o.material || mat(color, o.rough));
  m.castShadow = o.cast !== false; m.receiveShadow = true; return m;
}
function put(parent, obj, x, y, z, ry = 0) { obj.position.set(x, y, z); obj.rotation.y = ry; parent.add(obj); return obj; }
function flat(w, d, color, y = 0, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), o.material || mat(color, .95));
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; return m;
}
function wheel(r, w, dual = false) {
  const g = new THREE.Group();
  for (const dx of dual ? [-w * .55, w * .55] : [0]) {
    const t = cyl(r, w, C.tyre, 20, { rough: .9 }); t.rotation.z = Math.PI / 2; t.position.x = dx; g.add(t);
    const h = cyl(r * .55, w + .02, C.rim, 16, { rough: .4 }); h.rotation.z = Math.PI / 2; h.position.x = dx; g.add(h);
  }
  return g;
}

// soft pools of light on the ground (additive, from a canvas gradient)
let poolTex = null;
function pool(radius, strength = .35, color = C.lamp) {
  if (!poolTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.45, 'rgba(255,255,255,.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    poolTex = new THREE.CanvasTexture(c); poolTex.colorSpace = THREE.SRGBColorSpace;
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({ map: poolTex, color, transparent: true, opacity: strength, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = .03; m.renderOrder = 2; return m;
}

// ------------------------------------------------------------- props
function pallet(seed = 0) {
  const g = new THREE.Group();                       // 1.2 x 1.0 m EUR pallet with a wrapped carton load, origin on the floor
  for (const x of [-.55, 0, .55]) put(g, box(.1, .1, 1.0, C.wood, .01), x, .05, 0);
  for (let i = 0; i < 5; i++) put(g, box(1.2, .024, .14, C.wood, .005), 0, .113, -.43 + i * .215);
  const shades = [C.carton, C.carton2];
  for (let y = 0; y < 3; y++) for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++)
    put(g, box(.38, .34, .47, shades[(i + k + y + seed) % 2], .02), -.395 + i * .395, .125 + .17 + y * .345, -.245 + k * .49);
  const wrap = box(1.22, 1.08, 1.0, C.wrap, .05, { material: mat(C.wrap, .25, { transparent: true, opacity: .22 }), cast: false });
  put(g, wrap, 0, .125 + .54, 0);
  return g;
}

function tree(kind = 0, s = 1) {
  const g = new THREE.Group();
  put(g, cyl(.14, 1.6, C.trunk, 8), 0, .8, 0);
  if (kind === 0) {
    for (const [x, y, z, r] of [[0, 2.6, 0, 1.25], [.6, 2.2, .3, .9], [-.5, 2.3, -.3, .95], [.1, 3.3, -.1, .85]]) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(C.leaf, .85)); m.castShadow = true; put(g, m, x, y, z);
    }
  } else {
    for (const [y, r, h] of [[1.6, 1.3, 1.9], [2.6, 1.0, 1.7], [3.5, .65, 1.4]]) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10), mat(C.leaf2, .85)); m.castShadow = true; put(g, m, 0, y, 0);
    }
  }
  g.scale.setScalar(s); return g;
}

// a 1.75 m worker in hi-vis and hard hat; legs and arms pivot for walking
function person({ vest = C.hivis, hat = C.hat, skin = C.skin, tablet = false } = {}) {
  const g = new THREE.Group();
  const limb = (r, len, color) => { const p = new THREE.Group(); const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mat(color)); m.position.y = -len / 2 - r * .5; m.castShadow = true; p.add(m); return p; };
  const legL = limb(.075, .72, C.trousers), legR = limb(.075, .72, C.trousers);
  put(g, legL, -.1, .9, 0); put(g, legR, .1, .9, 0);
  for (const [l, x] of [[legL, -.1], [legR, .1]]) put(l, box(.12, .08, .26, C.bumper, .03), 0, -.86, .05);
  put(g, box(.42, .58, .24, C.trousers, .08), 0, 1.2, 0);                       // torso
  const v = put(g, box(.44, .5, .26, vest, .08), 0, 1.24, 0);                    // vest
  for (const y of [-.08, .12]) put(v, box(.45, .035, .27, C.reflect, .01, { material: mat(C.reflect, .3, { emissive: C.reflect, emissiveIntensity: .25 }) }), 0, y, 0);
  const armL = limb(.06, .56, vest), armR = limb(.06, .56, vest);
  put(g, armL, -.27, 1.47, 0); put(g, armR, .27, 1.47, 0);
  put(g, cyl(.06, .1, skin, 10), 0, 1.53, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.115, 16, 12), mat(skin)); head.castShadow = true; put(g, head, 0, 1.66, 0);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(hat, .35)); put(g, helmet, 0, 1.69, 0);
  put(g, cyl(.16, .02, hat, 20, { rough: .35 }), 0, 1.69, .02);
  if (tablet) { armR.rotation.x = -1.0; armL.rotation.x = -.9; armL.rotation.z = -.35; put(g, box(.28, .02, .2, C.ink, .01), 0, 1.22, .33).rotation.x = -.5; }
  Object.assign(g.userData, { legL, legR, armL, armR });
  return g;
}

// counterbalance LPG forklift, faces +z; origin on the ground at the drive axle centre
function forklift() {
  const g = new THREE.Group();
  put(g, box(1.12, .62, 2.0, C.fork, .1), 0, .62, -.65);                        // chassis
  put(g, box(1.12, .75, .5, C.mast, .14), 0, .72, -1.55);                       // counterweight
  put(g, box(.9, .35, .55, C.mast, .08), 0, 1.08, -.55);                        // seat housing
  const lpg = cyl(.16, .78, C.lpg, 16, { rough: .35 }); lpg.rotation.z = Math.PI / 2; put(g, lpg, 0, 1.38, -1.3);
  for (const [x, z, r, w] of [[-.48, 0, .33, .26], [.48, 0, .33, .26], [-.46, -1.3, .25, .2], [.46, -1.3, .25, .2]]) put(g, wheel(r, w), x, r, z);
  for (const x of [-.48, .48]) for (const z of [.12, -1.12]) put(g, box(.05, 1.25, .05, C.mast, .02), x, 1.55, z);
  put(g, box(1.02, .05, 1.36, C.mast, .02), 0, 2.18, -.5);                       // overhead guard
  const op = person({ vest: C.hivis }); op.scale.setScalar(.95); put(g, op, 0, .12, -.6);
  op.userData.legL.rotation.x = op.userData.legR.rotation.x = -1.35; op.userData.armL.rotation.x = op.userData.armR.rotation.x = -1.1;
  for (const x of [-.36, .36]) put(g, box(.1, 2.3, .12, C.mast, .02), x, 1.2, .38); // mast
  put(g, box(.82, .08, .12, C.mast, .02), 0, 2.32, .38);
  const carriage = new THREE.Group(); put(g, carriage, 0, 0, 0);
  put(carriage, box(.92, .55, .06, C.mast, .02), 0, .42, .5);
  for (let i = 0; i < 4; i++) put(carriage, box(.9, .02, .02, C.joint, 0, { cast: false }), 0, .25 + i * .12, .535);
  for (const x of [-.3, .3]) put(carriage, box(.12, .045, 1.15, C.mast, .01), x, .06, 1.1);
  g.userData.carriage = carriage;
  return g;
}

// 53 ft box trailer, faces +z (nose toward +z); origin on the ground at the rear doors
function trailer(stripe = C.accent) {
  const g = new THREE.Group(), L = 16.0, W = 2.6, H = 2.75, base = 1.25;
  put(g, box(W, H, L, C.trailer, .05), 0, base + H / 2, L / 2);
  for (let i = 1; i < 34; i++) put(g, box(W + .03, H - .1, .04, C.rib, 0, { cast: false }), 0, base + H / 2, i * L / 34);
  put(g, box(W + .04, .34, L - 1.2, stripe, .02, { cast: false }), 0, base + H - .55, L / 2 + .2);
  put(g, box(W + .02, .25, L, C.chassis, .02), 0, base - .12, L / 2);
  put(g, box(W - .2, .7, 9.0, C.skirt, .02), 0, .75, L / 2 + 1.5);              // side skirts
  for (const z of [1.6, 2.85]) for (const x of [-1.0, 1.0]) put(g, wheel(.5, .28, true), x, .5, z);
  for (const x of [-.9, .9]) put(g, box(.1, 1.1, .1, C.chassis, .02), x, .55, L - 3.6);   // landing gear
  put(g, box(W, .12, .1, C.bumper, .02), 0, .55, -.02);
  for (const x of [-1.05, 1.05]) put(g, box(.14, .08, .03, C.lamp, .01, { material: glow(0xff5a4a, 1.2), cast: false }), x, base + .2, -.03);
  return g;
}

// conventional sleeper tractor, faces +z; origin on the ground at the fifth wheel
function tractor(color = C.cab) {
  const g = new THREE.Group();
  put(g, box(1.0, .3, 6.4, C.chassis, .03), 0, .95, 1.9);
  put(g, box(2.45, 2.1, 1.9, color, .2), 0, 2.3, 2.4);                           // sleeper
  put(g, box(2.45, 1.75, 1.6, color, .18), 0, 2.15, 4.05);                       // cab
  put(g, box(2.2, .75, 1.4, C.glass, .12, { rough: .15 }), 0, 2.75, 4.3);        // windscreen band
  put(g, box(2.2, 1.25, 1.8, color, .25), 0, 1.65, 5.6);                         // hood
  put(g, box(1.6, .9, .1, C.chrome, .03, { rough: .3 }), 0, 1.55, 6.5);          // grille
  for (const x of [-.85, .85]) put(g, box(.24, .12, .06, C.lamp, .02, { material: glow(0xfff1d0, 2.2), cast: false }), x, 1.3, 6.52);
  for (const x of [-1.32, 1.32]) { const tk = cyl(.32, 1.2, C.chrome, 16, { rough: .3 }); tk.rotation.x = Math.PI / 2; put(g, tk, x, .85, 3.3); }
  for (const x of [-1.1, 1.1]) put(g, cyl(.07, 1.8, C.chrome, 10, { rough: .3 }), x, 3.6, 3.25);  // exhaust stacks
  for (const x of [-1.05, 1.05]) put(g, wheel(.52, .32), x, .52, 5.4);
  for (const z of [0, -1.35]) for (const x of [-1.05, 1.05]) put(g, wheel(.52, .3, true), x, .52, z + .3);
  put(g, box(1.6, .1, 1.2, C.chassis, .02), 0, 1.15, 0);                         // fifth wheel
  return g;
}

function rig(cabColor, stripe) {                       // tractor and trailer coupled, faces +z, origin at trailer rear
  const g = new THREE.Group();
  g.add(trailer(stripe));
  put(g, tractor(cabColor), 0, 0, 14.6);
  return g;
}

function car(color) {
  const g = new THREE.Group();
  put(g, box(1.8, .7, 4.5, color, .25), 0, .6, 0);
  put(g, box(1.6, .6, 2.4, C.glass, .25, { rough: .15 }), 0, 1.15, -.2);
  for (const x of [-.82, .82]) for (const z of [1.4, -1.4]) put(g, wheel(.34, .22), x, .34, z);
  for (const x of [-.6, .6]) put(g, box(.3, .1, .05, C.lamp, .02, { material: glow(0xfff1d0, 2), cast: false }), x, .7, 2.26);
  return g;
}

function pin(color = C.accent) {
  const g = new THREE.Group(), m = mat(color, .35, { emissive: color, emissiveIntensity: .25 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(.75, 24, 16), m); head.position.y = 1.25; head.castShadow = true;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.6, 1.25, 24), m); tip.rotation.x = Math.PI; tip.position.y = .52; tip.castShadow = true;
  const dot = new THREE.Mesh(new THREE.SphereGeometry(.3, 16, 12), mat(C.ink, .4)); dot.position.set(0, 1.32, .6);
  g.add(head, tip, dot); return g;
}
function checkBadge() {
  const g = new THREE.Group();
  const disc = cyl(1.0, .26, C.accent, 32, { material: mat(C.accent, .35, { emissive: C.accent, emissiveIntensity: .35 }) });
  disc.rotation.x = Math.PI / 2; g.add(disc);
  const a = box(.24, .6, .12, C.ink, .05, { cast: false }); a.position.set(-.24, -.08, .18); a.rotation.z = Math.PI / 4;
  const b = box(.24, 1.04, .12, C.ink, .05, { cast: false }); b.position.set(.2, .12, .18); b.rotation.z = -Math.PI / 5.5;
  g.add(a, b); g.position.y = 1.2; return g;
}

// ------------------------------------------------------------- the building
const DOCKS = [-21, -16.5, -12, -7.5, -3];         // dock-high doors along the front wall (z = 0)
function building(root) {
  const g = new THREE.Group(); root.add(g);
  const X0 = -25, X1 = 10, D = 22, H = 10.5;
  // tilt-up concrete shell with panel joints and a seafoam band under the parapet
  put(g, box(X1 - X0, H, D, C.wall, .05), (X0 + X1) / 2, H / 2, -D / 2);
  for (let x = X0 + 2.5; x < X1; x += 2.5) put(g, box(.05, H - 1.2, .04, C.joint, 0, { cast: false }), x, (H - 1.2) / 2, .01);
  for (let z = -2.5; z > -D; z -= 2.5) put(g, box(.04, H - 1.2, .05, C.joint, 0, { cast: false }), X1 + .01, (H - 1.2) / 2, z);
  put(g, box(X1 - X0 + .06, .45, .06, C.accent, 0, { cast: false, material: mat(C.accent, .4, { emissive: C.accent, emissiveIntensity: .35 }) }), (X0 + X1) / 2, H - .9, .02);
  put(g, box(.06, .45, D + .06, C.accent, 0, { cast: false, material: mat(C.accent, .4, { emissive: C.accent, emissiveIntensity: .35 }) }), X1 + .02, H - .9, -D / 2);
  // roof: membrane, parapet, skylights, rooftop units
  put(g, box(X1 - X0 - .6, .1, D - .6, C.roof, 0), (X0 + X1) / 2, H + .02, -D / 2);
  for (const [w, d, x, z] of [[X1 - X0, .3, (X0 + X1) / 2, -.15], [X1 - X0, .3, (X0 + X1) / 2, -D + .15], [.3, D, X0 + .15, -D / 2], [.3, D, X1 - .15, -D / 2]])
    put(g, box(w, .7, d, C.parapet, .02), x, H + .35, z);
  for (let x = X0 + 4; x < X1 - 3; x += 5) for (const z of [-6, -12, -18])
    put(g, box(1.6, .3, 3.2, C.sky, .05, { material: mat(C.sky, .3, { emissive: C.sky, emissiveIntensity: .25 }) }), x, H + .2, z);
  for (const [x, z] of [[-14, -9], [-2, -15], [4, -6]]) {
    put(g, box(2.4, 1.1, 1.6, C.hvac, .08), x, H + .6, z);
    put(g, cyl(.45, .08, C.chassis, 18), x + .4, H + 1.18, z);
  }
  // dock-high doors with seals, levelers, bumpers and dock lights
  DOCKS.forEach((x, i) => {
    put(g, box(3.6, 3.7, .35, C.seal, .06), x, 2.95, .15);
    put(g, box(2.9, 2.95, .1, i === 3 ? C.doorDark : C.doorPanel, .02, { cast: false }), x, 2.85, .33);
    if (i !== 3) for (let k = 0; k < 6; k++) put(g, box(2.9, .02, .03, C.joint, 0, { cast: false }), x, 1.55 + k * .5, .39);
    put(g, box(3.0, 1.2, .5, C.leveler, .02), x, .6, .25);
    for (const dx of [-1.25, 1.25]) put(g, box(.3, .45, .22, C.bumper, .04), x + dx, 1.0, .55);
    put(g, box(.5, .14, .3, C.chassis, .03), x + 2.0, 4.6, .3);
    put(g, box(.32, .08, .05, C.lamp, .02, { material: glow(C.lamp, 2.0), cast: false }), x + 2.0, 4.55, .47);
    put(g, box(.8, .45, .05, C.accent, .02, { cast: false }), x, 5.1, .02);  // dock number plate
    put(root, pool(3.4, .5), x, 0, 2.4);
  });
  // drive-in (grade-level) door for the forklift, with bollards
  put(g, box(4.4, 4.7, .2, C.seal, .04), DOOR.x, 2.35, .1);
  put(g, box(4.0, 4.4, .1, C.doorDark, .02, { cast: false }), DOOR.x, 2.2, .22);
  put(g, box(4.0, .5, .08, C.doorPanel, .02, { cast: false }), DOOR.x, 4.2, .28);   // door rolled up
  for (const dx of [-2.5, 2.5]) { const b = cyl(.12, 1.1, C.paintY, 12, { rough: .5 }); put(g, b, DOOR.x + dx, .55, .6); }
  put(root, pool(4.2, .6), DOOR.x, 0, 2.2);
  // glazed office block at the corner
  const ox0 = 10, ox1 = 20, oz0 = -10, oz1 = 1.0, oh = 8;
  put(g, box(ox1 - ox0, oh, oz1 - oz0, C.wall, .05), (ox0 + ox1) / 2, oh / 2, (oz0 + oz1) / 2);
  for (let f = 0; f < 2; f++) for (let i = 0; i < 6; i++) {
    const lit = (i * 3 + f * 5) % 4 !== 0;
    put(g, box(1.45, 2.4, .08, C.glass, .02, { cast: false, material: lit ? glow(C.glassLit, .9) : mat(C.glass, .15) }), ox0 + .95 + i * 1.6, 1.8 + f * 3.4, oz1 + .02);
  }
  for (let f = 0; f < 2; f++) for (let i = 0; i < 6; i++) {
    const lit = (i * 2 + f * 3) % 3 !== 0;
    put(g, box(.08, 2.4, 1.6, C.glass, .02, { cast: false, material: lit ? glow(C.glassLit, .9) : mat(C.glass, .15) }), ox1 + .02, 1.8 + f * 3.4, oz1 - 1.0 - i * 1.75);
  }
  put(g, box(ox1 - ox0 + .1, .45, .08, C.accent, 0, { cast: false, material: mat(C.accent, .4, { emissive: C.accent, emissiveIntensity: .35 }) }), (ox0 + ox1) / 2, oh - .6, oz1 + .03);
  put(g, box(3.4, .18, 2.0, C.parapet, .04), 15, 3.3, oz1 + 1.0);                 // entrance canopy
  for (const dx of [-1.5, 1.5]) put(g, cyl(.06, 3.2, C.pole, 8), 15 + dx, 1.6, oz1 + 1.9);
  put(root, pool(2.6, .32), 15, 0, oz1 + 1.8);
  return g;
}

function lightPole(root, x, z) {
  put(root, cyl(.12, 8.5, C.pole, 10), x, 4.25, z);
  put(root, box(1.2, .2, .45, C.pole, .04), x + .5, 8.5, z);
  put(root, box(.9, .06, .3, C.lamp, .02, { material: glow(0xfff1d0, 2.5), cast: false }), x + .6, 8.38, z);
  put(root, pool(7, .42), x + .6, 0, z);
}

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.bg);
  scene.fog = new THREE.Fog(C.bg, 95, 165);

  scene.add(new THREE.HemisphereLight(0xc4e8ee, 0x0b2a33, 1.55));
  const moon = new THREE.DirectionalLight(0xdcefff, 1.7);
  moon.position.set(-30, 48, 22); moon.castShadow = true;
  moon.shadow.mapSize.set(4096, 4096); moon.shadow.radius = 4; moon.shadow.bias = -0.0003; moon.shadow.normalBias = .03;
  Object.assign(moon.shadow.camera, { left: -50, right: 50, top: 45, bottom: -45, near: 1, far: 140 });
  scene.add(moon);

  // ground: truck court asphalt, concrete apron, verges, road, painted markings, pedestrian walkway
  put(scene, flat(260, 260, C.grass), 0, 0, 0);
  put(scene, flat(58, 32, C.asphalt, .01), -6, 0, 13);
  put(scene, flat(36, 4.5, C.apron, .015), -8, 0, 2.25);
  put(scene, flat(22, 16, C.apron, .015), 13, 0, 7.5);
  put(scene, flat(260, 9, C.asphalt, .012), 0, 0, 27.5);
  for (let x = -120; x < 120; x += 6) put(scene, flat(3, .18, C.paintW, .02), x, 0, 27.5);
  for (const x of DOCKS) for (const dx of [-1.9, 1.9]) put(scene, flat(.14, 17, C.paintY, .02), x + dx, 0, 9);
  for (let i = 0; i < 5; i++) put(scene, flat(1.6, .14, C.paintW, .02), 9.5 + i * 1.6, 0, 5.3);   // staging bays
  put(scene, flat(8.6, .14, C.paintY, .02), 13.0, 0, 5.15); put(scene, flat(8.6, .14, C.paintY, .02), 13.0, 0, 6.85);
  put(scene, flat(10.5, 1.4, C.walkway, .02), 11.6, 0, 2.6);
  for (let x = 7; x < 17; x += .9) put(scene, flat(.45, 1.4, C.paintW, .025), x, 0, 2.6);
  for (let x = 14; x < 28; x += 3.2) put(scene, flat(.14, 5.5, C.paintW, .02), x, 0, 18.5);

  const root = new THREE.Group(); scene.add(root);
  building(root);
  for (const [x, z] of [[-12, 20], [2, 20], [21.5, 11]]) lightPole(root, x, z);

  // trailers backed onto docks 1, 2 and 5; a coupled rig at dock 4 (door open, being loaded)
  [[0, C.accent], [1, 0x2f6fe4], [4, C.accent]].forEach(([i, s]) => put(root, trailer(s), DOCKS[i], 0, .55));
  put(root, rig(C.cab, C.accent), DOCKS[3], 0, .55);

  // staged loads and parked cars
  [[11.1, 6.0], [12.7, 6.0], [14.3, 6.0], [11.1, 7.6], [15.9, 6.0]].forEach(([x, z], i) => put(root, pallet(i), x, 0, z));
  [[15.6, 18.5, 0x8fa3ad], [18.8, 18.5, C.cab], [25.2, 18.5, 0xd9e1e4]].forEach(([x, z, c]) => put(root, car(c), x, 0, z));

  // landscape
  [[-30, 4, 0, 1.1], [-31, 12, 1, 1], [-29, 20, 0, .95], [24, 4, 0, 1.15], [27, 10, 1, 1], [30, 1, 0, 1], [28, 19, 1, .9], [-24, 34, 0, 1], [8, 34, 0, .9]]
    .forEach(([x, z, k, s]) => put(root, tree(k, s), x, 0, z));

  // people: a supervisor at the staging row and a dock worker at the open dock
  put(root, person({ tablet: true, skin: C.skin2, hat: C.hat2 }), 13.4, 0, 9.3, Math.PI * .9);
  put(root, person(), DOCKS[3] + 2.4, 0, 1.6, Math.PI * .2);

  const actors = {
    lift: forklift(), carried: pallet(1), staged: pallet(2), walker: person({ skin: C.skin2 }),
    pinDoor: pin(), pinStage: pin(), check: checkBadge(), road: rig(C.cab2, C.accent), carRoad: car(0x5ee0cf),
  };
  for (const k in actors) root.add(actors[k]);
  return { scene, actors };
}

function walkerAt(t) {
  const out = t < 6, wu = out ? span(t, .3, 5.7, 'inOut') : span(t, 6.3, 11.7, 'inOut');
  const turn = out ? span(t, 5.7, 6.3, 'inOut') : span(t, 11.7, 12, 'inOut');
  return { x: out ? 15.2 - 8.4 * wu : 6.8 + 8.4 * wu, ry: (out ? -Math.PI / 2 : Math.PI / 2) + Math.PI * turn, moving: Math.sin(Math.PI * wu) };
}

// ------------------------------------------------------------- decisions: AI recommends, a named role decides
// Illustrative scenarios for high-volume fulfilment operations. Each card is anchored to a point in the scene,
// shows the AI recommendation, waits for the person who owns the decision, then records what they decided.
// pos: where the card sits, as fractions of the stage (open areas of the scene), linked to its anchor by a leader line.
export const DECISIONS = [
  { id: 'labour', show: [.2, 4.6], decide: 1.6,
    anchor: t => [walkerAt(t).x, 2.0, 2.6], pos: [.37, .07],
    kicker: 'AI recommendation', title: 'Labour rebalance',
    body: 'Outbound wave 3 is two people short for the next 40 min. Move one picker from receiving.',
    role: 'Shift lead', verdict: 'Approved. Picker reassigned to outbound.', kind: 'approved' },
  { id: 'exception', show: [4.9, 9.9], decide: 6.0,
    anchor: () => [DOOR.x, 1.6, .2], pos: [.30, .05],
    kicker: 'AI exception flag', title: 'Damaged wrap on LP-20417',
    body: 'Torn stretch wrap detected at the door camera. Suggests re-wrap before put-away (confidence 0.61).',
    role: 'Supervisor', verdict: 'Overruled after inspection: load intact. Released to put-away.', kind: 'overruled' },
  { id: 'door', show: [7.2, 11.8], decide: 8.6,
    anchor: () => [DOCKS[3], 4.6, .4], pos: [.02, .50],
    kicker: 'AI recommendation', title: 'Door plan change',
    body: 'Carrier for door 4 is running 25 min late. Swap with door 2 to protect the 15:00 dispatch cut-off.',
    role: 'Yard lead', verdict: 'Approved. Carrier notified of the new door.', kind: 'approved' },
];
export function decisionsAt(t) {
  t = ((t % LOOP) + LOOP) % LOOP;
  return DECISIONS.map(d => {
    const [a, b] = d.show;
    const alpha = Math.min(span(t, a, a + .35, 'out'), 1 - span(t, b - .35, b, 'linear'));
    return { id: d.id, alpha: t >= a && t <= b ? alpha : 0, decided: t >= d.decide, pulse: .5 + .5 * Math.sin(t * Math.PI * 2 / .8), at: d.anchor(t) };
  });
}

// ------------------------------------------------------------- frame
function setOpacity(obj, a) {
  obj.visible = a > .002;
  obj.traverse(o => {
    if (!o.material || o.material.blending === THREE.AdditiveBlending) return;
    if (!o.userData.base) o.userData.base = { opacity: o.material.opacity, transparent: o.material.transparent };
    if (o.userData.own !== true) { o.material = o.material.clone(); o.userData.own = true; }
    o.material.opacity = o.userData.base.opacity * a;
    o.material.transparent = o.userData.base.transparent || a < 1;
    o.material.depthWrite = !o.material.transparent;
  });
}

function walk(p, phase, amount) {
  const s = Math.sin(phase) * amount, u = p.userData;
  u.legL.rotation.x = s * .5; u.legR.rotation.x = -s * .5; u.armL.rotation.x = -s * .4; u.armR.rotation.x = s * .4;
}

function pose(a, t) {
  t = ((t % LOOP) + LOOP) % LOOP;

  // forklift
  const f = forkliftPose(t), ry = Math.atan2(f.h.x, f.h.y);
  const bob = f.moving * .012 * Math.sin(t * Math.PI * 2 * 7);
  a.lift.position.set(f.p.x, bob, f.p.y); a.lift.rotation.y = ry;
  const forkY = track([[0, .3], [5.3, .3], [5.7, 0], [11.4, 0], [12, .3]], t);
  a.lift.userData.carriage.position.y = forkY;

  // the carried pallet rides the forks, is set down inside the drive-in door and taken into the building
  const fx = Math.sin(ry), fz = Math.cos(ry);
  if (t < 5.7 || t >= 11.4) {
    a.carried.position.set(f.p.x + fx * FORK_REACH, forkY + bob, f.p.y + fz * FORK_REACH); a.carried.rotation.y = ry; setOpacity(a.carried, 1);
  } else {
    a.carried.position.set(DOOR.x, 0, DOOR.y - FORK_REACH); a.carried.rotation.y = 0;
    setOpacity(a.carried, 1 - span(t, 5.9, 6.7, 'linear'));
  }

  // the next load is set down in the staging bay while the forklift is away
  const shown = t >= 7.0 && t < 11.4, inA = span(t, 7.0, 7.7, 'out');
  a.staged.position.set(PICK.x, 0, PICK.y - FORK_REACH); a.staged.rotation.y = 0;
  setOpacity(a.staged, shown ? inA : 0);

  // pins: the drive-in door waits for its load and turns into a confirmation; the staging pin marks the next pick
  const bounce = .25 * Math.sin(t * Math.PI * 2 / 1.5);
  const confirmed = span(t, 6.0, 6.45, 'back'), revert = span(t, 11.4, 11.8, 'out'), showCheck = t >= 6.0 && t < 11.8;
  a.pinDoor.position.set(DOOR.x, 5.6 + bounce, .8); a.pinDoor.rotation.y = .6;
  a.pinDoor.scale.setScalar(t < 6.0 ? 1 : t >= 11.4 ? Math.max(.001, revert) : .001); a.pinDoor.visible = t < 6.0 || t >= 11.4;
  a.check.position.set(DOOR.x, 5.6 + bounce * .6, .8); a.check.rotation.y = .6;
  a.check.scale.setScalar(showCheck ? Math.max(.001, confirmed * (1 - revert)) : .001); a.check.visible = showCheck;
  const sp = span(t, 7.7, 8.1, 'back') * (1 - span(t, 11.0, 11.4, 'out'));
  a.pinStage.position.set(PICK.x, 2.0 + bounce, PICK.y - FORK_REACH); a.pinStage.rotation.y = .6;
  a.pinStage.scale.setScalar(Math.max(.001, sp)); a.pinStage.visible = sp > .01;

  // a worker walks the pedestrian walkway to the docks (after the labour decision) and back
  const w = walkerAt(t);
  a.walker.position.set(w.x, 0, 2.6); a.walker.rotation.y = w.ry;
  walk(a.walker, t * Math.PI * 2, Math.min(1, w.moving * 1.6));

  // traffic on the road: off screen at both ends, so the loop is seamless
  a.road.position.set(-70 + 140 * (t / LOOP), 0, 29.6); a.road.rotation.y = Math.PI / 2;
  a.carRoad.position.set(70 - 140 * (t / LOOP), 0, 25.6); a.carRoad.rotation.y = -Math.PI / 2;
}

// ------------------------------------------------------------- mount
export function create(canvas, { pixelRatio = 1, preserve = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: preserve });
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const { scene, actors } = buildScene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 400);
  const target = new THREE.Vector3(1.5, 2, 8);
  camera.position.copy(target).add(new THREE.Vector3(48, 58, 70));
  camera.lookAt(target);
  function size(w, h) {
    renderer.setSize(w, h, false);
    const viewH = 21, aspect = w / h;
    Object.assign(camera, { left: -viewH * aspect / 2, right: viewH * aspect / 2, top: viewH / 2, bottom: -viewH / 2 });
    camera.updateProjectionMatrix();
  }
  const v3 = new THREE.Vector3();
  return {
    size,
    renderAt(t) { pose(actors, t); renderer.render(scene, camera); },
    project(x, y, z, w, h) { v3.set(x, y, z).project(camera); return { x: (v3.x + 1) / 2 * w, y: (1 - v3.y) / 2 * h }; },
    dispose() { renderer.dispose(); },
  };
}

// decision cards: HTML over the canvas, positioned each frame by projecting their 3D anchors
function overlay(stage) {
  const NS = 'http://www.w3.org/2000/svg', root = document.createElement('div');
  root.className = 'dc-layer'; root.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'dc-lines'); root.appendChild(svg);
  const items = DECISIONS.map(d => {
    const el = document.createElement('div'); el.className = 'dcard dc-' + d.kind;
    el.innerHTML = '<div class="dc-k"></div><div class="dc-t"></div><div class="dc-b"></div><div class="dc-v"><span class="dc-who"></span><span class="dc-s"></span></div>';
    el.querySelector('.dc-k').textContent = d.kicker; el.querySelector('.dc-t').textContent = d.title;
    el.querySelector('.dc-b').textContent = d.body; el.querySelector('.dc-who').textContent = d.role;
    const ln = document.createElementNS(NS, 'line'), dot = document.createElementNS(NS, 'circle'), ring = document.createElementNS(NS, 'circle');
    dot.setAttribute('r', 3.5); ring.setAttribute('class', 'dc-ring'); svg.append(ln, ring, dot); root.appendChild(el);
    return { d, el, ln, dot, ring, s: el.querySelector('.dc-s'), last: null };
  });
  stage.appendChild(root);
  return function update(view, t, w, h) {
    const k = Math.max(.62, Math.min(1, w / 1300)), compact = w < 640;
    root.style.setProperty('--k', k); root.classList.toggle('is-compact', compact); svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    const all = decisionsAt(t);
    // small screens: only the newest visible card, so the scene stays readable
    let newest = -1; all.forEach((st, i) => { if (st.alpha > .01 && (newest < 0 || DECISIONS[i].show[0] > DECISIONS[newest].show[0])) newest = i; });
    all.forEach((st, i) => {
      const it = items[i], p = view.project(st.at[0], st.at[1], st.at[2], w, h);
      if (compact && i !== newest) st.alpha = 0;
      const show = st.alpha > .01;
      it.el.style.opacity = st.alpha; it.ln.style.opacity = it.dot.style.opacity = it.ring.style.opacity = st.alpha;
      it.el.style.visibility = show ? 'visible' : 'hidden';
      if (!show) return;
      const cw = it.el.offsetWidth, ch = it.el.offsetHeight;
      const x = Math.round(Math.max(6, Math.min(w - cw - 6, compact ? 6 : it.d.pos[0] * w))), y = Math.round(Math.max(6, Math.min(h - ch - 6, compact ? 6 : it.d.pos[1] * h)));
      it.el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      const ex = Math.max(x, Math.min(x + cw, p.x)), ey = Math.max(y, Math.min(y + ch, p.y));   // nearest point on the card
      it.ln.setAttribute('x1', p.x); it.ln.setAttribute('y1', p.y); it.ln.setAttribute('x2', ex); it.ln.setAttribute('y2', ey);
      it.dot.setAttribute('cx', p.x); it.dot.setAttribute('cy', p.y);
      it.ring.setAttribute('cx', p.x); it.ring.setAttribute('cy', p.y); it.ring.setAttribute('r', 5 + 7 * st.pulse);
      it.ring.style.opacity = st.alpha * (1 - st.pulse) * .9;
      if (it.last !== st.decided) {
        it.last = st.decided; it.el.classList.toggle('is-decided', st.decided);
        it.s.textContent = st.decided ? it.d.verdict : 'Awaiting decision';
      }
    });
  };
}

// play the scene inside a figure's .illus-stage; the static image underneath stays as the fallback
export function mount(fig) {
  const stage = fig.querySelector('.illus-stage'), btn = fig.querySelector('[data-motion-toggle]');
  const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true');
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fixed = fig.getAttribute('data-motion-t');            // optional: open paused at a given moment (previews)
  const view = create(canvas, { pixelRatio: Math.min(window.devicePixelRatio || 1, 2) });
  let playing = !still && fixed == null, visible = true, raf = null, t0 = performance.now(), tAt = fixed != null ? +fixed : still ? STILL_T : 0;
  let W = 0, H = 0;
  const now = () => (playing ? tAt + (performance.now() - t0) / 1000 : tAt);
  const fit = () => { W = stage.clientWidth; H = Math.round(W * ART_H / ART_W); view.size(W, H); };
  stage.appendChild(canvas);
  const cards = overlay(stage);
  const draw = () => { const t = now(); view.renderAt(t); cards(view, t, W, H); };
  const frame = () => { draw(); raf = playing && visible ? requestAnimationFrame(frame) : null; };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const label = () => { btn.textContent = playing ? 'Pause animation' : 'Play animation'; btn.setAttribute('aria-pressed', playing ? 'false' : 'true'); };
  fit(); draw();
  requestAnimationFrame(() => { canvas.classList.add('ready'); stage.classList.add('is-live'); });
  if (btn) {
    btn.hidden = false; label();
    btn.addEventListener('click', () => { tAt = now(); playing = !playing; t0 = performance.now(); label(); kick(); });
  }
  window.addEventListener('resize', () => { fit(); draw(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      const was = visible; visible = es[0].isIntersecting;
      if (!visible && was && playing) tAt = now();          // freeze time while off screen
      if (visible && !was) { t0 = performance.now(); kick(); }
    }).observe(stage);
  }
  kick();
}
