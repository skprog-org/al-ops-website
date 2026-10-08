// 3D project room at dusk for the Growth page ("Build your next source of growth"): a team shapes a new proposition on a
// wall board (Ideas, Evidence, Prototype, Pilot, Scale) at a long table, with the city through the window behind them.
// Flat, matte materials in a night palette. Real-world scale in metres; every moving object is posed by renderAt(t)
// from t alone (12 s loop), so any moment is seekable and the loop is seamless. build.py renders the still at STILL_T.
import * as THREE from './vendor/three.module.min.js';
import { span, track, box, put, setOpacity, walk, cardsAt, mountScene } from './motion.js';
import { N, label, paper, person, SEATED, seat, chair, checkBadge, wallScreen, city, cityLights, twinkle, backWall, nightLights, nightView } from './night.js';

export const LOOP = 12;
export const STILL_T = 9.4;
export const ART_W = 2400, ART_H = 1350;

// ------------------------------------------------------------- the board: five columns, cards on a grid
const BOARD = { x: -2.6, y: 2.85, w: 4.8, h: 2.62 };
const COLS = ['Ideas', 'Evidence', 'Prototype', 'Pilot', 'Scale'];
const CARD_W = .72, CARD_H = .42, Z_CARD = .07;
const colX = i => BOARD.x - BOARD.w / 2 + .25 + CARD_W / 2 + .03 + i * .88;
const rowY = r => BOARD.y + BOARD.h / 2 - .48 - CARD_H / 2 - r * .5;
const slot = (c, r) => new THREE.Vector3(colX(c), rowY(r), Z_CARD);
const STATIC_CARDS = [[0, 0, 1], [1, 0, 0], [1, 1, 0], [1, 2, 1], [2, 0, 0], [3, 0, 1], [3, 1, 0], [4, 0, 0]];  // col, row, blue
const PLACED = slot(1, 3);                          // the card the strategist adds to Evidence
const MOVE_A = slot(2, 1), MOVE_B = slot(3, 2);     // the prototype card promoted to Pilot
const REFLOW_A = slot(2, 2), REFLOW_B = slot(2, 1); // the card below it moves up

// ------------------------------------------------------------- the table
const TABLE = { x: .9, z: 2.4, len: 5.2, dep: 1.1, top: .76 };
const PAPER_A = new THREE.Vector3(-.05, TABLE.top + .012, 2.3), PAPER_B = new THREE.Vector3(1.85, TABLE.top + .012, 2.3);
const DOC_DOWN = new THREE.Vector3(3.05, TABLE.top + .012, 2.45);

function card(blue) {
  const g = new THREE.Group();
  put(g, box(CARD_W, CARD_H, .02, blue ? N.cardBlue : N.card, .015, { rough: .95 }), 0, 0, 0);
  for (const [w, y] of [[.5, .09], [.36, .03]]) put(g, box(w, .022, .004, blue ? 0x4f6ba8 : N.line, 0, { cast: false }), -CARD_W / 2 + .1 + w / 2, y, .012);
  return g;
}

const WIN = { x0: .95, x1: 5.15, y0: 1.42, y1: 4.16 };

