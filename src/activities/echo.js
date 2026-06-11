/* ==========================================================================
   echo.js — "Watch, then copy!" (MEMORY: Simon-style sequence recall)
   The mascot lights up a short sequence of colored pads; the child repeats it.
   Builds working memory and attention. Gentle: a wrong tap just restarts the
   echo, never ends the round. Higher-difficulty only.
   ========================================================================== */

import { COLORS } from '../themes.js';
import { sample, randInt, layoutGrid } from '../game/round.js';

export const id = 'echo';
export const minDifficulty = 3;

export function create(theme, count) {
  const pads = count <= 4 ? 3 : 4;
  const len = count <= 4 ? 2 : 3;
  const palette = sample(COLORS, pads);
  const seq = Array.from({ length: len }, () => randInt(0, pads - 1));
  let board, expected = 0;

  function flash(el) {
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }

  return {
    prompt: { text: 'Watch, then copy!', speechTokens: ['echo'], icon: '🎵' },
    mount(b, api) {
      board = b;
      expected = 0;
      b.dataset.seq = seq.join(','); // (used by tests)
      layoutGrid(b, pads);
      b.innerHTML = '';
      const els = palette.map((c, i) => {
        const btn = document.createElement('button');
        btn.className = 'choice echo-pad';
        btn.dataset.pad = i;
        btn.style.setProperty('--pad', c.hex);
        btn.addEventListener('pointerdown', () => {
          if (i === seq[expected]) {
            flash(btn);
            expected += 1;
            if (expected >= seq.length) api.solved();
            else api.progress();
          } else {
            expected = 0; // restart the echo
            api.wrong(btn, { dim: false });
          }
        });
        b.appendChild(btn);
        return btn;
      });
      // Show the sequence once (purely visual; taps are accepted any time).
      seq.forEach((padIdx, k) => setTimeout(() => els[padIdx] && flash(els[padIdx]), 500 + k * 650));
    },
    hintTarget() { return board && board.querySelector(`.echo-pad[data-pad="${seq[expected]}"]`); },
  };
}
