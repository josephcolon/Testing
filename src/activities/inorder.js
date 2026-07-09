/* ==========================================================================
   inorder.js — "Tap them in order, smallest first!" (LEARNING: seriation)
   Same hero at several sizes, scrambled; tap from smallest to biggest. Builds
   seriation (ordering by magnitude). Order-dependent: a wrong pick is a gentle
   "try again" but never removes a card.
   ========================================================================== */

import { COLORS } from '../themes.js';
import { sample, shuffle, layoutGrid, choiceButton } from '../game/round.js';
import { line } from '../content/lines.js';

export const id = 'inorder';
export const minDifficulty = 2;

export function create(theme, count) {
  const n = Math.max(3, Math.min(5, count + 1));
  const color = sample(COLORS, 1)[0].hex;
  const sizes = [];
  for (let i = 0; i < n; i++) sizes.push(38 + i * (58 / (n - 1)));

  let board, expected = 0;
  // ranks[i] = size order (0 = smallest). Build cards then shuffle positions.
  const cards = sizes.map((s, rank) => ({ rank, size: s }));

  return {
    prompt: { text: line('prompt_smallest_first'), speechTokens: ['in_order'], icon: '📏' },
    mount(b, api) {
      board = b;
      expected = 0;
      layoutGrid(b, n);
      b.innerHTML = '';
      shuffle(cards).forEach((card) => {
        const btn = choiceButton(
          `<div class="sizer" style="width:${card.size}%">${theme.hero(color)}</div>`,
          (el) => {
            if (el.classList.contains('done')) return;
            if (card.rank === expected) {
              el.classList.add('done');
              el.classList.add('found');
              expected += 1;
              if (expected >= n) api.solved();
              else api.progress();
            } else {
              api.wrong(el, { dim: false });
            }
          }
        );
        btn.dataset.order = card.rank;
        b.appendChild(btn);
      });
    },
    hintTarget() { return board && board.querySelector(`[data-order="${expected}"]:not(.done)`); },
  };
}