// ------------------------------------------------------------- the room
function room(root) {
  backWall(root, WIN);
  // board: a wall display with column headers
  wallScreen(root, BOARD);
  COLS.forEach((name, i) => put(root, label(name, .8, .1), colX(i), BOARD.y + BOARD.h / 2 - .22, .065));
  for (const [c, r, blue] of STATIC_CARDS) put(root, card(blue), colX(c), rowY(r), Z_CARD);
  // table, trestles, chairs and what is on the table
  put(root, box(TABLE.len, .06, TABLE.dep, N.table, .03, { rough: .8 }), TABLE.x, TABLE.top - .03, TABLE.z);
  for (const dx of [-TABLE.len / 2 + .5, TABLE.len / 2 - .5]) {
    put(root, box(.07, TABLE.top - .06, .07, N.tableLeg, .01), TABLE.x + dx, (TABLE.top - .06) / 2, TABLE.z);
    put(root, box(.07, .05, TABLE.dep - .2, N.tableLeg, .01), TABLE.x + dx, .025, TABLE.z);
  }
  put(root, chair(0), -.45, 0, 1.56); put(root, chair(0), 2.3, 0, 1.56);
  put(root, chair(Math.PI / 2), TABLE.x - TABLE.len / 2 - .35, 0, TABLE.z);
  const dev = put(root, box(.5, .2, .32, N.device, .04, { rough: .9 }), .55, TABLE.top + .1, 2.2);
  put(root, paper(3), -.65, TABLE.top + .01, 2.55, .25);
  put(root, paper(2), 1.3, TABLE.top + .01, 2.7, -.2);
  put(root, box(.36, .02, .26, N.laptop, .01), 2.85, TABLE.top + .01, 2.45);
  const screen = put(root, box(.36, .24, .015, N.laptop, .01), 2.85, TABLE.top + .13, 2.33); screen.rotation.x = -.2;
  return { dev };
}

function buildScene() {
  const scene = new THREE.Scene();
  nightLights(scene);

  const root = new THREE.Group(); scene.add(root);
  const lights = cityLights();
  city(root, lights);
  const { dev } = room(root);
  const devTop = new THREE.Mesh(new THREE.BoxGeometry(.24, .03, .06), new THREE.MeshStandardMaterial({ color: N.cardBlue, emissive: N.cardBlue, emissiveIntensity: .3 }));
  put(dev, devTop, 0, .11, -.04);

  const a = {
    placed: card(false), moving: card(true), reflow: card(false), check: checkBadge(),
    paper: paper(2), doc: paper(3),
    strategist: person({ top: N.topBlue, skin: N.skin1, hair: N.hair1 }),
    designer: seat(person({ top: N.topCream, skin: N.skin2, hair: N.hair2 })),
    analyst: seat(person({ top: N.topNavy, skin: N.skin3, hair: N.hair3, bun: true })),
    lead: person({ top: N.topGrey, skin: N.skin4, hair: N.hair4 }),
    plane: new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6b5e, fog: false })),
    lights, devTop,
  };
  for (const k of ['placed', 'moving', 'reflow', 'check', 'paper', 'doc', 'strategist', 'designer', 'analyst', 'lead', 'plane']) root.add(a[k]);
  put(root, a.designer, -.45, SEATED, 1.78); put(root, a.analyst, 2.3, SEATED, 1.78);
  a.root = root;
  return { scene, actors: a };
}

// ------------------------------------------------------------- motion
const STRAT = new THREE.Vector3(-3.15, 0, .55);
function strategistArm(t) {        // shoulder angle of the arm holding the card: hold, reach to the board, lower, pick up the next
  return track([[0, -.95], [1.0, -.95], [2.1, -2.45, 'inOut'], [2.4, -2.45], [3.2, -.12, 'inOut'], [10.6, -.12], [11.4, -.95, 'inOut'], [12, -.95]], t);
}
function leadAt(t) {               // walks in from the right to the table end with the pilot evidence, and back out of frame
  const inU = span(t, 4.0, 6.0, 'inOut'), outU = span(t, 10.6, 11.85, 'inOut');
  const x = 6.4 - 2.3 * inU + 2.3 * outU;
  const ry = -Math.PI / 2 + Math.PI * span(t, 10.3, 10.6, 'inOut') - Math.PI * span(t, 11.85, 12, 'inOut');
  return { x, z: 2.55, ry, moving: Math.max(Math.sin(Math.PI * inU), Math.sin(Math.PI * outU)) };
}
const paperAt = t => PAPER_A.clone().lerp(PAPER_B, span(t, 3.6, 4.6, 'inOut') * (1 - span(t, 9.4, 10.4, 'inOut')));
function movingAt(t) {
  const u = span(t, 8.0, 8.9, 'inOut'), p = MOVE_A.clone().lerp(MOVE_B, u);
  p.z += .16 * Math.sin(Math.PI * u); return p;
}

