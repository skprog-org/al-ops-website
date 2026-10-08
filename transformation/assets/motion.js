// Shared runtime for the 3D scene modules (hub3d.js, growth3d.js): easing and keyframe tracks, cached materials and
// primitives, opacity and walk helpers, and mountScene(), which plays a scene with its decision cards over the static still.
import * as THREE from './vendor/three.module.min.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

// ------------------------------------------------------------- easing and tracks
export const ease = {
  linear: x => x,
  out: x => 1 - Math.pow(1 - x, 3),
  inOut: x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  back: x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
};
export const clamp01 = x => Math.max(0, Math.min(1, x));
export const span = (t, a, b, e = 'inOut') => ease[e](clamp01((t - a) / (b - a)));
export function track(keys, t) {            // keys: [time, value, easing into this key]
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b[0]) return a[1] + (b[1] - a[1]) * ease[b[2] || 'inOut']((t - a[0]) / (b[0] - a[0]));
  }
  return keys[keys.length - 1][1];
}

// ------------------------------------------------------------- materials and primitives
const mats = new Map();
export function mat(color, rough = .7, extra = {}) {
  const key = color + ':' + rough + ':' + JSON.stringify(extra);
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: 0 }, extra)));
  return mats.get(key);
}
export const glow = (color, k = 1.4) => mat(color, .5, { emissive: color, emissiveIntensity: k });
export function box(w, h, d, color, r = 0.04, o = {}) {
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * .98) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, o.material || mat(color, o.rough));
  m.castShadow = o.cast !== false; m.receiveShadow = true;
  return m;
}
export function cyl(r, h, color, seg = 18, o = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(o.r2 == null ? r : o.r2, r, h, seg), o.material || mat(color, o.rough));
  m.castShadow = o.cast !== false; m.receiveShadow = true; return m;
}
export function put(parent, obj, x, y, z, ry = 0) { obj.position.set(x, y, z); obj.rotation.y = ry; parent.add(obj); return obj; }
export function flat(w, d, color, y = 0, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), o.material || mat(color, .95));
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; return m;
}

// ------------------------------------------------------------- frame helpers
export function setOpacity(obj, a) {
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

export function walk(p, phase, amount) {
  const s = Math.sin(phase) * amount, u = p.userData;
  u.legL.rotation.x = s * .5; u.legR.rotation.x = -s * .5; u.armL.rotation.x = -s * .4; u.armR.rotation.x = s * .4;
}

// ------------------------------------------------------------- decisions: AI recommends, a named role decides
// visibility of each decision card at time t: fades in at show[0], out at show[1]; decided once t passes decide
export function cardsAt(decisions, loop, t) {
  t = ((t % loop) + loop) % loop;
  return decisions.map(d => {
    const [a, b] = d.show;
    const alpha = Math.min(span(t, a, a + .35, 'out'), 1 - span(t, b - .35, b, 'linear'));
    return { id: d.id, alpha: t >= a && t <= b ? alpha : 0, decided: t >= d.decide, pulse: .5 + .5 * Math.sin(t * Math.PI * 2 / .8), at: d.anchor(t) };
  });
}

// decision cards: HTML over the canvas, positioned each frame by projecting their 3D anchors
function overlay(stage, S) {
  const NS = 'http://www.w3.org/2000/svg', root = document.createElement('div');
  root.className = 'dc-layer'; root.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'dc-lines'); root.appendChild(svg);
  const items = S.DECISIONS.map(d => {
    const el = document.createElement('div'); el.className = 'dcard dc-' + d.kind;
    el.innerHTML = '<div class="dc-k"></div><div class="dc-t"></div><div class="dc-b"></div><div class="dc-v"><span class="dc-who"></span><span class="dc-s"></span></div>';
    el.querySelector('.dc-k').textContent = d.kicker; el.querySelector('.dc-t').textContent = d.title;
    el.querySelector('.dc-b').textContent = d.body; el.querySelector('.dc-who').textContent = d.role;
    const ln = document.createElementNS(NS, 'line'), dot = document.createElementNS(NS, 'circle'), ring = document.createElementNS(NS, 'circle');
    dot.setAttribute('r', 3.5); ring.setAttribute('class', 'dc-ring'); svg.append(ln, ring, dot); root.appendChild(el);
    return { d, el, ln, dot, ring, s: el.querySelector('.dc-s'), last: null };
  });
  stage.appendChild(root);
  // box: optional [left, right] in stage pixels that the cards must stay inside (a stage wider than the viewport)
  return function update(view, t, w, h, box) {
    const k = Math.max(.62, Math.min(1, w / 1300)), compact = w < 640;
    root.style.setProperty('--k', k); root.classList.toggle('is-compact', compact); svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    const all = S.decisionsAt(t);
    // small screens: only the newest visible card, so the scene stays readable
    let newest = -1; all.forEach((st, i) => { if (st.alpha > .01 && (newest < 0 || S.DECISIONS[i].show[0] > S.DECISIONS[newest].show[0])) newest = i; });
    all.forEach((st, i) => {
      const it = items[i], p = view.project(st.at[0], st.at[1], st.at[2], w, h);
      if (compact && i !== newest) st.alpha = 0;
      const show = st.alpha > .01;
      it.el.style.opacity = st.alpha; it.ln.style.opacity = it.dot.style.opacity = it.ring.style.opacity = st.alpha;
      it.el.style.visibility = show ? 'visible' : 'hidden';
      if (!show) return;
      const cw = it.el.offsetWidth, ch = it.el.offsetHeight;
      const x = Math.round(compact ? 6 : box ? Math.max(box[0], Math.min(box[1] - cw, box[0] + it.d.pos[0] * (box[1] - box[0])))
        : Math.max(6, Math.min(w - cw - 6, it.d.pos[0] * w))), y = Math.round(Math.max(6, Math.min(h - ch - 6, compact ? 6 : it.d.pos[1] * h)));
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
export function mountScene(fig, S) {
  const stage = fig.querySelector('.illus-stage'), btn = fig.querySelector('[data-motion-toggle]');
  const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true');
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fixed = fig.getAttribute('data-motion-t');            // optional: open paused at a given moment (previews)
  const view = S.create(canvas, { pixelRatio: Math.min(window.devicePixelRatio || 1, 2) });
  let playing = !still && fixed == null, visible = true, raf = null, t0 = performance.now(), tAt = fixed != null ? +fixed : still ? S.STILL_T : 0;
  let W = 0, H = 0, box = null;
  const now = () => (playing ? tAt + (performance.now() - t0) / 1000 : tAt);
  // --dc-safe (CSS, optional): the cards stay right of this fraction of the viewport, for a stage that bleeds off screen
  const fit = () => {
    W = stage.clientWidth; H = Math.round(W * S.ART_H / S.ART_W); view.size(W, H);
    const safe = parseFloat(getComputedStyle(stage).getPropertyValue('--dc-safe')), vw = document.documentElement.clientWidth;
    const left = stage.getBoundingClientRect().left;
    box = safe >= 0 ? [Math.max(6, safe * vw - left), Math.min(W - 6, vw - left - 24)] : null;
    if (box && box[1] - box[0] < 260) box = null;
  };
  stage.appendChild(canvas);
  const cards = overlay(stage, S);
  const draw = () => { const t = now(); view.renderAt(t); cards(view, t, W, H, box); };
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
