// 3D service counter at dusk for the Customer experience page ("Onboard customers once, not four times"): an advisor completes a
// pre-filled onboarding pack with a customer at the counter while, behind a glass partition, colleagues prepare the next case.
// Same flat night palette and conventions as growth3d.js: metres, everything posed from t alone, 12 s seamless loop.
import * as THREE from './vendor/three.module.min.js';
import { span, track, box, put, flat, setOpacity, walk, cardsAt, mountScene } from './motion.js';
import { N, label, labelTexture, paper, person, SEATED, seat, chair, checkBadge, desk, wallScreen, city, cityLights, twinkle, backWall, nightLights, nightView } from './night.js';

export const LOOP = 12;
export const STILL_T = 8.6;
export const ART_W = 2400, ART_H = 1350;

const C = { counter: 0x3a4255, counterTop: 0x8e99ae, glass: 0x9fb4d6, mullion: 0x2b313d, monitor: 0x1a1f2a, bench: 0x39415a, plant: 0x2f5a52, pot: 0x4c5466 };

// ------------------------------------------------------------- layout
const WIN = { x0: 2.3, x1: 6.1, y0: 1.3, y1: 4.1 };
const GLASS = { z: 1.45, x0: -3.2, x1: 1.9, h: 2.25 };          // partition between the counter and the back office
const COUNTER = { x: -.4, z: 2.7, len: 3.4, dep: .7, top: 1.05 };
const QUEUE = { x: -3.9, y: 3.35, w: 1.8, h: .95 };              // "now serving" display
const DOC_ADVISOR = new THREE.Vector3(-.5, COUNTER.top + .012, 2.6), DOC_CUSTOMER = new THREE.Vector3(.05, COUNTER.top + .012, 2.88);
const FOLDER_A = new THREE.Vector3(.85, .78, .62), FOLDER_B = new THREE.Vector3(-1.75, .78, .62);   // from one desk to the other

function room(root) {
  backWall(root, WIN);
  // back office behind the glass: two desks with monitors, a shelf of case files
  desk(root, -2.2, .45); desk(root, .5, .45);
  put(root, box(1.4, .05, .3, N.tableLeg, .01), -1.0, 1.85, .16);
  for (let i = 0; i < 9; i++) put(root, box(.06, .3, .24, [N.cardBlue, N.card, N.topGrey][i % 3], .01), -1.6 + i * .13, 2.03, .16);
  // glass partition: frame, mullions, translucent panes
  const glassM = new THREE.MeshStandardMaterial({ color: C.glass, transparent: true, opacity: .14, roughness: .2, depthWrite: false });
  const gw = GLASS.x1 - GLASS.x0;
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(gw, GLASS.h - .9), glassM); pane.renderOrder = 3; put(root, pane, (GLASS.x0 + GLASS.x1) / 2, .9 + (GLASS.h - .9) / 2, GLASS.z);
  put(root, box(gw, .9, .08, C.counter, .02), (GLASS.x0 + GLASS.x1) / 2, .45, GLASS.z);
  put(root, box(gw + .06, .05, .1, C.mullion, .01), (GLASS.x0 + GLASS.x1) / 2, GLASS.h, GLASS.z);
  for (let k = 0; k <= 4; k++) put(root, box(.05, GLASS.h, .08, C.mullion, .01), GLASS.x0 + gw * k / 4, GLASS.h / 2, GLASS.z);
  // the counter: front panel, top, the advisor's chair and screen
  put(root, box(COUNTER.len, COUNTER.top - .05, .08, C.counter, .02), COUNTER.x, (COUNTER.top - .05) / 2, COUNTER.z + COUNTER.dep / 2);
  put(root, box(COUNTER.len, .05, COUNTER.dep, C.counterTop, .02, { rough: .7 }), COUNTER.x, COUNTER.top, COUNTER.z);
  put(root, box(COUNTER.len, .06, .01, N.cardBlue, 0, { cast: false }), COUNTER.x, COUNTER.top - .16, COUNTER.z + COUNTER.dep / 2 + .045);
  put(root, box(COUNTER.len, .12, .5, C.counter, .02), COUNTER.x, .72, COUNTER.z - .05);
  put(root, box(.5, .32, .03, C.monitor, .015), COUNTER.x - 1.0, COUNTER.top + .24, COUNTER.z - .15, .35);
  // the queue display, a bench for waiting customers, a plant
  wallScreen(root, QUEUE);
  put(root, label('Now serving', 1.2, .1, { w: 384 }), QUEUE.x - .2, QUEUE.y + .3, .065);
  put(root, box(1.8, .08, .45, C.bench, .02), -4.3, .45, 2.9);
  for (const dx of [-.75, .75]) put(root, box(.06, .42, .4, N.tableLeg, .01), -4.3 + dx, .21, 2.9);
  put(root, box(.36, .42, .36, C.pot, .04), 4.9, .21, 1.0);
  for (const [x, y, z, r] of [[0, .75, 0, .3], [.14, .95, .05, .22], [-.12, 1.0, -.04, .2]]) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), new THREE.MeshStandardMaterial({ color: C.plant, roughness: .95, flatShading: true }));
    m.castShadow = true; put(root, m, 4.9 + x, y, 1.0 + z);
  }
}

