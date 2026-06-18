/* ==========================================================================
   bubblepop.js — "Pop all the bubbles!" (FUN, PHYSICS: buoyancy + jostle)
   Bubbles float up, sway, and bump into each other; tap to pop with a splatter.
   Pure tactile cause-and-effect with real buoyancy.
   ========================================================================== */

import { COLORS } from '../themes.js';
import { sample } from '../game/round.js';
import { createWorld, makeBody, rand } from '../game/physics.js';
import { splatAt } from '../game/juice.js';

export const id = 'bubblepop';

export function create(theme, count) {
  const n = Math.min(9, count + 3);
  let world, popped = 0, board;
  const game = {
    prompt: { text: 'Pop all the bubbles!', speechTokens: ['pop'], icon: '🫧' },
    mount(b, api) {
      board = b;
      b.style.position = 'relative';
      b.style.display = 'block';
      b.style.overflow = 'hidden';
      world = createWorld(b, { gravity: 1300, drag: 0.5, restitution: 0.85, repel: true });
      const { w, h } = world.bounds();
      const r = Math.max(26, Math.min(64, Math.min(w, h) * 0.12));
      for (let i = 0; i < n; i++) {
        const hex = sample(COLORS, 1)[0].hex;
        const el = makeBody('bubble', `<span class="bub" style="--c:${hex}">${theme.hero(hex)}</span>`, (node) => {
          if (node._dead) return;
          node._dead = true;
          world.remove(body);
          splatAt(node, 22, 'sm');
          popped += 1;
          if (popped >= n) api.solved();
          else api.progress();
        });
        const body = world.add(el, {
          r, x: rand(r, w - r), y: rand(h * 0.45, h - r),
          vy: -rand(60, 150), buoyancy: rand(0.18, 0.32),
          sway: { freq: rand(1.2, 2.4), amp: rand(80, 160) }, drag: 0.5, restitution: 0.85,
        });
      }
      world.start();
    },
    teardown() { world && world.stop(); },
    hintTarget() { return board && board.querySelector('[data-target]'); },
  };
  return game;
}
