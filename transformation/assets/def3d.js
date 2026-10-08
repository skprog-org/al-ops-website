// 3D readiness planning room for the Defense & Intelligence page ("Strengthen readiness"): three planners work around a table with
// a map and maintenance records, a readiness board shows six aircraft, and an interior window looks into a maintenance hangar.
// Generic and illustrative: no real units, aircraft types or systems. Same conventions as growth3d.js: metres, posed from t alone.
import * as THREE from './vendor/three.module.min.js';
import { span, track, box, cyl, put, flat, walk, cardsAt, mountScene } from './motion.js';
import { N, label, paper, person, checkBadge, wallScreen, backWall, nightLights, nightView } from './night.js';

export const LOOP = 12;
export const STILL_T = 9.6;
export const ART_W = 2400, ART_H = 1350;

const C = { hangarFloor: 0x2c3343, hangarWall: 0x2a3142, airframe: 0xa3adbf, airframe2: 0x7f8aa0, glass: 0x1a2236, tyre: 0x14181c,
  stand: 0xc9a55a, lamp: 0xe8ecf4, ready: 0x4f9c8f, down: 0xc96b5e, map: 0xd9d6cc };

// ------------------------------------------------------------- readiness board
const BOARD = { x: -3.55, y: 3.3, w: 3.5, h: 1.75 };
const AIRCRAFT = ['201', '203', '207', '209', '211', '214'];
const START = ['ready', 'ready', 'limited', 'ready', 'down', 'ready'];
const tilePos = i => new THREE.Vector3(BOARD.x - 1.05 + (i % 3) * 1.05, BOARD.y + .12 - Math.floor(i / 3) * .62, .075);
const STATUS = { ready: C.ready, limited: N.amber, down: C.down };

// ------------------------------------------------------------- the hangar, seen through the interior window
const WIN = { x0: -.4, x1: 5.5, y0: 1.2, y1: 4.2, panes: 4 };
function aircraft() {                   // a generic high-wing twin turboprop, nose toward -x; origin on the floor under the wing
  const g = new THREE.Group();
  const fus = cyl(1.3, 15, C.airframe, 24, { cast: false }); fus.rotation.z = Math.PI / 2; put(g, fus, 0, 2.4, 0);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.3, 20, 14), new THREE.MeshStandardMaterial({ color: C.airframe, roughness: .8 }));
  nose.scale.set(1.6, 1, 1); put(g, nose, -7.5, 2.4, 0);
  put(g, box(.9, .5, 2.2, C.glass, .1, { cast: false }), -8.3, 3.0, 0);                 // cockpit glazing
  const tail = new THREE.Mesh(new THREE.ConeGeometry(1.3, 4.5, 20), new THREE.MeshStandardMaterial({ color: C.airframe, roughness: .8 }));
  tail.rotation.z = -Math.PI / 2; tail.scale.set(1, 1, .9); put(g, tail, 9.6, 2.9, 0);
  put(g, box(3.2, 4.2, .3, C.airframe2, .1, { cast: false }), 10.4, 5.4, 0);           // fin
  put(g, box(2.6, .25, 8, C.airframe2, .08, { cast: false }), 10.8, 3.6, 0);           // tailplane
  put(g, box(3.2, .35, 24, C.airframe, .1, { cast: false }), -.6, 3.9, 0);             // wing
  const props = [];
  for (const z of [-4.6, 4.6]) {
    const n = cyl(.65, 4.2, C.airframe2, 18, { cast: false }); n.rotation.z = Math.PI / 2; put(g, n, -1.4, 3.5, z);
    const hub = put(g, new THREE.Group(), -3.6, 3.5, z);
    for (let k = 0; k < 2; k++) { const b = box(.08, 3.6, .3, 0x2a2f3a, .04, { cast: false }); b.rotation.x = k * Math.PI / 2; hub.add(b); }   // four blades
    props.push(hub);
  }
  for (const [x, z] of [[-6.2, 0], [.6, -1.6], [.6, 1.6]]) { const w = cyl(.5, .4, C.tyre, 16, { cast: false }); w.rotation.x = Math.PI / 2; put(g, w, x, .5, z); put(g, box(.15, 1.4, .15, C.airframe2, 0, { cast: false }), x, 1.2, z); }
  const cowl = put(g, new THREE.Group(), -1.4, 4.15, 4.6);                         // an open engine cowling panel
  put(cowl, box(3.0, .06, 1.1, C.airframe2, .02, { cast: false }), 0, 0, .55);
  return { g, props, cowl };
}
function hangar(world) {
  const root = put(world, new THREE.Group(), 2.6, .25, -7.5);      // built at full size, then scaled down and set back
  root.scale.setScalar(.3);
  put(root, flat(70, 50, C.hangarFloor), 0, 0, 0);
  put(root, box(80, 30, .5, C.hangarWall, 0, { cast: false, rough: 1 }), 0, 15, -20);
  for (let x = -24; x <= 24; x += 8) put(root, flat(.3, 30, 0x4c5466, .02), x, 0, -5);
  for (let x = -30; x <= 30; x += 6) put(root, box(.4, 30, .3, 0x353d50, 0, { cast: false }), x, 15, -19.6);    // wall ribs
  const lamps = [];
  for (let x = -20; x <= 20; x += 10) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(5, .3, .3), new THREE.MeshBasicMaterial({ color: C.lamp, fog: false }));
    put(root, m, x, 16, -19.6); lamps.push(m);
    put(root, flat(9, 9, 0x323a4c, .01), x, 0, -9);             // pools of light on the floor
  }
  const ac = aircraft(); put(root, ac.g, 0, 0, -6, .18);
  // a work stand at the left engine with a platform that rises and lowers
  const stand = put(root, new THREE.Group(), -1.6, 0, -6 + 6.8);
  for (const [x, z] of [[-1.2, -.8], [1.2, -.8], [-1.2, .8], [1.2, .8]]) put(stand, box(.15, 3.4, .15, C.stand, 0, { cast: false }), x, 1.7, z);
  const deck = put(stand, box(2.8, .2, 2, C.stand, .02, { cast: false }), 0, 2, 0);
  const tech = person({ top: N.topGrey, skin: N.skin3, hair: N.hair1 }); put(root, tech, -9.5, 0, 2.5);
  return { ac, deck, tech, root };
}