function ticket(text) {
  return new THREE.MeshStandardMaterial({ map: labelTexture(text, { bg: '#262d3c', fg: '#eef1f6', w: 512, h: 128, size: 64, align: 'center' }), roughness: .9 });
}

function buildScene() {
  const scene = new THREE.Scene();
  nightLights(scene);
  const root = new THREE.Group(); scene.add(root);
  const lights = cityLights();
  city(root, lights, { dx: 2.2 });
  room(root);

  const t1 = ticket('A-103'), t2 = ticket('A-104');
  const num = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .375), t1); put(root, num, QUEUE.x, QUEUE.y - .12, .066);

  const a = {
    advisor: person({ top: N.topCream, skin: N.skin3, hair: N.hair3, bun: true }),
    customer: person({ top: N.topBlue, skin: N.skin2, hair: N.hair2 }),
    waiting: seat(person({ top: N.topGrey, skin: N.skin1, hair: N.hair1 })),
    caseworker: seat(person({ top: N.topNavy, skin: N.skin4, hair: N.hair4 })),
    runner: person({ top: N.topGrey, skin: N.skin3, hair: N.hair1 }),
    doc: paper(3), folder: new THREE.Group(), check: checkBadge(),
    num, tickets: [t1, t2], lights, root,
  };
  put(a.folder, box(.32, .03, .24, N.cardBlue, .01), 0, 0, 0);
  for (const k of ['advisor', 'customer', 'waiting', 'caseworker', 'runner', 'doc', 'folder', 'check']) root.add(a[k]);
  put(root, a.advisor, COUNTER.x - .2, 0, COUNTER.z - .62, .3);   // stands at the service counter
  put(root, chair(Math.PI), -2.2, 0, 1.15);
  put(root, a.caseworker, -2.2, SEATED, .93, Math.PI);
  put(root, a.waiting, -4.6, SEATED, 2.75);
  a.waiting.userData.armL.rotation.x = a.waiting.userData.armR.rotation.x = -.6;
  return { scene, actors: a };
}

