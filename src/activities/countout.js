/* ==========================================================================
   countout.js — "Tap three trucks!" (tap them one at a time)
   Many identical heroes; tap exactly N of them, one per tap. Pure one-to-one
   counting — a different skill from picking the group of N.
   ========================================================================== */

import { NUMBER_WORDS, randInt, layoutGrid, choiceButton } from '../game/round.js';

export const id = 'countout';

export function create(theme, count) {
  const target = Math.max(2, Math.min(5, count));
  const total = Math.min(9, target + randInt(1, 3));
  const noun = theme.nounPlural;

  let board, taps = 0;
  return {
    prompt: {
      text: `Tap ${target} ${noun}!`,
      speechTokens: ['tap', `n_${target}`, noun],
      icon: `<span class="prompt-num">${target}</span>`,
    },
    mount(b, api) {
      board = b;
      taps = 0;
      layoutGrid(b, total);
      b.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const btn = choiceButton(theme.hero(theme.primary), (el) => {
          if (el.classList.contains('found')) return;
          el.classList.add('found');
          taps += 1;
          if (taps >= target) api.solved();
          else api.progress();
        }, { target: true });
        b.appendChild(btn);
      }
    },
    hintTarget() { return board && board.querySelector('.choice:not(.found)'); },
  };
}
