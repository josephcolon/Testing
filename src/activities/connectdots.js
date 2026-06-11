/* ==========================================================================
   connectdots.js — "Tap the numbers in order!" (LEARNING: number sequence)
   Numbered dots scattered on the board; tap 1, 2, 3 … in order. Builds the
   counting sequence and numeral recognition. A wrong pick is a gentle nudge.
   ========================================================================== */

import { shuffle, layoutGrid, choiceButton } from '../game/round.js';

export const id = 'connectdots';
export const minDifficulty = 2;

export function create(theme, count) {
  const n = Math.max(3, Math.min(6, count + 1));
  const nums = shuffle(Array.from({ length: n }, (_, i) => i + 1));
  let board, expected = 1;
  return {
    prompt: { text: 'Tap the numbers in order!', speechTokens: ['connect'], icon: '🔢' },
    mount(b, api) {
      board = b;
      expected = 1;
      layoutGrid(b, n);
      b.innerHTML = '';
      nums.forEach((num) => {
        const btn = choiceButton(`<span class="dotnum">${num}</span>`, (el) => {
          if (el.classList.contains('done')) return;
          if (num === expected) {
            el.classList.add('done', 'found');
            expected += 1;
            if (expected > n) api.solved();
            else api.progress();
          } else {
            api.wrong(el, { dim: false });
          }
        });
        btn.dataset.order = num;
        b.appendChild(btn);
      });
    },
    hintTarget() { return board && board.querySelector(`[data-order="${expected}"]:not(.done)`); },
  };
}
