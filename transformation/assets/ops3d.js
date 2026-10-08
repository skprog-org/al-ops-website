// 3D production floor at night for the Operations page ("Create more capacity for what matters"): station 3 on line 2 is
// stopped for a tool change while a supervisor and a planner agree the recovery plan at a standing table, then the line restarts.
// Same flat night palette and conventions as growth3d.js: metres, everything posed from t alone, 12 s seamless loop.
import * as THREE from './vendor/three.module.min.js';
import { span, track, box, cyl, put, flat, walk, cardsAt, mountScene } from './motion.js';
import { N, label, person, checkBadge, wallScreen, city, cityLights, twinkle, backWall, nightLights, nightView } from './night.js';

export const LOOP = 12;
export const STILL_T = 6.2;
export const ART_W = 2400, ART_H = 1350;

const C = { belt: 0x1d222c, rail: 0x3d4557, leg: 0x2b313d, machine: 0x55607a, machine2: 0x434c61, carton: 0xc9b89a, carton2: 0xb9a888,
  walkway: 0x5d5640, tablet: 0x101521 };

// ------------------------------------------------------------- the line: four stations over one conveyor
const LINE = { z: 1.25, top: .86, x0: -7.2, len: 14.4 };
const STATIONS = [-4.1, -1.55, 1.0, 3.55];              // S1..S4; S3 (index 2) is the one that stops
const S3 = STATIONS[2];
const SPACING = 1.2, ITEMS = 12;
// distance the belt has run by time t: full speed, slows to a stop at 1.6 s, restarts at 7.8 s.
// It runs 5.8 s-equivalents per loop; the speed makes that exactly four spacings, so the loop is seamless.
const SPEED = 4 * SPACING / 5.8;
function belt(t) {
  const ramp = .4;
  let r;
  if (t <= 1.6) r = t;
  else if (t <= 1.6 + ramp) { const u = t - 1.6; r = 1.6 + u - u * u / (2 * ramp); }
  else if (t <= 7.8) r = 1.6 + ramp / 2;
  else if (t <= 7.8 + ramp) { const u = t - 7.8; r = 1.6 + ramp / 2 + u * u / (2 * ramp); }
  else r = 1.6 + ramp + (t - 7.8 - ramp);
  return r * SPEED;
}
const stopped = t => span(t, 1.6, 2.0, 'linear') * (1 - span(t, 7.8, 8.2, 'linear'));   // 0 running, 1 stopped

function station() {
  const g = new THREE.Group(), H = 1.0, W = 1.15, D = 1.05;
  for (const x of [-W / 2 + .1, W / 2 - .1]) put(g, box(.2, H + .2, D, C.machine2, .03), x, (H + .2) / 2 + LINE.top - .2, 0);
  put(g, box(W, .55, D, C.machine, .05, { rough: .8 }), 0, LINE.top + H, 0);
  put(g, box(.42, .26, .02, N.board, .02, { cast: false }), 0, LINE.top + H + .02, D / 2 + .01);          // HMI panel
  put(g, cyl(.025, .22, N.tableLeg, 8), W / 2 - .18, LINE.top + H + .38, 0);
  return g;
}
function beacon() {
  const m = new THREE.MeshStandardMaterial({ color: N.accent, emissive: N.accent, emissiveIntensity: .6, roughness: .5 });
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .16, 16), m); b.castShadow = true; return b;
}
function carton(i) {
  const g = new THREE.Group();
  put(g, box(.42, .3, .36, i % 2 ? C.carton : C.carton2, .02, { rough: .95 }), 0, .15, 0);
  put(g, box(.43, .04, .1, 0xd9d2c4, 0, { cast: false }), 0, .3, 0);
  return g;
}

// ------------------------------------------------------------- the wall display: line status
const DISPLAY = { x: -3.0, y: 3.75, w: 3.9, h: 1.55 };
const tileX = i => DISPLAY.x - DISPLAY.w / 2 + .55 + i * .93;
const TILE_Y = DISPLAY.y - .14;

const WIN = { x0: .4, x1: 6.2, y0: 2.95, y1: 4.55, panes: 4 };
const TABLE = { x: -3.4, z: 3.05, top: 1.05 };

