/* ==========================================================================
   physics.js — a tiny, dependency-free 2D physics world.

   Bodies are circles with position + velocity. The world applies gravity (or
   buoyancy for floaty things), light air drag, optional sideways sway, soft
   mutual repulsion, and bouncy collisions with the container walls/floor. Each
   body owns a DOM element which we move with a CSS transform every frame — so
   the things kids tap are real DOM buttons (crisp, accessible, testable) that
   move with genuine physics.

   Why custom instead of a library: full control, ~1 small file, zero deps, and
   it runs headless in tests (step() is deterministic; the RAF loop is optional).
   ========================================================================== */

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const RAF = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : null;
const CAF = typeof cancelAnimationFrame !== 'undefined' ? cancelAnimationFrame : null;

export function createWorld(container, opts = {}) {
  const cfg = {
    gravity: 1500,       // px/s^2 downward
    drag: 0.6,           // velocity damping per second
    restitution: 0.65,   // wall/floor bounciness
    repel: false,        // soft push-apart between bodies
    floor: true,         // collide with the bottom
    ...opts,
  };
  const bodies = [];
  let raf = null, running = false, last = 0;

  function bounds() {
    const w = container.clientWidth || container.offsetWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const h = container.clientHeight || container.offsetHeight || (typeof window !== 'undefined' ? window.innerHeight : 600);
    return { w, h };
  }

  function add(el, b) {
    el.style.position = 'absolute';
    el.style.left = '0';
    el.style.top = '0';
    el.style.width = b.r * 2 + 'px';
    el.style.height = b.r * 2 + 'px';
    el.style.willChange = 'transform';
    container.appendChild(el);
    const body = { vx: 0, vy: 0, angle: 0, va: 0, swayT: Math.random() * 6, ...b, el };
    bodies.push(body);
    place(body);
    return body;
  }

  function remove(body) {
    const i = bodies.indexOf(body);
    if (i >= 0) bodies.splice(i, 1);
    if (body.el && body.el.parentNode) body.el.parentNode.removeChild(body.el);
  }

  function place(b) {
    b.el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px) rotate(${b.angle}rad)`;
  }

  const MAX_V = 1500;   // clamp linear speed so nothing rockets off
  const MAX_VA = 5;     // clamp angular speed so nothing spins out of control

  function step(dt) {
    const { w, h } = bounds();
    for (const b of bodies) {
      const g = b.buoyancy ? -cfg.gravity * b.buoyancy : cfg.gravity * (b.gravityScale ?? 1);
      b.vy += g * dt;
      if (b.sway) { b.swayT += dt; b.vx += Math.sin(b.swayT * b.sway.freq) * b.sway.amp * dt; }
      const d = b.drag ?? cfg.drag;
      b.vx *= Math.max(0, 1 - d * dt);
      b.vy *= Math.max(0, 1 - d * dt);
      // Clamp speed.
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > MAX_V) { b.vx *= MAX_V / sp; b.vy *= MAX_V / sp; }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      // Spin only opts-in; always damp + clamp it so it can't run away.
      b.va *= Math.max(0, 1 - 1.8 * dt);
      if (b.va > MAX_VA) b.va = MAX_VA; else if (b.va < -MAX_VA) b.va = -MAX_VA;
      b.angle += b.va * dt;

      const e = b.restitution ?? cfg.restitution;
      const spinKick = b.spin ? 0.4 : 0;
      if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) * e; b.va += spinKick; }
      else if (b.x + b.r > w) { b.x = w - b.r; b.vx = -Math.abs(b.vx) * e; b.va -= spinKick; }
      if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy) * e; }
      else if (cfg.floor && b.y + b.r > h) {
        b.y = h - b.r; b.vy = -Math.abs(b.vy) * e; b.vx *= 0.96; b.va *= 0.9;
        if (Math.abs(b.vy) < 25) b.vy = 0; // settle
      }
    }

    if (cfg.repel) {
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], c = bodies[j];
          let dx = c.x - a.x, dy = c.y - a.y;
          let dist = Math.hypot(dx, dy) || 0.01;
          const min = a.r + c.r;
          if (dist < min) {
            const push = (min - dist) / 2;
            dx /= dist; dy /= dist;
            a.x -= dx * push; a.y -= dy * push;
            c.x += dx * push; c.y += dy * push;
            // Gentle velocity nudge (was large enough to add runaway energy).
            a.vx -= dx * 3; c.vx += dx * 3;
          }
        }
      }
    }
    for (const b of bodies) place(b);
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.034, ((t - last) || 16) / 1000);
    last = t;
    step(dt);
    if (RAF) raf = RAF(frame);
  }

  function start() {
    if (running || !RAF) return;
    running = true;
    last = now();
    raf = RAF(frame);
  }

  function stop() {
    running = false;
    if (raf && CAF) CAF(raf);
    raf = null;
  }

  return { add, remove, step, start, stop, bodies, bounds, cfg };
}

/** Build a tappable physics body element. */
export function makeBody(cls, html, onTap, { target = true } = {}) {
  const el = document.createElement('button');
  el.className = 'phys-body ' + cls;
  if (target) el.dataset.target = '1';
  el.innerHTML = html;
  el.addEventListener('pointerdown', () => onTap(el));
  return el;
}

export const rand = (a, b) => a + Math.random() * (b - a);

