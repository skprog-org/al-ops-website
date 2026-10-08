// 3D field scene at dusk for the About page ("The businesses we build for"): two field engineers beside a substation review a
// transformer that is running warm, while a metro train crosses the viaduct behind them and the city lights come on.
// Same flat night palette and conventions as growth3d.js, outdoors: metres, everything posed from t alone, 12 s seamless loop.
import * as THREE from './vendor/three.module.min.js';
import { span, track, box, cyl, put, flat, walk, cardsAt, mountScene } from './motion.js';
import { N, label, paper, person, checkBadge, city, cityLights, twinkle, nightLights, nightView } from './night.js';

export const LOOP = 12;
export const STILL_T = 9.2;
export const ART_W = 2400, ART_H = 1350;

const C = { ground: 0x131822, road: 0x0f131b, verge: 0x1d2a2e, concrete: 0x343c4f, steel: 0x5b6680, steel2: 0x7f8aa0, tank: 0x4a5470,
  fence: 0x3d4557, porcelain: 0xc9ced8, train: 0xc9ced8, trainBand: 0x27324d, van: 0xdcd6ca, hivis: 0xc8d36a, lamp: 0xffe2a8 };

// ------------------------------------------------------------- the substation
const YARD = { x0: .6, x1: 7.4, z0: -2.6, z1: 1.6 };
const T1 = new THREE.Vector3(2.2, 0, -.6), T2 = new THREE.Vector3(5.2, 0, -.6);
function transformer() {
  const g = new THREE.Group();
  put(g, box(2.2, .25, 1.6, C.concrete, .02), 0, .125, 0);                     // plinth
  put(g, box(1.7, 1.6, 1.1, C.tank, .06, { rough: .8 }), 0, 1.05, 0);         // tank
  for (let i = 0; i < 7; i++) put(g, box(.04, 1.2, .5, C.steel, 0), -.75 + i * .25, 1.0, .85);   // radiator fins
  put(g, cyl(.32, .9, C.tank, 16), -.5, 2.2, -.2).rotation.z = Math.PI / 2;    // conservator
  for (const x of [-.5, 0, .5]) {                                             // bushings
    for (let k = 0; k < 4; k++) put(g, cyl(.09 - k * .01, .1, C.porcelain, 12), x, 1.95 + k * .12, .2);
  }
  const fan = new THREE.Group(); put(g, fan, .62, 1.0, 1.15);
  put(fan, cyl(.22, .06, C.steel2, 18, { cast: false }), 0, 0, 0).rotation.x = Math.PI / 2;
  for (let k = 0; k < 3; k++) { const b = box(.36, .06, .02, C.steel, .01, { cast: false }); b.rotation.z = k * Math.PI / 3; put(fan, b, 0, 0, .05); }
  return { g, fan };
}
function beacon() {
  const m = new THREE.MeshStandardMaterial({ color: N.amber, emissive: N.amber, emissiveIntensity: .8, roughness: .5 });
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .18, 14), m); b.castShadow = true; return b;
}
function substation(root) {
  put(root, flat(YARD.x1 - YARD.x0, YARD.z1 - YARD.z0, 0x232a39, .01), (YARD.x0 + YARD.x1) / 2, 0, (YARD.z0 + YARD.z1) / 2);
  // fence with a gate at the front left
  const post = (x, z) => put(root, box(.06, 2.0, .06, C.fence, 0), x, 1.0, z);
  for (let x = YARD.x0; x <= YARD.x1 + .01; x += .85) { post(x, YARD.z1); post(x, YARD.z0); }
  for (let z = YARD.z0; z <= YARD.z1 + .01; z += .85) { post(YARD.x0, z); post(YARD.x1, z); }
  for (const y of [.15, 1.0, 1.95]) {
    put(root, box(YARD.x1 - YARD.x0 - 1.4, .025, .025, C.fence, 0, { cast: false }), (YARD.x0 + 1.4 + YARD.x1) / 2, y, YARD.z1);
    put(root, box(YARD.x1 - YARD.x0, .025, .025, C.fence, 0, { cast: false }), (YARD.x0 + YARD.x1) / 2, y, YARD.z0);
    for (const x of [YARD.x0, YARD.x1]) put(root, box(.025, .025, YARD.z1 - YARD.z0, C.fence, 0, { cast: false }), x, y, (YARD.z0 + YARD.z1) / 2);
  }
  const mesh = new THREE.MeshStandardMaterial({ color: C.fence, transparent: true, opacity: .18, roughness: 1, depthWrite: false });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(YARD.x1 - YARD.x0 - 1.4, 1.9), mesh); front.renderOrder = 3;
  put(root, front, (YARD.x0 + 1.4 + YARD.x1) / 2, 1.0, YARD.z1 + .01);
  // gantry with insulator strings and lines running off to the left
  for (const x of [1.4, 6.6]) for (const z of [-2.1, -1.5]) put(root, box(.12, 4.6, .12, C.steel2, 0), x, 2.3, z);
  put(root, box(5.5, .18, .8, C.steel2, 0), 4.0, 4.6, -1.8);
  for (const x of [2.6, 4.0, 5.4]) {
    for (let k = 0; k < 5; k++) put(root, cyl(.07, .06, C.porcelain, 10, { cast: false }), x, 4.4 - k * .1, -1.8);
    put(root, box(16, .02, .02, 0x10141c, 0, { cast: false }), x - 8, 3.95, -1.8);
  }
  const t1 = transformer(), t2 = transformer();
  put(root, t1.g, T1.x, 0, T1.z); put(root, t2.g, T2.x, 0, T2.z);
  const b = beacon(); put(root, b, T2.x + .7, 2.05, T2.z + .3);
  put(root, label('T1', .4, .14, { bg: '#262d3c', fg: '#eef1f6', w: 96, h: 32, size: 20, align: 'center' }), T1.x - .45, 1.3, T1.z + .56);
  put(root, label('T2', .4, .14, { bg: '#262d3c', fg: '#eef1f6', w: 96, h: 32, size: 20, align: 'center' }), T2.x - .45, 1.3, T2.z + .56);
  return { fan: t2.fan, beacon: b };
}

