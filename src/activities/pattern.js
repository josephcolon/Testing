/* ==========================================================================
   pattern.js — "What comes next?"
   Shows a repeating color pattern (A B A B …) with a "?" at the end; tap the
   color that continues it. Early pattern recognition — great for the 5-year-old.
   ========================================================================== */

import { COLORS } from '../themes.js';
import { sample, shuffle, layoutGrid, choiceButton } from '../game/round.js';

export const id = 'pattern';
export const minDifficulty = 2; // patterns are a step up — skip for the youngest

export function create(theme, count) {
  const alphaSize = count <= 3 ? 2 : 3;
  const alpha = sample(COLORS, alphaSize);
  const reps = 2;
  const seq = [];
  for (let i = 0; i < alpha.length * reps; i++) seq.push(alpha[i % alpha.length]);
  const answer = alpha[seq.length % alpha.length];

  const prompt = { text: 'What comes next?', speechTokens: ['next'], icon: '➡️' };
  let board;
  return {
    prompt,
    mount(b, api) {
      board = b;
      b.style.display = 'flex';
      b.style.flexDirection = 'column';
      b.style.gridTemplateColumns = '';
      b.innerHTML = `
        <div class="pattern-seq">
          ${seq.map((c) => `<div class="ptile">${theme.hero(c.hex)}</div>`).join('')}
          <div class="ptile q">?</div>
        </div>
        <div class="pattern-choices"></div>
      `;
      const choiceRow = b.querySelector('.pattern-choices');
      shuffle(alpha).forEach((c) => {
        const btn = choiceButton(theme.hero(c.hex), (el) =>
          c.id === answer.id ? api.solved(el) : api.wrong(el), { target: c.id === answer.id });
        choiceRow.appendChild(btn);
      });
    },
    hintTarget() { return board && board.querySelector('.pattern-choices [data-target]'); },
  };
}
