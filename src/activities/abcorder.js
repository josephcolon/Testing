/* abcorder.js — "Tap the letters in order!" (LITERACY: alphabet sequence) */
import { LETTERS } from '../game/letters.js';
import { shuffle, randInt, layoutGrid, choiceButton } from '../game/round.js';

export const id = 'abcorder';
export const minDifficulty = 2;

export function create(theme, count) {
  const n = Math.max(3, Math.min(6, count + 1));
  const start = randInt(0, LETTERS.length - n);
  const seq = LETTERS.slice(start, start + n); // consecutive letters
  let board, expected = 0;
  return {
    prompt: { text: `Tap the letters in order, from ${seq[0]}!`, speechTokens: ['abc_order'], icon: '🔤' },
    mount(b, api) {
      board = b;
      expected = 0;
      layoutGrid(b, n);
      b.innerHTML = '';
      shuffle(seq.map((L, i) => ({ L, rank: i }))).forEach((o) => {
        const btn = choiceButton(`<span class="glyph-letter">${o.L}</span>`, (el) => {
          if (el.classList.contains('done')) return;
          if (o.rank === expected) {
            el.classList.add('done', 'found');
            expected += 1;
            if (expected >= n) api.solved();
            else api.progress();
          } else api.wrong(el, { dim: false });
        });
        btn.dataset.order = o.rank;
        b.appendChild(btn);
      });
    },
    hintTarget() { return board && board.querySelector(`[data-order="${expected}"]:not(.done)`); },
  };
}
