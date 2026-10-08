// 3D supply planning room at night for the Supply Chain page ("Build a business that can respond when plans change"): a network
// display shows an inbound shipment delayed, supplier B brought in, and the plant and customer commitments recovered, with a
// container port through the window. Same flat night palette and conventions as growth3d.js: metres, posed from t alone, 12 s loop.
import * as THREE from './vendor/three.module.min.js';
import { span, track, box, cyl, put, flat, setOpacity, walk, cardsAt, mountScene } from './motion.js';
import { N, label, person, SEATED, seat, chair, checkBadge, desk, wallScreen, sky, backWall, nightLights, nightView } from './night.js';

export const LOOP = 12;
export const STILL_T = 8.6;
export const ART_W = 2400, ART_H = 1350;

const C = { sea: 0x0b1120, quay: 0x2a3142, steel: 0x3d4557, crane: 0x8e99ae, hull: 0x27324d, boxes: [0x6889d0, 0xc9b89a, 0x8e99ae, 0x4c5466, 0xdcd6ca, 0x5b7fcf] };

// ------------------------------------------------------------- the network display
const MAP = { x: -2.5, y: 3.2, w: 4.9, h: 1.95 };
const NODE = {                                     // positions on the display
  a: [-4.55, 3.55, 'Supplier A'], b: [-4.55, 2.62, 'Supplier B'], plant: [-2.45, 3.08, 'Plant'],
  dc: [-1.1, 3.08, 'DC'], cust: [-.35, 3.55, 'Customers'],
};
const Z_MAP = .075;
const at = k => new THREE.Vector3(NODE[k][0], NODE[k][1], Z_MAP);
function route(root, p, q, color = N.header) {
  const d = q.clone().sub(p), m = new THREE.MeshStandardMaterial({ color, roughness: .9 });
  const r = new THREE.Mesh(new THREE.BoxGeometry(d.length(), .025, .004), m);
  r.position.copy(p).add(q).multiplyScalar(.5); r.rotation.z = Math.atan2(d.y, d.x); root.add(r); return m;
}
function node(root, k) {
  const [x, y, name] = NODE[k];
  const d = cyl(.09, .02, N.card, 24, { cast: false }); d.rotation.x = Math.PI / 2; put(root, d, x, y, Z_MAP);
  put(root, label(name, .74, .09, { w: 288, h: 34, size: 17, bg: '#262d3c' }), x + (k === 'cust' ? -.3 : .05), y - .17, Z_MAP);
}
const marker = color => { const m = cyl(.06, .03, color, 18, { cast: false, material: new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .4 }) }); m.rotation.x = Math.PI / 2; return m; };

// ------------------------------------------------------------- the port through the window
const WIN = { x0: .9, x1: 6.1, y0: 1.25, y1: 4.15 };
function port(world) {
  sky(world, { dx: 2, dy: -1 });
  const root = put(world, new THREE.Group(), 2.2, .2, -13.7);   // built at full size, then scaled down and set back: a distant quay
  root.scale.setScalar(.32);
  put(root, flat(80, 40, C.sea, -2.2), 4, 0, -48);
  put(root, box(60, .8, 10, C.quay, 0, { cast: false, rough: 1 }), 4, -2.0, -26);
  let k = 0;                                       // container stacks along the quay
  for (let bx = -6; bx < 16; bx += 3.2) {
    const rows = 2 + (k % 3);
    for (let r = 0; r < rows; r++) for (let c = 0; c < 2; c++)
      put(root, box(2.8, .95, 1.1, C.boxes[(k + r * 2 + c) % C.boxes.length], .03, { cast: false, rough: 1 }), bx, -1.1 + r * .97, -23.5 - c * 1.15);
    k++;
  }
  put(root, box(16, 2.2, 3.2, C.hull, .1, { cast: false }), 9, -1.2, -31);   // a ship at the berth
  put(root, box(3, 2.4, 2.6, C.crane, .05, { cast: false }), 14.5, 1.1, -31);
  const trolleys = [];
  for (const x of [3, 9.5]) {                     // ship-to-shore cranes
    for (const dx of [-1.6, 1.6]) put(root, box(.35, 9, .35, C.crane, 0, { cast: false }), x + dx, 2.5, -28);
    put(root, box(.5, .5, 12, C.crane, 0, { cast: false }), x, 7, -30);
    const tr = put(root, new THREE.Group(), x, 6.6, -28);
    put(tr, box(1.2, .5, 1.1, N.amber, .05, { cast: false }), 0, 0, 0);
    put(tr, box(.04, 2.2, .04, N.frame, 0, { cast: false }), 0, -1.35, 0);
    put(tr, box(2.6, .9, 1.0, C.boxes[0], .03, { cast: false }), 0, -2.9, 0);
    trolleys.push(tr);
  }
  return trolleys;
}