const tmp = new THREE.Vector3();
function pose(a, t) {
  t = ((t % LOOP) + LOOP) % LOOP;

  // the strategist reaches up and adds an evidence card to the board
  const s = a.strategist, arm = strategistArm(t);
  s.position.copy(STRAT); s.rotation.y = Math.PI - .55;           // three-quarter view, so the raised card stays visible
  s.userData.armR.rotation.x = arm; s.userData.armR.rotation.z = .18; s.userData.armL.rotation.x = -.1;
  s.userData.head.rotation.x = -.25 * span(-arm, .9, 2.45, 'linear');
  a.root.updateMatrixWorld(true);
  s.userData.hand.getWorldPosition(tmp);
  const held = t < 2.1 || t >= 11.4;
  tmp.set(tmp.x, tmp.y + .12, Math.max(tmp.z - .05, Z_CARD + .03));         // never behind the board's surface
  if (held) a.placed.position.copy(tmp);
  else a.placed.position.copy(tmp.lerp(PLACED, span(t, 2.1, 2.35, 'out')));
  if (t >= 2.35 && t < 11.4) a.placed.position.copy(PLACED);
  setOpacity(a.placed, t >= 11.4 ? span(t, 11.4, 11.9, 'out') : 1 - span(t, 10.8, 11.3, 'linear'));

  // two seated colleagues pass a sketch across the table and read it
  a.paper.position.copy(paperAt(t)); a.paper.rotation.y = .1;
  const reach = (a0, a1, b0, b1) => span(t, a0, a1, 'inOut') * (1 - span(t, b0, b1, 'inOut'));
  const pass = reach(3.4, 3.8, 4.4, 4.9) + reach(10.0, 10.3, 10.5, 10.9);   // hands it over, takes it back
  const take = reach(4.2, 4.6, 5.0, 5.4) + reach(9.1, 9.4, 10.3, 10.7);
  a.designer.userData.armL.rotation.x = -1.15 - .3 * pass;
  a.designer.userData.head.rotation.y = .35 * Math.sin(Math.PI * 2 * t / LOOP) - .2 * span(t, 6.6, 7.4) * (1 - span(t, 9.0, 9.6));
  a.analyst.userData.armR.rotation.x = -1.15 - .3 * take;
  a.analyst.userData.head.rotation.x = .18 * span(t, 4.6, 5.0) * (1 - span(t, 8.6, 9.0));
  a.analyst.userData.head.rotation.y = -.2 * span(t, 9.0, 9.6) * (1 - span(t, 11.2, 11.8));

  // the product lead brings the pilot evidence to the table, then takes it back to the window
  const l = leadAt(t), lead = a.lead, u = lead.userData;
  lead.position.set(l.x, 0, l.z); lead.rotation.y = l.ry;
  walk(lead, t * Math.PI * 2 * 1.5, Math.min(1, l.moving * 1.6));
  const reachDown = span(t, 6.0, 6.4, 'inOut') * (1 - span(t, 6.6, 7.0, 'inOut')) + span(t, 9.9, 10.2, 'inOut') * (1 - span(t, 10.3, 10.6, 'inOut'));
  const carrying = t < 6.3 || t >= 10.2;
  u.armL.rotation.x = u.armR.rotation.x = carrying ? -.75 - .45 * reachDown : -.12 - .9 * reachDown;
  u.armL.rotation.z = .35; u.armR.rotation.z = -.35;
  // the document is held upright against the chest, facing the room
  const hold = new THREE.Vector3(l.x + Math.sin(l.ry) * .3, 1.12 - .3 * reachDown, l.z + Math.cos(l.ry) * .3 + .16);
  if (carrying) {
    a.doc.position.copy(hold); a.doc.rotation.set(Math.PI / 2 - .25 - 1.1 * reachDown, 0, .12);
  } else {
    a.doc.position.copy(DOC_DOWN); a.doc.rotation.set(0, -.25, 0);
  }

  // the prototype card is promoted to Pilot once the sponsor approves; the card below it moves up
  a.moving.position.copy(movingAt(t)); a.moving.scale.setScalar(1 + .06 * Math.sin(Math.PI * span(t, 8.0, 8.9, 'inOut')));
  setOpacity(a.moving, t >= 11.3 ? span(t, 11.3, 11.9, 'out') : 1 - span(t, 10.8, 11.3, 'linear'));
  if (t >= 11.3) a.moving.position.copy(MOVE_A);
  a.reflow.position.copy(REFLOW_A.clone().lerp(REFLOW_B, span(t, 8.5, 9.0, 'inOut') * (1 - span(t, 11.3, 11.9, 'inOut'))));
  const ck = span(t, 8.9, 9.25, 'back') * (1 - span(t, 10.6, 10.9, 'out'));
  a.check.position.set(MOVE_B.x + CARD_W / 2 - .04, MOVE_B.y + CARD_H / 2 - .02, Z_CARD + .06);
  a.check.scale.setScalar(Math.max(.001, ck)); a.check.visible = ck > .01;

  // the prototype on the table, lights in the city, and a plane crossing the window
  a.devTop.material.emissiveIntensity = .25 + .5 * (.5 + .5 * Math.sin(t * Math.PI * 2 / 3));
  twinkle(a.lights, t, LOOP);
  a.plane.position.set(-14 + 32 * (t / LOOP), 8.6 + .4 * Math.sin(t * Math.PI * 2 / LOOP), -30);
  a.plane.visible = Math.sin(t * Math.PI * 2 / 1.2) > .2;
}

