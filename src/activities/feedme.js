/* ==========================================================================
   feedme.js — "Feed them N treats!" (FUN + counting, with a little story)
   A hungry mascot; tap N treats to feed it (each one nom-noms away). Wraps
   one-to-one counting in a caring, meaningful mini-narrative (Pillar 3).
   ========================================================================== */

import { mascotSVG } from '../mascots.js';
import { randInt } from '../game/round.js';

export const id = 'feedme';

export function create(theme, count) {
  const target = Math.max(2, Math.min(5, count));
  const total = Math.min(9, target + randInt(1, 3));
  const treat = theme.id === 'unicorns' ? '🧁' : '🛢️';
  let board, fed = 0;
  return {
    prompt: {
      text: `Feed ${target} treats!`,
      speechTokens: ['feed', `n_${target}`, 'treats'],
      icon: '🍽️',
    },
    mount(b, api) {
      board = b;
      fed = 0;
      b.style.display = 'flex';
      b.style.flexDirection = 'column';
      b.innerHTML = `<div class="feed-mascot">${mascotSVG(theme.id, 'happy')}</div><div class="feed-treats choices"></div>`;
      const mascotEl = b.querySelector('.feed-mascot');
      const row = b.querySelector('.feed-treats');
      for (let i = 0; i < total; i++) {
        const btn = document.createElement('button');
        btn.className = 'choice treat';
        btn.dataset.target = '1';
        btn.innerHTML = `<span class="treat-emoji">${treat}</span>`;
        btn.addEventListener('pointerdown', () => {
          if (fed >= target || btn.classList.contains('eaten')) return;
          btn.classList.add('eaten');
          fed += 1;
          mascotEl.classList.remove('giggle'); void mascotEl.offsetWidth; mascotEl.classList.add('giggle');
          if (fed >= target) api.solved();
          else api.progress();
        });
        row.appendChild(btn);
      }
    },
    hintTarget() { return board && board.querySelector('.treat:not(.eaten)'); },
  };
}
