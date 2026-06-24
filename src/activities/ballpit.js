/* ==========================================================================
   ballpit.js — "Pop all the balls!" (FUN, PHYSICS: bouncy collisions)
   A pit of bouncy balls ricochet around the panel; tap each to pop it with a
   splatter and a little screen shake. Springy, weighty, satisfying.
   ========================================================================== */

import { COLORS } from '../themes.js';
import { sample } from '../game/round.js';
import { createWorld, makeBody, rand } from '../game/physics.js';
import { splatAt } from '../game/juice.js';

export const id = 'ballpit';

export function create(theme, count) {
  const n = Math.min(9, count + 3);
  let world, popped = 0, board;
  return {
    prompt: { text: 'Pop all the balls!', speechTokens: ['pop'], icon: '⚽' },
    mount(b, api) {
      board = b;
      b.style.position = 'relative'; b.style.display = 'block'; b.style.overflow = 'hidden';
      world = createWorld(b, { gravity: 1500, drag: 0.05, restitution: 0.92, repel: true });
      const { w, h } = world.bounds();
      const r = Math.max(24, Math.min(56, Math.min(w, h) * 0.11));
      for (let i = 0; i < n; i++) {
        const hex = sample(COLORS, 1)[0].hex;
        const el = makeBody('ball', `<span class="ballc" style="--c:${hex}"></span>`, (node) => {
          if (node._dead) return;
          node._dead = true;
          world.remove(body);
          splatAt(node, 24, 'sm');
          popped += 1;
          if (popped >= n) api.solved();
          else api.progress();
        });
        const body = world.add(el, {
          r, x: rand(r, w - r), y: rand(r, h * 0.5),
          vx: rand(-260, 260), vy: rand(-120, 120), va: rand(-4, 4), spin: true,
          restitution: 0.92, drag: 0.05,
        });
      }
      world.start();
    },
    teardown() { world && world.stop(); },
    hintTarget() { return board && board.querySelector('[data-target]'); },
  };
}
