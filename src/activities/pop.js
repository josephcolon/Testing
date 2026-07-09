/* ==========================================================================
   pop.js — "Pop them all!" (FUN)
   Floating bubbles; tap each to pop with a sparkle. Pure cause-and-effect joy
   (Toca/Sago ethos: tapping is its own reward). Incidental one-to-one counting.
   ========================================================================== */

import { COLORS } from '../themes.js';
import { sample, shuffle, layoutGrid, choiceButton } from '../game/round.js';
import { line } from '../content/lines.js';

export const id = 'pop';

export function create(theme, count) {
  const n = Math.min(9, count + 3);
  const colors = shuffle(Array.from({ length: n }, (_, i) => sample(COLORS, 1)[0].hex));
  let board, popped = 0;
  return {
    prompt: { text: line('pop'), speechTokens: ['pop'], icon: '🫧' },
    mount(b, api) {
      board = b;
      layoutGrid(b, n);
      b.innerHTML = '';
      colors.forEach((hex, i) => {
        const btn = choiceButton(
          `<div class="bubble" style="--d:${(i % 5) * 0.4}s">${theme.hero(hex)}</div>`,
          (el) => {
            if (el.classList.contains('popped')) return;
            el.classList.add('popped');
            popped += 1;
            if (popped >= n) api.solved();
            else api.progress();
          },
          { target: true }
        );
        b.appendChild(btn);
      });
    },
    hintTarget() { return board && board.querySelector('.choice:not(.popped)'); },
  };
}
