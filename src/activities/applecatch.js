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
      // Low gravity + drag => a slow, floaty descent kids can tap mid-air.
      world = createWorld(b, { gravity: 620, drag: 0.45, restitution: 0.4, repel: true });
      const { w, h } = world.bounds();
      const r = Math.max(28, Math.min(58, Math.min(w, h) * 0.13));
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
          // Stagger the start heights so they drift in a few at a time.
          r, x: rand(r, w - r), y: -rand(r, h * 1.1),
          vx: rand(-30, 30), vy: rand(0, 30), va: rand(-1.5, 1.5), restitution: 0.4, drag: 0.45,
        });
      }
      world.start();
    },
    teardown() { world && world.stop(); },
    hintTarget() { return board && board.querySelector('[data-target]'); },
  };
}