// ------------------------------------------------------------- the room
const TABLE = { x: -1.55, z: 2.35, w: 1.9, d: 1.05, top: .95 };
function mapTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 288;
  const g = c.getContext('2d'); g.fillStyle = '#d9d6cc'; g.fillRect(0, 0, 512, 288);
  g.strokeStyle = 'rgba(60,67,82,.5)'; g.lineWidth = 2;
  for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(0, 20 + i * 32); for (let x = 0; x <= 512; x += 32) g.lineTo(x, 20 + i * 32 + 9 * Math.sin(x / 60 + i)); g.stroke(); }
  g.fillStyle = '#6889d0'; for (const [x, y] of [[120, 90], [300, 160], [410, 70]]) { g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function room(root) {
  backWall(root, WIN);
  wallScreen(root, BOARD);
  put(root, label('Readiness · next 14 days', 2.0, .12, { w: 560 }), BOARD.x - BOARD.w / 2 + 1.15, BOARD.y + BOARD.h / 2 - .2, .065);
  const tiles = AIRCRAFT.map((n, i) => {
    const m = new THREE.MeshStandardMaterial({ color: STATUS[START[i]], roughness: .95 });
    const p = tilePos(i); put(root, new THREE.Mesh(new THREE.BoxGeometry(.92, .5, .02), m), p.x, p.y, p.z);
    put(root, label(n, .34, .11, { bg: '#262d3c', fg: '#eef1f6', w: 96, h: 32, size: 20 }), p.x - .22, p.y + .1, p.z + .012);
    return m;
  });
  // standing planning table with a map and maintenance records
  put(root, box(TABLE.w, .05, TABLE.d, N.table, .02), TABLE.x, TABLE.top, TABLE.z);
  for (const dx of [-.8, .8]) put(root, box(.07, TABLE.top, .07, N.tableLeg, .01), TABLE.x + dx, TABLE.top / 2, TABLE.z);
  const map = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .62), new THREE.MeshStandardMaterial({ map: mapTexture(), roughness: .95 }));
  map.rotation.x = -Math.PI / 2; put(root, map, TABLE.x - .15, TABLE.top + .03, TABLE.z, 0); map.rotation.z = .06;
  for (let i = 0; i < 3; i++) put(root, paper(2), TABLE.x + .6, TABLE.top + .03 + i * .008, TABLE.z + .1 - i * .02, .1 * i);
  return { tiles };
}