function room(root) {
  backWall(root, WIN);
  wallScreen(root, MAP);
  put(root, label('Supply network · line 2 inputs', 2.3, .12, { w: 640 }), MAP.x - MAP.w / 2 + 1.3, MAP.y + MAP.h / 2 - .2, .065);
  const r = {
    aPlant: route(root, at('a'), at('plant')), bPlant: route(root, at('b'), at('plant')),
    plantDc: route(root, at('plant'), at('dc')), dcCust: route(root, at('dc'), at('cust')),
  };
  for (const k in NODE) node(root, k);
  desk(root, -.4, .55); put(root, chair(Math.PI), -.4, 0, 1.25);
  return r;
}

function buildScene() {
  const scene = new THREE.Scene();
  nightLights(scene);
  const root = new THREE.Group(); scene.add(root);
  const trolleys = port(root);
  const routes = room(root);
  const a = {
    ship: marker(N.amber), alt: marker(N.cardBlue), flow: [0, 1, 2].map(() => marker(N.card)), check: checkBadge(),
    planner: seat(person({ top: N.topNavy, skin: N.skin3, hair: N.hair3, bun: true })),
    analyst: person({ top: N.topGrey, skin: N.skin2, hair: N.hair2 }),
    service: person({ top: N.topBlue, skin: N.skin1, hair: N.hair1 }),
    routes, trolleys, root,
  };
  for (const k of ['ship', 'alt', 'check', 'planner', 'analyst', 'service']) root.add(a[k]);
  a.flow.forEach(f => root.add(f));
  put(root, a.planner, -.4, SEATED, 1.05, Math.PI);
  put(root, a.analyst, -4.3, 0, 1.0, Math.PI + .2);
  return { scene, actors: a };
}

// ------------------------------------------------------------- motion
const lerpAt = (p, q, u) => at(p).lerp(at(q), u);
// the inbound shipment from supplier A stops halfway when the delay is reported; supplier B's load runs once approved
const shipAt = t => lerpAt('a', 'plant', .55 * span(t, 0, 1.4, 'out'));
const altAt = t => lerpAt('b', 'plant', span(t, 6.0, 8.0, 'inOut'));
// the customer service lead comes in to the planner's desk, and leaves after the customers are updated
const SV_A = new THREE.Vector3(6.4, 0, 2.1), SV_B = new THREE.Vector3(.55, 0, 1.75);
function serviceAt(t) {
  const go = span(t, 6.6, 8.4, 'inOut'), back = span(t, 10.2, 11.9, 'inOut');
  // headings: walk left (-x), turn to the planner, walk right (+x) out of frame, turn back (off screen)
  const P = Math.PI, ry = track([[0, -P / 2], [8.4, -P / 2], [8.7, -2.2], [10.0, -2.2], [10.25, -3 * P / 2], [11.9, -3 * P / 2], [12, -5 * P / 2]], t);
  return { p: SV_A.clone().lerp(SV_B, go - back), ry, moving: Math.max(Math.sin(Math.PI * go), Math.sin(Math.PI * back)) };
}

