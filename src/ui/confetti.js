/* ==========================================================================
   confetti.js — tiny self-contained confetti burst (no dependencies).
   Paints onto the full-screen #confetti canvas above the UI.
   ========================================================================== */

const COLORS = ['#ff4d4d', '#3d8bff', '#4caf50', '#ffd23f', '#9b5de5', '#ff7bc0', '#ff9f1c'];
let canvas, gctx, particles = [], raf = null;

function ensureCanvas() {
  if (canvas) return;
  canvas = document.getElementById('confetti');
  gctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}
function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

/**
 * Fire a confetti burst.
 * @param {{x?:number, y?:number, count?:number}} opts  origin (0..1 of screen) + amount
 */
export function burst({ x = 0.5, y = 0.45, count = 90 } = {}) {
  ensureCanvas();
  const ox = x * canvas.width;
  const oy = y * canvas.height;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    particles.push({
      x: ox, y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      size: 6 + Math.random() * 8,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 60 + Math.random() * 40,
    });
  }
  if (!raf) raf = requestAnimationFrame(tick);
}

function tick() {
  gctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((p) => p.life > 0);
  for (const p of particles) {
    p.vy += 0.25;        // gravity
    p.vx *= 0.99;        // drag
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life--;
    gctx.save();
    gctx.translate(p.x, p.y);
    gctx.rotate(p.rot);
    gctx.fillStyle = p.color;
    gctx.globalAlpha = Math.min(1, p.life / 30);
    gctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    gctx.restore();
  }
  if (particles.length) {
    raf = requestAnimationFrame(tick);
  } else {
    gctx.clearRect(0, 0, canvas.width, canvas.height);
    raf = null;
  }
}