// ------------------------------------------------------------- the viaduct and the metro
const VIADUCT = { z: -7.5, y: 3.4 };
function viaduct(root) {
  put(root, box(80, .5, 2.4, C.concrete, .02, { rough: 1 }), 0, VIADUCT.y, VIADUCT.z);
  put(root, box(80, .35, .12, C.steel, 0, { cast: false }), 0, VIADUCT.y + .45, VIADUCT.z + 1.15);
  for (let x = -36; x <= 36; x += 7) put(root, box(.7, VIADUCT.y, .9, C.concrete, .02, { rough: 1 }), x, VIADUCT.y / 2, VIADUCT.z);
  for (let x = -36; x <= 36; x += 3.5) put(root, box(.06, 1.6, .06, C.steel, 0, { cast: false }), x, VIADUCT.y + 1.05, VIADUCT.z - .9);
  put(root, box(80, .03, .03, 0x10141c, 0, { cast: false }), 0, VIADUCT.y + 1.8, VIADUCT.z - .4);
}
function train() {
  const g = new THREE.Group(), windowsM = new THREE.MeshBasicMaterial({ color: 0xffe9bd, fog: false });
  for (let i = 0; i < 3; i++) {
    const car = put(g, new THREE.Group(), i * 6.3, 0, 0);
    put(car, box(6.0, 1.7, 2.1, C.train, .25, { rough: .6 }), 0, .95, 0);
    put(car, box(6.02, .35, 2.12, C.trainBand, .05, { cast: false }), 0, .35, 0);
    for (let w = 0; w < 6; w++) put(car, new THREE.Mesh(new THREE.PlaneGeometry(.7, .5), windowsM), -2.4 + w * .95, 1.15, 1.07);
  }
  return g;
}

