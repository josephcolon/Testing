/* ==========================================================================
   peekaboo.js — "Peekaboo! Find the hiding one!" (FUN + object permanence)
   The hero hides behind one of several covers. Tap covers to peek; find the
   hider. Surprise & delight; a gentle "keep looking" on an empty cover.
   ========================================================================== */

import { COLORS } from '../themes.js';
import { sample, shuffle, randInt, layoutGrid, choiceButton } from '../game/round.js';

export const id = 'peekaboo';

export function create(theme, count) {
  const n = Math.max(2, Math.min(4, count));
  const hideAt = randInt(0, n - 1);
  const color = sample(COLORS, 1)[0].hex;
  const coverEmoji = theme.id === 'unicorns' ? '☁️' : '📦';
  let board;
  return {
    prompt: {
      text: `Find the hiding ${theme.nounSingular}!`,
      speechTokens: ['peekaboo'],
      icon: '👀',
    },
    mount(b, api) {
      board = b;
      layoutGrid(b, n);
      b.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const correct = i === hideAt;
        const btn = choiceButton(
          `<div class="cover">${coverEmoji}</div>`,
          (el) => {
            if (el.classList.contains('opened')) return;
            el.classList.add('opened');
            if (correct) {
              el.innerHTML = theme.hero(color);
              api.solved(el);
            } else {
              el.innerHTML = '<div class="cover empty">🌀</div>';
              api.wrong(el);
            }
          },
          { target: correct }
        );
        b.appendChild(btn);
      }
    },
    hintTarget() { return board && board.querySelector('[data-target]:not(.opened)'); },
  };
}
