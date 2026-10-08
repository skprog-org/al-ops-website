// 3D onboarding operations room at dusk for the Financial Services page ("Build a more responsive financial business"):
// applications flow across a pipeline display (Received, Captured, Checks, Review, Opened); one exception drops to staff review,
// is cleared, and the account opens. Same flat night palette and conventions as growth3d.js: metres, posed from t alone, 12 s loop.
import * as THREE from './vendor/three.module.min.js';
import { span, track, box, put, setOpacity, walk, cardsAt, mountScene } from './motion.js';
import { N, label, person, SEATED, seat, chair, checkBadge, desk, wallScreen, city, cityLights, twinkle, backWall, nightLights, nightView } from './night.js';

export const LOOP = 12;
export const STILL_T = 7.4;
export const ART_W = 2400, ART_H = 1350;

// ------------------------------------------------------------- the pipeline display
const PIPE = { x: -2.35, y: 3.25, w: 5.5, h: 1.75 };
const STAGES = ['Received', 'Captured', 'Checks', 'Review', 'Opened'];
const stageX = i => PIPE.x - PIPE.w / 2 + .62 + i * 1.065;
const LANE_Y = PIPE.y - .05, REVIEW_Y = PIPE.y - .55, Z_TOKEN = .075;
const LANE_X0 = PIPE.x - PIPE.w / 2 + .2, LANE_LEN = PIPE.w - .4;
const TOKENS = 8, TOKEN_SP = LANE_LEN / TOKENS;
const TOKEN_V = 2 * TOKEN_SP / LOOP;               // two spacings per loop: the flow is seamless
const EXC = { at: 3.0, drop: [3.2, 3.8], cleared: 6.6, rejoin: [6.8, 7.6], out: [9.6, 10.2] };

function token(color, w = .3) {
  const g = new THREE.Group();
  put(g, box(w, .2, .02, color, .02, { rough: .95, cast: false }), 0, 0, 0);
  put(g, box(w * .55, .025, .004, color === N.card ? N.line : 0x4f6ba8, 0, { cast: false }), -w * .12, .02, .012);
  return g;
}

const WIN = { x0: 2.45, x1: 6.05, y0: 1.3, y1: 4.15 };
function room(root) {
  backWall(root, WIN);
  wallScreen(root, PIPE);
  put(root, label('Onboarding · today', 1.9, .12, { w: 512 }), PIPE.x - PIPE.w / 2 + 1.15, PIPE.y + PIPE.h / 2 - .2, .065);
  STAGES.forEach((s, i) => {
    put(root, label(s, .98, .13, { w: 320, h: 42, size: 21, bg: i === 3 ? '#5a4a2a' : '#4c5466' }), stageX(i), PIPE.y + .38, .065);
    if (i) put(root, box(.012, 1.05, .004, N.boardEdge, 0, { cast: false }), stageX(i) - .53, PIPE.y - .22, .064);
  });
  put(root, box(LANE_LEN, .012, .004, N.header, 0, { cast: false }), PIPE.x, LANE_Y, .064);
  put(root, box(1.0, .3, .004, 0x3a3326, 0, { cast: false }), stageX(3), REVIEW_Y, .064);      // the review tray under Review
  // desks for two analysts, a team lead's spot, plants, the window onto the financial district
  const screens = [desk(root, -1.3, .55), desk(root, 1.0, .55), desk(root, 3.3, .55)];
  for (const x of [-1.3, 1.0, 3.3]) put(root, chair(Math.PI), x, 0, 1.25);
  put(root, box(1.2, .75, .5, N.header, .03), -5.3, .375, .3);                    // filing cabinet
  for (const y of [.2, .55]) put(root, box(1.1, .01, .01, N.boardEdge, 0, { cast: false }), -5.3, y, .56);
  const pot = box(.36, .42, .36, N.header, .04); put(root, pot, 5.4, .21, 1.1);
  for (const [x, y, z, r] of [[0, .75, 0, .3], [.14, .95, .05, .22], [-.12, 1.0, -.04, .2]]) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), new THREE.MeshStandardMaterial({ color: 0x2f5a52, roughness: .95, flatShading: true }));
    m.castShadow = true; put(root, m, 5.4 + x, y, 1.1 + z);
  }
  return { screens };
}

