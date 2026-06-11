/* ==========================================================================
   memory.js — "Find the matching pairs!"
   Classic flip-and-match memory. Tap two cards; matches stay, mismatches flip
   back. Match every pair to solve. Builds memory and concentration.
   ========================================================================== */

import { COLORS } from '../themes.js';
import { sample, shuffle, layoutGrid } from '../game/round.js';

export const id = 'memory';

export function create(theme, count) {
  const pairs = Math.max(2, Math.min(6, count));
  const colors = sample(COLORS, pairs);
  const cards = shuffle(
    colors.flatMap((c) => [
      { pairId: c.id, html: theme.hero(c.hex) },
      { pairId: c.id, html: theme.hero(c.hex) },
    ])
  );

  let first = null, busy = false, matched = 0;
  return {
    prompt: { text: 'Find the matching pairs!', speechTokens: ['match'], icon: '🧩' },
    mount(b, api) {
      layoutGrid(b, cards.length);
      b.innerHTML = '';
      cards.forEach((card) => {
        const btn = document.createElement('button');
        btn.className = 'choice mcard';
        btn.dataset.pair = card.pairId;
        btn.innerHTML =
          `<div class="mface back">${theme.emoji}</div>` +
          `<div class="mface front">${card.html}</div>`;
        btn.addEventListener('pointerdown', () => flip(btn, card, api));
        b.appendChild(btn);
      });
    },
  };

  function flip(btn, card, api) {
    if (busy || btn.classList.contains('up') || btn.classList.contains('matched')) return;
    btn.classList.add('up');
    if (!first) { first = { btn, card }; return; }
    if (first.btn === btn) return;

    if (first.card.pairId === card.pairId) {
      btn.classList.add('matched');
      first.btn.classList.add('matched');
      first = null;
      matched += 1;
      if (matched >= pairs) api.solved();
      else api.progress();
    } else {
      busy = true;
      const a = first.btn;
      first = null;
      api.wrong(btn, { dim: false });
      setTimeout(() => {
        a.classList.remove('up');
        btn.classList.remove('up');
        busy = false;
      }, 850);
    }
  }
}