// ------------------------------------------------------------- the field crew
function hardHat(p, color = 0xf2f4f5) {
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color, roughness: .4 }));
  cap.castShadow = true; put(p.userData.head, cap, 0, .02, 0);
  put(p.userData.head, cyl(.17, .015, color, 20), 0, .02, .02);
  return p;
}
function vest(p) {                           // hi-vis vest with a reflective band over the jacket
  put(p, box(.48, .46, .29, C.hivis, .08), 0, 1.24, 0);
  put(p, box(.49, .035, .3, 0xe6eef0, .01, { cast: false }), 0, 1.2, 0);
  return p;
}
function van() {
  const g = new THREE.Group();
  put(g, box(4.6, 1.9, 1.9, C.van, .18, { rough: .7 }), 0, 1.35, 0);
  put(g, box(1.2, .8, 1.86, 0x1a2236, .1, { cast: false }), -1.95, 1.75, 0);
  put(g, box(4.4, .12, .02, N.cardBlue, 0, { cast: false }), 0, 1.1, .96);
  for (const x of [-1.5, 1.5]) for (const z of [-.85, .85]) { const w = cyl(.38, .26, 0x14181c, 16); w.rotation.x = Math.PI / 2; put(g, w, x, .38, z); }
  return g;
}
function streetLight(root, x, z) {
  put(root, cyl(.06, 5, C.steel, 10), x, 2.5, z);
  put(root, box(.9, .1, .25, C.steel, .02), x + .4, 5, z);
  put(root, box(.5, .03, .18, C.lamp, 0, { cast: false, material: new THREE.MeshBasicMaterial({ color: C.lamp, fog: false }) }), x + .6, 4.94, z);
}

function buildScene() {
  const scene = new THREE.Scene();
  nightLights(scene, { left: -14, right: 14 });
  const root = new THREE.Group(); scene.add(root);
  const lights = cityLights();
  city(root, lights, { dx: -1, dy: 4.6 });
  put(root, flat(120, 60, C.ground), 0, 0, 0);
  put(root, flat(120, 3.2, C.road, .005), 0, 0, 4.2);
  for (let x = -40; x < 40; x += 4) put(root, flat(2, .12, N.line, .01), x, 0, 4.2);
  viaduct(root);
  const sub = substation(root);
  put(root, van(), -5.6, 0, 1.3, .1);
  streetLight(root, -9.5, 2.9); streetLight(root, 9.6, 2.9);
  const a = {
    lead: vest(hardHat(person({ top: N.topNavy, skin: N.skin1, hair: N.hair1 }))),
    second: vest(hardHat(person({ top: N.topGrey, skin: N.skin2, hair: N.hair2, bun: true }), N.accent)),
    drawing: paper(3), tablet: new THREE.Group(), check: checkBadge(),
    train: train(), lights, sub, root,
  };
  put(a.tablet, box(.3, .02, .22, 0x101521, .01), 0, 0, 0);
  put(a.tablet, new THREE.Mesh(new THREE.BoxGeometry(.26, .004, .18), new THREE.MeshStandardMaterial({ color: N.cardBlue, emissive: N.cardBlue, emissiveIntensity: .5 })), 0, .012, 0);
  a.drawing.scale.setScalar(1.4);
  for (const k of ['lead', 'second', 'drawing', 'tablet', 'check', 'train']) root.add(a[k]);
  put(root, a.second, -2.3, 0, 2.3, Math.PI * .7);
  return { scene, actors: a };
}

// ------------------------------------------------------------- motion
// the lead engineer walks from the van to the substation gate to look at T2, then comes back to agree the plan
const AT_VAN = new THREE.Vector3(-1.4, 0, 2.5), AT_GATE = new THREE.Vector3(1.05, 0, 2.35);
function leadAt(t) {
  const go = span(t, 3.0, 4.6, 'inOut'), back = span(t, 7.4, 9.0, 'inOut');
  const P = Math.PI, ry = track([[0, -P / 2 - .3], [2.8, -P / 2 - .3], [3.1, P / 2], [4.6, P / 2], [4.9, P - .5], [7.2, P - .5], [7.5, 3 * P / 2], [9.0, 3 * P / 2], [9.3, 3 * P / 2 - .3], [12, 3 * P / 2 - .3]], t);
  return { p: AT_VAN.clone().lerp(AT_GATE, go - back), ry, moving: Math.max(Math.sin(Math.PI * go), Math.sin(Math.PI * back)) };
}

