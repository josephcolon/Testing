/* ==========================================================================
   sorting.js — "Put each one in the matching basket!" (LEARNING: classification)
   One hero appears at a time in a color; tap the basket of the same color.
   Sort them all to win. Classification by a single attribute (color) — a core
   preschool skill. A wrong basket is a gentle "try again" (baskets stay usable).
   ========================================================================== */

import { COLORS } from '../themes.js';
import { sample, shuffle, randInt } from '../game/round.js';

export const id = 'sorting';
export const minDifficulty = 2;

export function create(theme, count) {
  const nBaskets = count <= 3 ? 2 : 3;
  const palette = sample(COLORS, nBaskets);
  const nItems = Math.max(3, Math.min(6, count + 1));
  const queue = Array.from({ length: nItems }, () => palette[randInt(0, palette.length - 1)]);

  let board, idx = 0, itemEl;
  return {
    prompt: { text: 'Put each one in the matching basket!', speechTokens: ['sorting'], icon: '🧺' },
    mount(b, api) {
      board = b;
      idx = 0;
      b.style.display = 'flex';
      b.style.flexDirection = 'column';
      b.innerHTML = `
        <div class="sort-item"></div>
        <div class="sort-baskets"></div>
      `;
      itemEl = b.querySelector('.sort-item');
      const basketRow = b.querySelector('.sort-baskets');
      shuffle(palette).forEach((c) => {
        const basket = document.createElement('button');
        basket.className = 'choice basket';
        basket.dataset.color = c.id;
        basket.style.setProperty('--bk', c.hex);
        basket.innerHTML = `<div class="basket-svg" style="color:${c.hex}">🧺</div>`;
        basket.addEventListener('pointerdown', () => onDrop(c, basket, api));
        basketRow.appendChild(basket);
      });
      showItem();
    },
    hintTarget() {
      return board && queue[idx] && board.querySelector(`.basket[data-color="${queue[idx].id}"]`);
    },
  };

  function showItem() {
    const c = queue[idx];
    itemEl.dataset.color = c.id;
    itemEl.innerHTML = theme.hero(c.hex);
  }

  function onDrop(color, basket, api) {
    if (idx >= queue.length) return;
    if (color.id === queue[idx].id) {
      idx += 1;
      basket.classList.remove('thump'); void basket.offsetWidth; basket.classList.add('thump');
      if (idx >= queue.length) { api.solved(); }
      else { api.progress(); showItem(); }
    } else {
      api.wrong(basket, { dim: false });
    }
  }
}