function buildScene() {
  const scene = new THREE.Scene();
  nightLights(scene);
  const root = new THREE.Group(); scene.add(root);
  const h = hangar(root);
  const { tiles } = room(root);
  const a = {
    maint: person({ top: N.topNavy, skin: N.skin2, hair: N.hair2 }),
    readiness: person({ top: N.topBlue, skin: N.skin1, hair: N.hair1, bun: true }),
    logistics: person({ top: N.topCream, skin: N.skin4, hair: N.hair4 }),
    record: paper(2), check: checkBadge(), tiles, h, root,
  };
  for (const k of ['maint', 'readiness', 'logistics', 'record', 'check']) root.add(a[k]);
  put(root, a.maint, TABLE.x, 0, TABLE.z - .8, 0);
  put(root, a.logistics, TABLE.x + 1.35, 0, TABLE.z, -Math.PI / 2);
  return { scene, actors: a };
}

// ------------------------------------------------------------- motion
// the readiness planner steps from the table to the board to check aircraft 207 and 211, then returns
const RP_TABLE = new THREE.Vector3(TABLE.x - 1.35, 0, TABLE.z), RP_BOARD = new THREE.Vector3(BOARD.x + .2, 0, 1.15);
function readinessAt(t) {
  const go = span(t, 3.4, 4.8, 'inOut'), back = span(t, 6.4, 7.8, 'inOut');
  const P = Math.PI, ry = track([[0, P / 2], [3.2, P / 2], [3.5, P + .6], [4.8, P + .6], [5.0, P], [6.2, P], [6.5, .4], [7.8, .4], [8.1, P / 2], [12, P / 2]], t);
  return { p: RP_TABLE.clone().lerp(RP_BOARD, go - back), ry, moving: Math.max(Math.sin(Math.PI * go), Math.sin(Math.PI * back)) };
}
const RECORD_A = new THREE.Vector3(TABLE.x - .15, TABLE.top + .04, TABLE.z - .3), RECORD_B = new THREE.Vector3(TABLE.x + .55, TABLE.top + .04, TABLE.z - .1);
const recordAt = t => RECORD_A.clone().lerp(RECORD_B, span(t, 1.6, 2.4) * (1 - span(t, 10.6, 11.4)));

