/* ==========================================================================
   letterpop.js — "Pop the letter A!" (LITERACY + PHYSICS)
   Letter bubbles float up; pop every bubble showing the named letter. A classic
   ABCmouse mechanic, here with real buoyancy and a splatter pop.
   ========================================================================== */

import { LETTERS, letterToken } from '../game/letters.js';
import { sample, randInt } from '../game/round.js';
import { createWorld, makeBody, rand } from '../game/physics.js';
import { splatAt } from '../game/juice.js';

export const id = 'letterpop';

export function create(theme, count) {
  const n = Math.min(8, count + 3);
  const target = sample(LETTERS, 1)[0];
  const others = LETTERS.filter((L) => L !== target);
  const k = Math.max(2, Math.min(n - 1, randInt(2, Math.ceil(n / 2))));
  const isTarget = Array.from({ length: n }, (_, i) => i < k);
  for (let i = n - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [isTarget[i], isTarget[j]] = [isTarget[j], isTarget[i]]; }

  let world, popped = 0, board;
  return {
    prompt: { text: `Pop the letter ${target}!`, speechTokens: ['pop_letter', letterToken(target)], icon: `<span class="glyph-mini">${target}</span>` },
    mount(b, api) {
      board = b;
      b.style.position = 'relative'; b.style.display = 'block'; b.style.overflow = 'hidden';
      world = createWorld(b, { gravity: 1100, drag: 0.7, restitution: 0.5, repel: true });
      const { w, h } = world.bounds();
      const r = Math.max(28, Math.min(60, Math.min(w, h) * 0.13));
      let oi = 0;
      isTarget.forEach((tgt, i) => {
        const L = tgt ? target : others[oi++ % others.length];
        const el = makeBody('bubble letter', `<span class="bub" style="--c:#7ec8ff"><span class="bub-letter">${L}</span></span>`, (node) => {
          if (node._dead) return;
          node._dead = true;
          world.remove(body);
          splatAt(node, 22, 'sm');
          if (tgt) { popped += 1; if (popped >= k) api.solved(); else api.progress(); }
          else api.wrong(node, { dim: false });
        }, { target: tgt });
        const slot = (i + 0.5) / n;
        const body = world.add(el, {
          r, x: Math.max(r, Math.min(w - r, slot * w + rand(-r, r))), y: rand(h * 0.5, h - r),
          vy: -rand(30, 60), buoyancy: rand(0.12, 0.22),
          sway: { freq: rand(0.8, 1.6), amp: rand(50, 110) }, drag: 0.7, restitution: 0.45,
        });
      });
      world.start();
    },
    teardown() { world && world.stop(); },
    hintTarget() { return board && board.querySelector('[data-target]'); },
  };
}
