/* ==========================================================================
   echo.js — "Watch, then copy!" (MEMORY: Simon-style sequence recall)
   The mascot lights up a short sequence of colored pads; the child repeats it.
   A big "Watch again 🔁" button replays the sequence any time, and a wrong tap
   automatically shows it again — so a child who looked away is never stuck.
   Gentle: a wrong tap just restarts the echo, never ends the round.
   ========================================================================== */

import { COLORS } from '../themes.js';
import { sample, randInt, layoutGrid } from '../game/round.js';
import { line } from '../content/lines.js';

export const id = 'echo';
export const minDifficulty = 3;

export function create(theme, count) {
  const pads = count <= 4 ? 3 : 4;
  const len = count <= 4 ? 2 : 3;
  const palette = sample(COLORS, pads);
  const seq = Array.from({ length: len }, () => randInt(0, pads - 1));
  let board, expected = 0, els = [], demoTimers = [];

  const flash = (el) => { if (!el) return; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); };

  function playDemo() {
    demoTimers.forEach(clearTimeout);
    demoTimers = seq.map((padIdx, k) => setTimeout(() => flash(els[padIdx]), 450 + k * 650));
  }

  return {
    prompt: { text: line('echo'), speechTokens: ['echo'], icon: '🎵' },
    mount(b, api) {
      board = b;
      expected = 0;
      b.style.display = 'flex';
      b.style.flexDirection = 'column';
      b.innerHTML = `<div class="echo-pads"></div><button class="btn echo-replay">🔁 Watch again</button>`;
      const padWrap = b.querySelector('.echo-pads');
      layoutGrid(padWrap, pads);
      padWrap.dataset.seq = seq.join(','); // (used by tests)
      b.dataset.seq = seq.join(',');
      els = palette.map((c, i) => {
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
            expected = 0;
            api.wrong(btn, { dim: false });
            playDemo(); // show it again after a miss
          }
        });
        padWrap.appendChild(btn);
        return btn;
      });
      b.querySelector('.echo-replay').addEventListener('pointerdown', (e) => { e.stopPropagation(); playDemo(); });
      playDemo();
    },
    teardown() { demoTimers.forEach(clearTimeout); },
    hintTarget() { return board && board.querySelector(`.echo-pad[data-pad="${seq[expected]}"]`); },
  };
}