// ------------------------------------------------------------- decisions: AI recommends, a named role decides
// Illustrative decisions for shaping a new service. pos: where the card sits, as fractions of the stage.
export const DECISIONS = [
  { id: 'segment', show: [.4, 4.4], decide: 2.35,
    anchor: () => [PLACED.x, PLACED.y + CARD_H / 2, PLACED.z], pos: [.025, .04],
    kicker: 'AI insight', title: 'Strongest early segment',
    body: 'Mid-size distributors raised this need in 14 of 22 discovery interviews. Test the service with them first.',
    role: 'Product lead', verdict: 'Approved. Added to the evidence for the test plan.', kind: 'approved' },
  { id: 'price', show: [3.9, 8.1], decide: 5.4,
    anchor: t => { const p = paperAt(t); return [p.x, p.y + .02, p.z]; }, pos: [.36, .58],
    kicker: 'AI recommendation', title: 'Pilot price point',
    body: 'Survey responses suggest one subscription price clears willingness to pay for 60% of the segment.',
    role: 'Commercial lead', verdict: 'Overruled: test two price points in the pilot instead.', kind: 'overruled' },
  { id: 'pilot', show: [6.6, 11.6], decide: 8.0,
    anchor: t => { const p = movingAt(t); return [p.x, p.y, p.z]; }, pos: [.03, .62],
    kicker: 'AI readiness check', title: 'Prototype ready for pilot',
    body: 'Time to first value is 9 days against a 14-day target, and delivery cost per client is within plan.',
    role: 'Sponsor', verdict: 'Approved. The pilot opens to five clients.', kind: 'approved' },
];

// ------------------------------------------------------------- mount
export const create = (canvas, opts) => nightView(canvas, buildScene(), pose, { target: [.15, 2.2, 1.2], offset: [1.0, .6, 12.9] }, opts);

export const decisionsAt = t => cardsAt(DECISIONS, LOOP, t);
export const mount = fig => mountScene(fig, { create, DECISIONS, decisionsAt, STILL_T, ART_W, ART_H });