function pose(a, t) {
  t = ((t % LOOP) + LOOP) % LOOP;

  // a metro crosses the viaduct twice per loop, off screen at both ends
  a.train.position.set(-34 + 68 * ((2 * t / LOOP) % 1), VIADUCT.y + .3, VIADUCT.z + .1);

  // T2: amber while it runs warm; once the fan is repaired it spins and the beacon turns seafoam
  const repaired = span(t, 8.6, 9.0, 'linear') * (1 - span(t, 11.4, 11.9, 'linear'));
  const m = a.sub.beacon.material, pulse = .5 + .5 * Math.sin(t * Math.PI * 2);
  m.color.setHex(N.amber).lerp(new THREE.Color(N.accent), repaired); m.emissive.copy(m.color); m.emissiveIntensity = .5 + .7 * pulse * (1 - repaired);
  a.sub.fan.rotation.z = Math.PI * 2 * 6 * span(t, 8.6, 12, 'linear');           // whole turns only, so the loop stays seamless
  const ck = span(t, 9.0, 9.35, 'back') * (1 - span(t, 11.0, 11.3, 'out'));
  a.check.position.set(T2.x + .7, 2.55, T2.z + .3); a.check.scale.setScalar(Math.max(.001, ck * 1.4)); a.check.visible = ck > .01;

  // lead engineer with the drawing
  const l = leadAt(t), lead = a.lead, u = lead.userData;
  lead.position.copy(l.p); lead.rotation.y = l.ry;
  walk(lead, t * Math.PI * 2 * 1.4, Math.min(1, l.moving * 1.6));
  const point = span(t, 4.9, 5.3) * (1 - span(t, 6.6, 7.0));
  u.armL.rotation.x = -1.0; u.armR.rotation.x = l.moving > .02 ? u.armR.rotation.x : -1.0 - 1.0 * point;
  u.armL.rotation.z = .3; u.head.rotation.x = .3 * (1 - point);
  a.root.updateMatrixWorld(true);
  a.drawing.position.set(l.p.x + Math.sin(l.ry) * .42, 1.12, l.p.z + Math.cos(l.ry) * .42); a.drawing.rotation.set(-.6, l.ry, 0, 'YXZ');

  // second engineer with the tablet, by the van
  const s = a.second.userData, typing = span(t, 1.0, 1.4) * (1 - span(t, 2.4, 2.8)) + span(t, 5.6, 6.0) * (1 - span(t, 7.0, 7.4));
  s.armL.rotation.x = s.armR.rotation.x = -1.0 - .1 * typing * Math.sin(t * Math.PI * 2 / .8); s.armL.rotation.z = .3; s.armR.rotation.z = -.3;
  s.head.rotation.x = .35 * (1 - span(t, 3.2, 3.6) + span(t, 7.4, 7.8)) - .15 * span(t, 9.0, 9.4) * (1 - span(t, 10.6, 11.0));
  const sr = a.second.rotation.y, sp = a.second.position;
  a.tablet.position.set(sp.x + Math.sin(sr) * .42, 1.12, sp.z + Math.cos(sr) * .42); a.tablet.rotation.set(-.55, sr, 0, 'YXZ');

  twinkle(a.lights, t, LOOP);
}

// ------------------------------------------------------------- decisions: AI recommends, a named role decides
export const DECISIONS = [
  { id: 'thermal', show: [.4, 4.2], decide: 1.8,
    anchor: () => [T2.x + .7, 2.15, T2.z + .3], pos: [.40, .04],
    kicker: 'AI exception flag', title: 'Transformer T2 running warm',
    body: 'Top-oil temperature is 9 °C above its seasonal pattern for this load. Recommends an inspection this week (confidence 0.74).',
    role: 'Field engineer', verdict: 'Approved. Inspection brought forward to tonight.', kind: 'approved' },
  { id: 'switch', show: [3.8, 8.0], decide: 5.6,
    anchor: () => [T1.x, 2.4, T1.z], pos: [.66, .04],
    kicker: 'AI recommendation', title: 'Move the load to T1 overnight',
    body: 'Switching both feeders to T1 from 01:00 to 04:00 allows the inspection without interrupting customers.',
    role: 'Control room engineer', verdict: 'Partly overruled: switch only the commercial feeder; the metro feeder stays on T2.', kind: 'overruled' },
  { id: 'done', show: [8.2, 11.6], decide: 9.0,
    anchor: () => [T2.x + .62, 1.0, T2.z + 1.15], pos: [.40, .04],
    kicker: 'AI verification', title: 'Inspection complete',
    body: 'After the cooling fan repair, temperature readings are back within the seasonal band.',
    role: 'Field engineer', verdict: 'Approved. Work order closed with photos attached.', kind: 'approved' },
];

export const create = (canvas, opts) => nightView(canvas, buildScene(), pose, { target: [.4, 2.9, -1], offset: [1.8, 1.4, 24.5] }, opts);
export const decisionsAt = t => cardsAt(DECISIONS, LOOP, t);
export const mount = fig => mountScene(fig, { create, DECISIONS, decisionsAt, STILL_T, ART_W, ART_H });