// ------------------------------------------------------------- motion
// the customer walks in from the left, stands at the counter, and leaves to the right with the completed pack
function customerAt(t) {
  const inU = span(t, .2, 2.2, 'inOut'), outU = span(t, 9.6, 11.8, 'inOut');
  const x = -7.0 + 7.35 * inU + 7.2 * outU;
  const P = Math.PI, ry = track([[0, P / 2], [2.1, P / 2], [2.5, P + .4], [9.3, P + .4], [9.7, P / 2], [12, P / 2]], t);   // turns toward the advisor
  return { x, z: 3.35, ry, moving: Math.max(Math.sin(Math.PI * inU), Math.sin(Math.PI * outU)) };
}
// behind the glass a colleague carries the next case folder from one desk to the caseworker's and returns
function runnerAt(t) {
  const go = span(t, 3.0, 5.0, 'inOut'), back = span(t, 7.6, 9.4, 'inOut');
  const x = .85 - 2.45 * (go - back);
  // headings: face the desk (-z), walk left (-x), face the caseworker's desk, walk right (+x), face the desk again
  const P = Math.PI, ry = track([[0, P], [2.7, P], [3.0, 3 * P / 2], [5.0, 3 * P / 2], [5.3, P], [7.3, P], [7.6, 5 * P / 2], [9.4, 5 * P / 2], [9.7, 3 * P], [12, 3 * P]], t);
  return { x, z: 1.12, ry, moving: Math.max(Math.sin(Math.PI * go), Math.sin(Math.PI * back)) };
}

function pose(a, t) {
  t = ((t % LOOP) + LOOP) % LOOP;

  // queue display moves on to the next ticket as the customer arrives
  a.num.material = t >= 1.2 && t < 11.0 ? a.tickets[1] : a.tickets[0];

  const c = customerAt(t), cu = a.customer;
  cu.position.set(c.x, 0, c.z); cu.rotation.y = c.ry;
  walk(cu, t * Math.PI * 2 * 1.4, Math.min(1, c.moving * 1.6));
  const u = cu.userData;
  const sign = span(t, 4.4, 4.8) * (1 - span(t, 5.8, 6.2)), take = span(t, 8.8, 9.2) * (1 - span(t, 9.4, 9.7));
  if (c.moving < .02) { u.armR.rotation.x = -.15 - 1.0 * Math.max(sign, take); u.armL.rotation.x = -.15; }
  u.head.rotation.x = .25 * span(t, 3.0, 3.4) * (1 - span(t, 8.6, 9.0));

  // the advisor works the pack: slides it across to be confirmed, takes it back to finish, hands it over
  const adv = a.advisor.userData;
  const slideOut = span(t, 3.6, 4.2), slideBack = span(t, 6.2, 6.8), handOver = span(t, 8.4, 9.0);
  const docP = DOC_ADVISOR.clone().lerp(DOC_CUSTOMER, slideOut - slideBack + handOver);
  const carried = t >= 9.2 && t < 11.8;
  if (carried) {                                                     // the customer leaves with it
    a.doc.position.set(c.x + .3, 1.02, c.z + .12); a.doc.rotation.set(-1.2, 0, 0);
  } else { a.doc.position.copy(docP); a.doc.rotation.set(0, .15, 0); }
  setOpacity(a.doc, t >= 11.3 ? 1 - span(t, 11.3, 11.7, 'linear') : t < .4 ? span(t, 0, .4, 'linear') : 1);
  adv.armR.rotation.x = -.85 - .3 * Math.max(span(t, 3.4, 3.8) * (1 - span(t, 4.2, 4.6)), span(t, 8.2, 8.6) * (1 - span(t, 9.0, 9.4)));
  adv.armL.rotation.x = -.85 - .12 * Math.sin(t * Math.PI * 2 / 1.2) * span(t, 6.8, 7.2) * (1 - span(t, 7.8, 8.2));
  adv.head.rotation.y = .3 * span(t, 6.8, 7.1) * (1 - span(t, 7.9, 8.2));

  // a check over the counter when the setup call is booked
  const ck = span(t, 8.0, 8.35, 'back') * (1 - span(t, 9.4, 9.7, 'out'));
  a.check.position.set(COUNTER.x - 1.0, COUNTER.top + .62, COUNTER.z - .1); a.check.scale.setScalar(Math.max(.001, ck)); a.check.visible = ck > .01;

  // behind the glass
  const r = runnerAt(t), rn = a.runner;
  rn.position.set(r.x, 0, r.z); rn.rotation.y = r.ry;
  walk(rn, t * Math.PI * 2 * 1.3, Math.min(1, r.moving * 1.6));
  const lift = span(t, 2.4, 2.8) * (1 - span(t, 5.2, 5.6)), holding = t >= 2.7 && t < 5.4;
  const ru = rn.userData; ru.armR.rotation.x = ru.armL.rotation.x = -.15 - .85 * lift;
  if (holding) { a.root.updateMatrixWorld(true); ru.hand.getWorldPosition(a.folder.position); a.folder.position.y += .03; a.folder.rotation.y = r.ry; }
  else { a.folder.position.copy(t >= 5.4 ? FOLDER_B : FOLDER_A); a.folder.rotation.y = .2; }
  // the delivered folder is filed away at the end of the loop and the next one appears on the first desk
  setOpacity(a.folder, t >= 10.8 && t < 11.3 ? 1 - span(t, 10.8, 11.3, 'linear') : t >= 11.3 ? (a.folder.position.copy(FOLDER_A), span(t, 11.3, 11.9, 'linear')) : 1);
  const cw = a.caseworker.userData;
  cw.armL.rotation.x = cw.armR.rotation.x = -1.15 - .1 * Math.sin(t * Math.PI * 2 / 2) * span(t, 5.6, 6.0);
  cw.head.rotation.y = -.4 * span(t, 4.6, 5.0) * (1 - span(t, 5.6, 6.0));

  // the waiting customer glances at the display when the number changes
  a.waiting.userData.head.rotation.x = -.15 * span(t, 1.2, 1.6) * (1 - span(t, 2.6, 3.0));
  twinkle(a.lights, t, LOOP);
}