function buildScene() {
  const scene = new THREE.Scene();
  nightLights(scene);
  const root = new THREE.Group(); scene.add(root);
  const lights = cityLights();
  city(root, lights, { dx: 2.2, dy: 1.6 });
  const { screens } = room(root);
  const a = {
    flow: Array.from({ length: TOKENS }, (_, i) => token(i % 3 === 1 ? N.cardBlue : N.card)),
    exc: token(N.amber, .34), check: checkBadge(),
    analyst: seat(person({ top: N.topNavy, skin: N.skin2, hair: N.hair2 })),
    reviewer: seat(person({ top: N.topCream, skin: N.skin1, hair: N.hair1, bun: true })),
    lead: person({ top: N.topBlue, skin: N.skin4, hair: N.hair4 }),
    third: seat(person({ top: N.topGrey, skin: N.skin3, hair: N.hair3 })),
    screens, lights, root,
  };
  a.flow.forEach(f => root.add(f));
  for (const k of ['exc', 'check', 'analyst', 'reviewer', 'lead', 'third']) root.add(a[k]);
  put(root, a.third, 3.3, SEATED, 1.05, Math.PI);
  put(root, a.analyst, -1.3, SEATED, 1.05, Math.PI); put(root, a.reviewer, 1.0, SEATED, 1.05, Math.PI);
  return { scene, actors: a };
}

// ------------------------------------------------------------- motion
function excAt(t) {                  // the exception: leaves the lane at Checks, waits in review, rejoins at Opened
  const lane = new THREE.Vector3(stageX(2), LANE_Y, Z_TOKEN), tray = new THREE.Vector3(stageX(3), REVIEW_Y, Z_TOKEN), done = new THREE.Vector3(stageX(4), LANE_Y, Z_TOKEN);
  if (t < EXC.drop[0]) return lane;
  if (t < EXC.rejoin[0]) return lane.lerp(tray, span(t, ...EXC.drop));
  return tray.lerp(done, span(t, ...EXC.rejoin));
}
// the team lead walks over from the display to the reviewer's desk, then back
const LEAD_A = new THREE.Vector3(-4.6, 0, 1.55), LEAD_B = new THREE.Vector3(1.75, 0, 1.6);
function leadAt(t) {
  const go = span(t, 6.9, 8.7, 'inOut'), back = span(t, 10.1, 11.8, 'inOut');
  // headings: face the display, walk right, turn to the reviewer, walk left, face the display again
  const P = Math.PI, ry = track([[0, P + .25], [6.6, P + .25], [6.9, P / 2], [8.7, P / 2], [9.0, P + .94], [9.9, P + .94], [10.1, 3 * P / 2], [11.8, 3 * P / 2], [12, P + .25]], t);
  return { p: LEAD_A.clone().lerp(LEAD_B, go - back), ry, moving: Math.max(Math.sin(Math.PI * go), Math.sin(Math.PI * back)) };
}