function pose(a, t) {
  t = ((t % LOOP) + LOOP) % LOOP;

  // board: 211 moves from down to limited once the part transfer is approved
  const fixed = span(t, 9.2, 9.6, 'linear') * (1 - span(t, 11.4, 11.9, 'linear'));
  a.tiles[4].color.setHex(C.down).lerp(new THREE.Color(N.amber), fixed);
  const pulse = .5 + .5 * Math.sin(t * Math.PI * 2);
  a.tiles[2].emissive.setHex(N.amber).multiplyScalar(.25 * pulse * span(t, 4.6, 5.0) * (1 - span(t, 6.4, 6.8)));
  const ck = span(t, 9.4, 9.75, 'back') * (1 - span(t, 11.0, 11.3, 'out'));
  const tp = tilePos(4); a.check.position.set(tp.x + .38, tp.y + .2, tp.z + .05); a.check.scale.setScalar(Math.max(.001, ck * .8)); a.check.visible = ck > .01;

  // the maintenance planner slides the assembled record across; the logistics officer reviews it and checks the part on a tablet
  a.record.position.copy(recordAt(t)); a.record.rotation.y = .15;
  const mu = a.maint.userData, slide = span(t, 1.4, 1.8) * (1 - span(t, 2.4, 2.8));
  mu.armR.rotation.x = -.6 - .5 * slide; mu.armL.rotation.x = -.6; mu.head.rotation.x = .35;
  mu.head.rotation.y = -.6 * span(t, 4.4, 4.8) * (1 - span(t, 6.6, 7.0));
  const lu = a.logistics.userData, tablet = span(t, 7.6, 8.0) * (1 - span(t, 9.4, 9.8));
  lu.armL.rotation.x = lu.armR.rotation.x = -.5 - .6 * tablet; lu.head.rotation.x = .3 + .1 * tablet;
  lu.head.rotation.y = .4 * span(t, 9.4, 9.8) * (1 - span(t, 10.8, 11.2));

  const r = readinessAt(t), rp = a.readiness;
  rp.position.copy(r.p); rp.rotation.y = r.ry;
  walk(rp, t * Math.PI * 2 * 1.4, Math.min(1, r.moving * 1.6));
  const point = span(t, 4.9, 5.2) * (1 - span(t, 6.0, 6.3));
  if (r.moving < .02) { rp.userData.armR.rotation.x = -.5 - 1.3 * point; rp.userData.armL.rotation.x = -.5 * (1 - point); }
  rp.userData.head.rotation.x = -.3 * span(t, 4.7, 5.0) * (1 - span(t, 6.2, 6.5)) + .3 * (1 - span(t, 3.2, 3.5) + span(t, 8.0, 8.3));

  // in the hangar: the work stand platform rises to the open cowling, the technician walks the line with a tablet
  const h = a.h;
  h.deck.position.y = track([[0, 2], [2.0, 2], [3.5, 3.4], [8.5, 3.4], [10, 2], [12, 2]], t);
  h.ac.cowl.rotation.x = -.9 * span(t, 3.6, 4.2) * (1 - span(t, 8.2, 8.8));
  h.ac.props[1].rotation.x = t * Math.PI * 2 / LOOP;      // turned slowly by hand during the check: one turn per loop
  const tu = span(t, 0, 6, 'inOut') * (1 - span(t, 6, 12, 'inOut'));
  h.tech.position.x = -9.5 + 7 * tu;
  h.tech.rotation.y = t < 6 ? Math.PI / 2 : -Math.PI / 2;
  walk(h.tech, t * Math.PI * 2 * 1.2, Math.min(1, Math.sin(Math.PI * tu) * 1.6 + .2));
}

// ------------------------------------------------------------- decisions: AI recommends, a named role decides
export const DECISIONS = [
  { id: 'records', show: [.4, 4.2], decide: 2.4,
    anchor: t => { const p = recordAt(t); return [p.x, p.y, p.z]; }, pos: [.36, .04],
    kicker: 'AI insight', title: 'Records assembled for aircraft 207',
    body: 'Maintenance log, parts status and inspection history combined from three authorized sources. One date conflict found.',
    role: 'Maintenance planner', verdict: 'Accepted. The inspection log is set as the source of record.', kind: 'approved' },
  { id: 'impact', show: [3.8, 8.0], decide: 5.6,
    anchor: () => { const p = tilePos(2); return [p.x, p.y, p.z]; }, pos: [.62, .04],
    kicker: 'AI recommendation', title: 'Bring the 207 inspection forward',
    body: 'Inspecting 207 this week keeps four of six aircraft available for the planned window.',
    role: 'Readiness planner', verdict: 'Overruled: inspect 211 first; its part can arrive sooner.', kind: 'overruled' },
  { id: 'supply', show: [8.1, 11.6], decide: 9.2,
    anchor: () => { const p = tilePos(4); return [p.x, p.y, p.z]; }, pos: [.62, .04],
    kicker: 'AI recommendation', title: 'Transfer the part for 211',
    body: 'A replacement actuator is held at the central depot, two days away. Request the transfer now.',
    role: 'Logistics officer', verdict: 'Approved. Transfer requested; the board is updated.', kind: 'approved' },
];

export const create = (canvas, opts) => nightView(canvas, buildScene(), pose, { target: [-.05, 2.3, 1.3], offset: [.8, .5, 13.2] }, opts);
export const decisionsAt = t => cardsAt(DECISIONS, LOOP, t);
export const mount = fig => mountScene(fig, { create, DECISIONS, decisionsAt, STILL_T, ART_W, ART_H });