function room(root) {
  backWall(root, WIN);
  wallScreen(root, DISPLAY);
  put(root, label('Line 2 · stations', 1.9, .12, { w: 512, h: 32 }), DISPLAY.x - DISPLAY.w / 2 + 1.1, DISPLAY.y + DISPLAY.h / 2 - .2, .065);
  const tiles = STATIONS.map((_, i) => {
    const m = new THREE.MeshStandardMaterial({ color: N.cardBlue, roughness: .95 });
    const tile = new THREE.Mesh(new THREE.BoxGeometry(.78, .62, .02), m); put(root, tile, tileX(i), TILE_Y, .07);
    put(root, label('S' + (i + 1), .3, .1, { bg: '#2a3346', fg: '#dfe3ec', w: 96, h: 32, size: 20 }), tileX(i) - .21, TILE_Y + .2, .085);
    for (const [w, y] of [[.5, -.05], [.34, -.15]]) put(root, box(w, .03, .004, 0x4f6ba8, 0, { cast: false }), tileX(i) - .39 + .1 + w / 2, TILE_Y + y, .082);
    return m;
  });
  // the conveyor: frame, belt, legs; a painted walkway in front
  put(root, box(LINE.len + 2, .12, .72, C.rail, .02), 0, LINE.top - .06, LINE.z);
  put(root, box(LINE.len + 2, .02, .6, C.belt, 0, { rough: .9 }), 0, LINE.top + .005, LINE.z);
  for (let x = -7.5; x <= 7.5; x += 1.5) for (const dz of [-.3, .3]) put(root, box(.06, LINE.top - .12, .06, C.leg, .01), x, (LINE.top - .12) / 2, LINE.z + dz);
  const beacons = STATIONS.map(x => { put(root, station(), x, 0, LINE.z); const b = beacon(); put(root, b, x + 1.15 / 2 - .18, LINE.top + 1.0 + .55, LINE.z); return b; });
  for (const z of [1.95, 3.85]) put(root, flat(16, .07, C.walkway, .01), 0, 0, z);
  // standing table with the recovery plan
  put(root, box(1.0, .05, .7, N.table, .02), TABLE.x, TABLE.top, TABLE.z);
  put(root, box(.08, TABLE.top, .08, N.tableLeg, .01), TABLE.x, TABLE.top / 2, TABLE.z);
  put(root, box(.5, .03, .4, N.tableLeg, .01), TABLE.x, .015, TABLE.z);
  put(root, box(.4, .004, .28, N.paper, .002, { cast: false }), TABLE.x + .15, TABLE.top + .03, TABLE.z + .05, .2);
  return { tiles, beacons };
}

function buildScene() {
  const scene = new THREE.Scene();
  nightLights(scene);
  const root = new THREE.Group(); scene.add(root);
  const lights = cityLights();
  city(root, lights, { dx: 1.5, dy: 2.4 });
  const { tiles, beacons } = room(root);

  const tablet = new THREE.Group();
  put(tablet, box(.3, .02, .22, C.tablet, .01), 0, 0, 0);
  const glowM = new THREE.MeshStandardMaterial({ color: N.cardBlue, emissive: N.cardBlue, emissiveIntensity: .5 });
  put(tablet, new THREE.Mesh(new THREE.BoxGeometry(.26, .004, .18), glowM), 0, .012, 0);

  const a = {
    supervisor: person({ top: N.topGrey, skin: N.skin2, hair: N.hair4 }),
    planner: person({ top: N.topBlue, skin: N.skin3, hair: N.hair3, bun: true }),
    operator: person({ top: N.topNavy, skin: N.skin1, hair: N.hair1, legs: 0x323848 }),
    cartons: Array.from({ length: ITEMS }, (_, i) => carton(i)),
    check: checkBadge(), tablet, glowM, tiles, beacons, lights, root,
  };
  for (const k of ['supervisor', 'planner', 'operator', 'check', 'tablet']) root.add(a[k]);
  a.cartons.forEach(c => root.add(c));
  put(root, a.supervisor, TABLE.x - .75, 0, TABLE.z - .1, Math.PI / 2 - .25);
  put(root, a.planner, TABLE.x + .72, 0, TABLE.z + .1, -Math.PI / 2 - .2);
  return { scene, actors: a };
}

// ------------------------------------------------------------- motion
// the operator leaves the table, walks the walkway to station 3, changes the tool, and comes back once the line restarts
const HOME = new THREE.Vector3(TABLE.x + .1, 0, TABLE.z - .75), AT_S3 = new THREE.Vector3(S3, 0, 2.2);
function operatorAt(t) {
  const go = span(t, 2.3, 4.1, 'inOut'), back = span(t, 8.5, 10.3, 'inOut');
  const p = HOME.clone().lerp(AT_S3, go - back);
  // headings: face the table (+z) at home, walk right (+x), face the machine (-z), walk left (-x), face the table again
  const P = Math.PI, ry = track([[0, 0], [2.1, 0], [2.4, P / 2], [4.0, P / 2], [4.35, P], [8.3, P],
    [8.6, 3 * P / 2], [10.2, 3 * P / 2], [10.6, 2 * P], [12, 2 * P]], t);
  return { p, ry, moving: Math.max(Math.sin(Math.PI * go), Math.sin(Math.PI * back)), working: span(t, 4.3, 4.6) * (1 - span(t, 7.4, 7.8)) };
}

