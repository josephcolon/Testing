/* ==========================================================================
   balloonpop.js — "Pop all the red ones!" (FUN + color, PHYSICS: rising + sway)
   Balloons rise and bob on their strings. Pop every balloon of the named color;
   popping a wrong color is a gentle "try again" (it still pops — satisfying).
   ========================================================================== */

import { COLORS } from '../themes.js';
import { sample, randInt } from '../game/round.js';
import { createWorld, makeBody, rand } from '../game/physics.js';
import { splatAt } from '../game/juice.js';

export const id = 'balloonpop';

export function create(theme, count) {
  const n = Math.min(7, count + 2);
  const target = sample(COLORS, 1)[0];
  const others = COLORS.filter((c) => c.id !== target.id);
  const k = Math.max(2, Math.min(n - 1, randInt(2, Math.ceil(n / 2))));
  // Decide which balloons are the target color.
  const isTarget = Array.from({ length: n }, (_, i) => i < k);
  for (let i = n - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [isTarget[i], isTarget[j]] = [isTarget[j], isTarget[i]]; }

  let world, popped = 0, board;
  return {
    prompt: {
      text: `Pop all the ${target.name} ones!`,
      speechTokens: ['tap_all', `c_${target.id}`],
      icon: `<span class="swatch" style="background:${target.hex}"></span>`,
    },
    mount(b, api) {
      board = b;
      b.style.position = 'relative'; b.style.display = 'block'; b.style.overflow = 'hidden';
      // repel keeps balloons spaced apart so each is easy to tap on its own.
      world = createWorld(b, { gravity: 1100, drag: 0.7, restitution: 0.4, repel: true });
      const { w, h } = world.bounds();
      const r = Math.max(30, Math.min(64, Math.min(w, h) * 0.14));
      let oi = 0;
      isTarget.forEach((tgt, i) => {
        const hex = tgt ? target.hex : others[oi++ % others.length].hex;
        const el = makeBody('balloon', `<span class="bln" style="--c:${hex}"></span>`, (node) => {
          if (node._dead) return;
          node._dead = true;
          world.remove(body);
          splatAt(node, 20, 'sm');
          if (tgt) { popped += 1; if (popped >= k) api.solved(); else api.progress(); }
          else { api.wrong(node, { dim: false }); }
        }, { target: tgt });
        // Spread starting positions across the width so they don't pile up.
        const slot = (i + 0.5) / n;
        const body = world.add(el, {
          r, x: Math.max(r, Math.min(w - r, slot * w + rand(-r, r))), y: rand(h * 0.55, h - r),
          vy: -rand(25, 55), buoyancy: rand(0.12, 0.22),
          sway: { freq: rand(0.8, 1.6), amp: rand(50, 100) }, drag: 0.7, restitution: 0.35,
        });
      });
      world.start();
    },
    teardown() { world && world.stop(); },
    hintTarget() { return board && board.querySelector('[data-target]'); },
  };
}