// ------------------------------------------------------------- decisions: AI recommends, a named role decides
export const DECISIONS = [
  { id: 'prefill', show: [2.6, 6.6], decide: 4.4,
    anchor: t => { const p = DOC_ADVISOR.clone().lerp(DOC_CUSTOMER, span(t, 3.6, 4.2) - span(t, 6.2, 6.8)); return [p.x, p.y, p.z]; }, pos: [.38, .04],
    kicker: 'AI recommendation', title: 'Pre-filled onboarding pack',
    body: 'Details captured at sign-up cover 11 of 14 fields. Confirm the remaining three with the customer instead of starting a new form.',
    role: 'Service advisor', verdict: 'Approved. The customer confirms three fields, not fourteen.', kind: 'approved' },
  { id: 'address', show: [4.9, 8.6], decide: 6.0,
    anchor: () => [-2.2, 1.2, .45], pos: [.025, .04],
    kicker: 'AI exception flag', title: 'Address mismatch',
    body: 'Proof of address differs from the address on file. Suggests a second document check (confidence 0.58).',
    role: 'Team lead', verdict: 'Overruled: the customer moved last month; the file is updated.', kind: 'overruled' },
  { id: 'setup', show: [7.0, 11.4], decide: 8.0,
    anchor: () => [COUNTER.x - 1.0, COUNTER.top + .62, COUNTER.z - .1], pos: [.64, .64],
    kicker: 'AI next best action', title: 'Book the setup call now',
    body: 'Customers who book setup during onboarding reach first use sooner. Offer a slot while the customer is here.',
    role: 'Service advisor', verdict: 'Approved. Setup call booked for Thursday.', kind: 'approved' },
];

export const create = (canvas, opts) => nightView(canvas, buildScene(), pose, { target: [.35, 2.05, 1.6], offset: [.9, .8, 14.6] }, opts);
export const decisionsAt = t => cardsAt(DECISIONS, LOOP, t);
export const mount = fig => mountScene(fig, { create, DECISIONS, decisionsAt, STILL_T, ART_W, ART_H });