function pose(a, t) {
  t = ((t % LOOP) + LOOP) % LOOP;

  // applications move along the lane, fading in at Received and out after Opened
  a.flow.forEach((f, i) => {
    const u = ((i * TOKEN_SP + TOKEN_V * t) % LANE_LEN + LANE_LEN) % LANE_LEN;
    f.position.set(LANE_X0 + u, LANE_Y, Z_TOKEN);
    setOpacity(f, Math.min(1, u / .35, (LANE_LEN - u) / .35));
  });
  // the exception appears at Checks, drops to review, is cleared and rejoins; amber until cleared
  const e = excAt(t), shown = t >= EXC.at - .3 && t < EXC.out[1];
  a.exc.position.copy(e);
  setOpacity(a.exc, shown ? Math.min(span(t, EXC.at - .3, EXC.at, 'out'), 1 - span(t, ...EXC.out, 'linear')) : 0);
  const cleared = span(t, EXC.cleared, EXC.cleared + .3, 'linear');
  a.exc.children[0].material.color.setHex(N.amber).lerp(new THREE.Color(N.cardBlue), cleared);
  const ck = span(t, 9.0, 9.35, 'back') * (1 - span(t, 10.2, 10.5, 'out'));
  a.check.position.set(stageX(4) + .22, LANE_Y + .14, Z_TOKEN + .05); a.check.scale.setScalar(Math.max(.001, ck * .8)); a.check.visible = ck > .01;

  // analysts at their screens; the reviewer leans in while the exception is in review
  const rv = a.reviewer.userData, an = a.analyst.userData;
  an.armL.rotation.x = -1.15 - .1 * Math.sin(t * Math.PI * 2 / 1.2); an.head.rotation.y = .5 * span(t, 1.0, 1.4) * (1 - span(t, 2.6, 3.0));
  const review = span(t, 3.8, 4.2) * (1 - span(t, 6.6, 7.0));
  rv.head.rotation.x = .25 * review; rv.armR.rotation.x = -1.15 - .15 * review * Math.sin(t * Math.PI * 2 / .9);
  rv.head.rotation.y = -.6 * span(t, 8.5, 8.9) * (1 - span(t, 9.8, 10.2));
  a.screens[1].emissiveIntensity = .25 + .35 * review;
  a.third.userData.armR.rotation.x = -1.15 - .1 * Math.sin(t * Math.PI * 2 / 1.5 + 1);

  // team lead
  const l = leadAt(t), lead = a.lead;
  lead.position.copy(l.p); lead.rotation.y = l.ry;
  walk(lead, t * Math.PI * 2 * 1.4, Math.min(1, l.moving * 1.6));
  if (l.moving < .02) lead.userData.armL.rotation.x = lead.userData.armR.rotation.x = -.12;
  lead.userData.head.rotation.x = -.15 * (1 - span(t, 6.5, 6.9) + span(t, 11.8, 12));          // looks up at the display

  twinkle(a.lights, t, LOOP);
}

// ------------------------------------------------------------- decisions: AI recommends, a named role decides
export const DECISIONS = [
  { id: 'reuse', show: [.4, 4.0], decide: 1.6,
    anchor: () => [stageX(1), LANE_Y, Z_TOKEN], pos: [.40, .04],
    kicker: 'AI recommendation', title: 'Reuse verified identity',
    body: 'This applicant was verified for a savings account three months ago. Reuse that check and request only the new information.',
    role: 'Onboarding analyst', verdict: 'Approved. Two documents requested instead of seven.', kind: 'approved' },
  { id: 'screening', show: [3.3, 7.6], decide: 6.6,
    anchor: t => { const p = excAt(t); return [p.x, p.y, p.z]; }, pos: [.64, .04],
    kicker: 'AI exception flag', title: 'Possible screening match',
    body: 'Partial name match to a screening list entry (confidence 0.41). Routed to staff review before the account opens.',
    role: 'Compliance reviewer', verdict: 'Cleared after review: different date of birth and nationality. Reasons recorded.', kind: 'overruled' },
  { id: 'open', show: [7.8, 11.6], decide: 9.0,
    anchor: () => [stageX(4), LANE_Y, Z_TOKEN], pos: [.64, .04],
    kicker: 'AI readiness check', title: 'Ready to open the account',
    body: 'All checks are complete and the review is closed. Open the account in the core system and notify the customer.',
    role: 'Team lead', verdict: 'Approved. Account opened; customer notified.', kind: 'approved' },
];

export const create = (canvas, opts) => nightView(canvas, buildScene(), pose, { target: [-.1, 2.3, 1.2], offset: [.8, .5, 12.4] }, opts);
export const decisionsAt = t => cardsAt(DECISIONS, LOOP, t);
export const mount = fig => mountScene(fig, { create, DECISIONS, decisionsAt, STILL_T, ART_W, ART_H });