function pose(a, t) {
  t = ((t % LOOP) + LOOP) % LOOP;
  const stop = stopped(t);

  // cartons ride the belt and pass through the stations; the wrap happens off screen
  const d = belt(t);
  a.cartons.forEach((c, i) => {
    const x = LINE.x0 + ((i * SPACING + d) % LINE.len + LINE.len) % LINE.len;
    c.position.set(x, LINE.top + .015, LINE.z);
  });

  // beacons: running in seafoam; station 3 pulses amber while stopped. The display tile follows it
  const pulse = .5 + .5 * Math.sin(t * Math.PI * 2 / 1.0);
  a.beacons.forEach((b, i) => {
    const m = b.material;
    if (i === 2 && stop > 0) { m.color.setHex(N.accent).lerp(new THREE.Color(N.amber), stop); m.emissive.copy(m.color); m.emissiveIntensity = .4 + .9 * pulse * stop; }
    else { m.color.setHex(N.accent); m.emissive.setHex(N.accent); m.emissiveIntensity = .55; }
  });
  a.tiles[2].color.setHex(N.cardBlue).lerp(new THREE.Color(N.amber), stop);

  // a check over station 3 once it is running again
  const ck = span(t, 8.2, 8.55, 'back') * (1 - span(t, 10.6, 10.9, 'out'));
  a.check.position.set(tileX(2) + .3, TILE_Y + .28, .12); a.check.scale.setScalar(Math.max(.001, ck)); a.check.visible = ck > .01;

  // operator
  const o = operatorAt(t), op = a.operator, u = op.userData;
  op.position.copy(o.p); op.rotation.y = o.ry;
  walk(op, t * Math.PI * 2 * 1.4, Math.min(1, o.moving * 1.6));
  if (o.working > 0) {
    const w = o.working, k = Math.sin(t * Math.PI * 2 / .9);
    u.armR.rotation.x = -1.65 * w - .2 * k * w; u.armL.rotation.x = -1.35 * w + .2 * k * w; u.head.rotation.x = -.2 * w;
  } else if (o.moving < .02) { u.armL.rotation.x = u.armR.rotation.x = -.15 * (1 - o.moving); u.head.rotation.x = 0; }

  // supervisor and planner at the standing table: the planner works the tablet, both look at station 3 when it matters
  const sv = a.supervisor.userData, pl = a.planner.userData;
  sv.armL.rotation.x = sv.armR.rotation.x = -.55; sv.armR.rotation.z = .1;
  sv.head.rotation.y = -.5 * span(t, 1.2, 1.7) * (1 - span(t, 3.0, 3.6)) - .5 * span(t, 7.6, 8.0) * (1 - span(t, 9.2, 9.8));
  pl.armL.rotation.x = -1.0; pl.armR.rotation.x = -1.0 - .12 * Math.sin(t * Math.PI * 2 / 1.5) * span(t, 3.4, 3.8) * (1 - span(t, 5.4, 5.8));
  pl.armL.rotation.z = .3; pl.armR.rotation.z = -.3;
  pl.head.rotation.x = .3;
  a.root.updateMatrixWorld(true);
  const pp = a.planner.position, pr = a.planner.rotation.y;
  a.tablet.position.set(pp.x + Math.sin(pr) * .42, 1.12, pp.z + Math.cos(pr) * .42); a.tablet.rotation.set(-.55, pr, 0, 'YXZ');
  a.glowM.emissiveIntensity = .35 + .25 * span(t, 3.6, 4.0) * (1 - span(t, 5.6, 6.0));

  twinkle(a.lights, t, LOOP);
}

// ------------------------------------------------------------- decisions: AI recommends, a named role decides
export const DECISIONS = [
  { id: 'fault', show: [.3, 4.2], decide: 1.4,
    anchor: () => [S3, LINE.top + 1.6, LINE.z + .55], pos: [.36, .04],
    kicker: 'AI exception flag', title: 'Torque drift at station 3',
    body: 'Fastening torque has drifted 8% over the last 40 cycles. Recommends stopping for a tool change (confidence 0.82).',
    role: 'Line supervisor', verdict: 'Approved. Station 3 stopped for the tool change.', kind: 'approved' },
  { id: 'plan', show: [3.4, 7.9], decide: 5.0,
    anchor: () => [TABLE.x + .3, 1.2, TABLE.z + .1], pos: [.62, .04],
    kicker: 'AI recommendation', title: 'Recovery plan',
    body: 'Move urgent order 4471 to line 1 and bring the 18:00 changeover forward 30 minutes to recover the shortfall.',
    role: 'Planner', verdict: 'Partly overruled: move order 4471, keep the changeover time.', kind: 'overruled' },
  { id: 'restart', show: [6.6, 11.6], decide: 7.7,
    anchor: () => [S3, LINE.top + 1.05, LINE.z + .55], pos: [.66, .64],
    kicker: 'AI verification', title: 'Station 3 ready to restart',
    body: 'The first five parts after the tool change are within tolerance. Recommends restarting at full rate.',
    role: 'Operator', verdict: 'Approved. Line 2 back at full rate.', kind: 'approved' },
];

export const create = (canvas, opts) => nightView(canvas, buildScene(), pose, { target: [.3, 2.3, 1.7], offset: [.8, .9, 15.6] }, opts);
export const decisionsAt = t => cardsAt(DECISIONS, LOOP, t);
export const mount = fig => mountScene(fig, { create, DECISIONS, decisionsAt, STILL_T, ART_W, ART_H });