function pose(a, t) {
  t = ((t % LOOP) + LOOP) % LOOP;
  const delayed = span(t, 1.2, 1.6, 'linear') * (1 - span(t, 11.2, 11.8, 'linear'));
  const pulse = .5 + .5 * Math.sin(t * Math.PI * 2 / 1.0);

  // supplier A's route turns amber while the shipment is held; supplier B's route lights up when it is used
  a.routes.aPlant.color.setHex(N.header).lerp(new THREE.Color(N.amber), delayed * (.6 + .4 * pulse));
  const useB = span(t, 5.6, 6.0, 'linear') * (1 - span(t, 11.2, 11.8, 'linear'));
  a.routes.bPlant.color.setHex(N.header).lerp(new THREE.Color(N.cardBlue), useB);
  a.ship.position.copy(shipAt(t)); a.ship.material.emissiveIntensity = .3 + .8 * delayed * pulse;
  setOpacity(a.ship, t >= 11.2 ? 1 - span(t, 11.2, 11.7, 'linear') : t < .3 ? span(t, 0, .3, 'linear') : 1);
  a.alt.position.copy(altAt(t));
  setOpacity(a.alt, Math.min(span(t, 5.7, 6.0, 'linear'), 1 - span(t, 8.0, 8.4, 'linear')));
  // finished goods keep moving from the plant to the DC and on to customers (one full cycle per loop: seamless)
  a.flow.forEach((f, i) => {
    const u = ((i / 3 + t / LOOP) % 1 + 1) % 1, leg = u < .5;
    f.position.copy(leg ? lerpAt('plant', 'dc', u * 2) : lerpAt('dc', 'cust', u * 2 - 1));
    setOpacity(f, Math.min(1, u / .08, (1 - u) / .08));
  });
  const ck = span(t, 9.0, 9.35, 'back') * (1 - span(t, 10.8, 11.1, 'out'));
  a.check.position.set(NODE.cust[0] + .2, NODE.cust[1] + .14, Z_MAP + .05); a.check.scale.setScalar(Math.max(.001, ck * .8)); a.check.visible = ck > .01;

  // the analyst at the display points at the delay; the planner works through the options
  const an = a.analyst.userData, point = span(t, 1.4, 1.9) * (1 - span(t, 3.4, 3.9)) + span(t, 5.8, 6.2) * (1 - span(t, 7.4, 7.8));
  an.armR.rotation.x = -2.3 * point; an.armR.rotation.z = .2 * point; an.head.rotation.x = -.25;
  an.head.rotation.y = .7 * span(t, 4.2, 4.6) * (1 - span(t, 5.4, 5.8));
  const pl = a.planner.userData;
  pl.armL.rotation.x = -1.15 - .1 * Math.sin(t * Math.PI * 2 / 1.2) * span(t, 2.4, 2.8) * (1 - span(t, 5.2, 5.6));
  pl.head.rotation.y = -.5 * span(t, 1.6, 2.0) * (1 - span(t, 2.6, 3.0)) + .7 * span(t, 8.5, 8.9) * (1 - span(t, 9.9, 10.3));

  const s = serviceAt(t), sv = a.service;
  sv.position.copy(s.p); sv.rotation.y = s.ry;
  walk(sv, t * Math.PI * 2 * 1.4, Math.min(1, s.moving * 1.6));
  if (s.moving < .02) sv.userData.armL.rotation.x = sv.userData.armR.rotation.x = -.12;

  // cranes at the port move containers across the quay
  a.trolleys.forEach((tr, i) => { tr.position.z = -28 - 4 * (.5 - .5 * Math.cos(t * Math.PI * 2 / LOOP * (i + 1) + i)); });
}

// ------------------------------------------------------------- decisions: AI recommends, a named role decides
export const DECISIONS = [
  { id: 'delay', show: [.3, 4.2], decide: 1.6,
    anchor: t => { const p = shipAt(t); return [p.x, p.y, p.z]; }, pos: [.38, .04],
    kicker: 'AI exception flag', title: 'Inbound delay on PO-4471',
    body: 'The vessel is held six days at transshipment. Three production orders and two customer commitments are affected.',
    role: 'Supply planner', verdict: 'Confirmed. Recovery options requested.', kind: 'approved' },
  { id: 'options', show: [3.6, 8.0], decide: 5.6,
    anchor: () => [NODE.b[0], NODE.b[1], Z_MAP], pos: [.64, .04],
    kicker: 'AI recommendation', title: 'Air-freight the full quantity',
    body: 'Air freight protects every commitment at 4.1 times the ocean cost.',
    role: 'Supply planner', verdict: 'Overruled: move 400 units to supplier B; air-freight only the urgent 120.', kind: 'overruled' },
  { id: 'confirm', show: [8.1, 11.6], decide: 9.0,
    anchor: () => [NODE.cust[0], NODE.cust[1], Z_MAP], pos: [.64, .04],
    kicker: 'AI verification', title: 'Supplier B confirmed',
    body: 'Supplier B confirmed 400 units for Thursday. Both customer commitments now hold.',
    role: 'Customer service lead', verdict: 'Approved. Customers updated with the new dates.', kind: 'approved' },
];

export const create = (canvas, opts) => nightView(canvas, buildScene(), pose, { target: [.15, 2.3, 1.2], offset: [.8, .5, 13.2] }, opts);
export const decisionsAt = t => cardsAt(DECISIONS, LOOP, t);
export const mount = fig => mountScene(fig, { create, DECISIONS, decisionsAt, STILL_T, ART_W, ART_H });
