/* ==========================================================================
   sameordifferent.js — "Are they the same?" (LEARNING: comparison concept)
   Two heroes shown; tap "Same" or "Different". Builds the same/different
   concept that underpins sorting, matching, and patterning.
   ========================================================================== */

import { COLORS } from '../themes.js';
import { sample } from '../game/round.js';
import { line } from '../content/lines.js';

export const id = 'sameordifferent';

export function create(theme, count) {
  const same = Math.random() < 0.5;
  const [a, b] = sample(COLORS, 2);
  const left = theme.hero(a.hex);
  const right = theme.hero(same ? a.hex : b.hex);
  let board;
  return {
    prompt: { text: line('same_diff'), speechTokens: ['same_diff'], icon: '⚖️' },
    mount(boardEl, api) {
      board = boardEl;
      boardEl.style.display = 'flex';
      boardEl.style.flexDirection = 'column';
      boardEl.innerHTML = `
        <div class="sd-pair">
          <div class="sd-item">${left}</div>
          <div class="sd-vs">↔</div>
          <div class="sd-item">${right}</div>
        </div>
        <div class="sd-choices"></div>
      `;
      const row = boardEl.querySelector('.sd-choices');
      const opts = [
        { label: '✅ Same', yes: true },
        { label: '❌ Different', yes: false },
      ];
      opts.forEach((o) => {
        const btn = document.createElement('button');
        btn.className = 'choice sd-btn';
        btn.innerHTML = `<span class="sd-label">${o.label}</span>`;
        const correct = o.yes === same;
        if (correct) btn.dataset.target = '1';
        btn.addEventListener('pointerdown', () => (correct ? api.solved(btn) : api.wrong(btn)));
        row.appendChild(btn);
      });
    },
    hintTarget() { return board && board.querySelector('.sd-choices [data-target]'); },
  };
}
