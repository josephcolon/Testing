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
  const n = Math.min(9, count + 3);
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
      world = createWorld(b, { gravity: 1200, drag: 0.5, restitution: 0.55, floor: true });
      const { w, h } = world.bounds();
      const r = Math.max(26, Math.min(58, Math.min(w, h) * 0.12));
      let oi = 0;
      isTarget.forEach((tgt) => {
        const hex = tgt ? target.hex : others[oi++ % others.length].hex;
        const el = makeBody('balloon', `<span class="bln" style="--c:${hex}"></span>`, (node) => {
          if (node._dead) return;
          node._dead = true;
          world.remove(body);
          splatAt(node, 20, 'sm');
          if (tgt) { popped += 1; if (popped >= k) api.solved(); else api.progress(); }
          else { api.wrong(node, { dim: false }); }
        }, { target: tgt });
        const body = world.add(el, {
          r, x: rand(r, w - r), y: rand(h * 0.5, h - r),
          vy: -rand(40, 90), buoyancy: rand(0.3, 0.5),
          sway: { freq: rand(1, 2), amp: rand(70, 140) }, drag: 0.5, restitution: 0.5,
        });
      });
      world.start();
    },
    teardown() { world && world.stop(); },
    hintTarget() { return board && board.querySelector('[data-target]'); },
  };
}
