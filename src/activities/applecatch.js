/* ==========================================================================
   applecatch.js — "Tap N treats!" (FUN + counting, PHYSICS: falling + bounce)
   Treats tumble down under gravity and bounce as they land; tap N of them.
   One-to-one counting with real falling motion — no time pressure (they settle
   and wait to be tapped).
   ========================================================================== */

import { randInt } from '../game/round.js';
import { createWorld, makeBody, rand } from '../game/physics.js';
import { splatAt } from '../game/juice.js';

export const id = 'applecatch';

export function create(theme, count) {
  const target = Math.max(2, Math.min(5, count));
  const total = Math.min(9, target + randInt(2, 3));
  const treat = theme.id === 'unicorns' ? '🍓' : '🍎';
  let world, taps = 0, board;
  return {
    prompt: {
      text: `Tap ${target} treats!`,
      speechTokens: ['tap', `n_${target}`, 'treats'],
      icon: '🍏',
    },
    mount(b, api) {
      board = b;
      b.style.position = 'relative'; b.style.display = 'block'; b.style.overflow = 'hidden';
      world = createWorld(b, { gravity: 1700, drag: 0.25, restitution: 0.5 });
      const { w, h } = world.bounds();
      const r = Math.max(26, Math.min(56, Math.min(w, h) * 0.12));
      for (let i = 0; i < total; i++) {
        const el = makeBody('treat-body', `<span class="treat-emoji">${treat}</span>`, (node) => {
          if (node._dead || taps >= target) return;
          node._dead = true;
          world.remove(body);
          splatAt(node, 18, 'sm');
          taps += 1;
          if (taps >= target) api.solved();
          else api.progress();
        });
        const body = world.add(el, {
          r, x: rand(r, w - r), y: rand(-h * 0.4, r), // start above the view
          vx: rand(-40, 40), vy: rand(0, 60), va: rand(-2, 2), restitution: 0.5, drag: 0.25,
        });
      }
      world.start();
    },
    teardown() { world && world.stop(); },
    hintTarget() { return board && board.querySelector('[data-target]'); },
  };
}
