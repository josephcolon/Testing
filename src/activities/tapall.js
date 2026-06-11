/* ==========================================================================
   tapall.js — "Tap all the red ones!" / "Tap all the stars!"
   Several targets hide among distractors; tap each target. Every target is a
   progress step; finding them all solves the round. Builds one-to-many scanning.
   ========================================================================== */

import { COLORS, SHAPES, EASY_SHAPES, shapeSVG } from '../themes.js';
import { sample, shuffle, randInt, layoutGrid, choiceButton } from '../game/round.js';

export const id = 'tapall';

export function create(theme, count) {
  const n = Math.min(8, count + 2);
  const k = Math.max(2, Math.min(n - 1, randInt(2, Math.floor(n / 2) + 1)));
  const byColor = Math.random() < 0.5;
  const { cards, prompt } = byColor ? colorSet(theme, n, k) : shapeSet(theme, n, k, count);

  let board, found = 0;
  return {
    prompt,
    mount(b, api) {
      board = b;
      layoutGrid(b, n);
      b.innerHTML = '';
      shuffle(cards).forEach((card) => {
        const btn = choiceButton(card.html, (el) => {
          if (card.target) {
            if (el.classList.contains('found')) return;
            el.classList.add('found');
            found += 1;
            if (found >= k) api.solved();
            else api.progress();
          } else {
            api.wrong(el);
          }
        }, { target: card.target });
        b.appendChild(btn);
      });
    },
    hintTarget() { return board && board.querySelector('[data-target]:not(.found)'); },
  };
}

function colorSet(theme, n, k) {
  const target = sample(COLORS, 1)[0];
  const others = COLORS.filter((c) => c.id !== target.id);
  const cards = [];
  for (let i = 0; i < k; i++) cards.push({ html: theme.hero(target.hex), target: true });
  for (let i = 0; i < n - k; i++) cards.push({ html: theme.hero(others[i % others.length].hex), target: false });
  return {
    cards,
    prompt: {
      text: `Tap all the ${target.name} ones!`,
      speechTokens: ['tap_all', `c_${target.id}`, theme.nounPlural],
      icon: `<span class="swatch" style="background:${target.hex}"></span>`,
    },
  };
}

function shapeSet(theme, n, k, count) {
  const pool = count <= 3 ? EASY_SHAPES : SHAPES;
  const [target, ...rest] = sample(pool, pool.length);
  const fill = '#6c7be0';
  const cards = [];
  for (let i = 0; i < k; i++) cards.push({ html: shapeSVG(target, fill), target: true });
  for (let i = 0; i < n - k; i++) cards.push({ html: shapeSVG(rest[i % rest.length], fill), target: false });
  return {
    cards,
    prompt: {
      text: `Tap all the ${target}s!`,
      speechTokens: ['tap_all', `s_${target}`],
      icon: `<span class="prompt-shape">${shapeSVG(target, '#ffffff')}</span>`,
    },
  };
}
