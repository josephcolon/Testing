/* ==========================================================================
   findit.js — "Find the red one!" / "Find the star!"
   The original color/shape recognition game. Content is gated by board size so
   the youngest get primary colors and the four basic shapes only.
   ========================================================================== */

import { COLORS, SHAPES, EASY_COLOR_IDS, EASY_SHAPES, shapeSVG } from '../themes.js';
import { sample, shuffle, randInt } from '../game/round.js';
import { makeSingle } from '../game/single.js';

export const id = 'findit';

export function create(theme, count) {
  const shapePool = count <= 3 ? EASY_SHAPES : SHAPES;
  const canShapes = count <= shapePool.length;
  const doColors = !canShapes || Math.random() < (count <= 2 ? 0.65 : 0.5);
  return doColors ? colors(theme, count) : shapes(theme, count, shapePool);
}

function colors(theme, count) {
  const pool = count <= 3 ? COLORS.filter((c) => EASY_COLOR_IDS.includes(c.id)) : COLORS;
  const picks = sample(pool, count);
  const target = picks[randInt(0, picks.length - 1)];
  const items = shuffle(picks.map((c) => ({ html: theme.hero(c.hex), correct: c.id === target.id })));
  return makeSingle(
    {
      text: `Find the ${target.name} one!`,
      speechTokens: ['find_the', `c_${target.id}`, theme.nounSingular],
      icon: `<span class="swatch" style="background:${target.hex}"></span>`,
    },
    items
  );
}

function shapes(theme, count, pool) {
  const picks = sample(pool, count);
  const target = picks[randInt(0, picks.length - 1)];
  const fill = '#6c7be0';
  const items = shuffle(picks.map((s) => ({ html: shapeSVG(s, fill), correct: s === target })));
  return makeSingle(
    {
      text: `Find the ${target}!`,
      speechTokens: ['find_the', `s_${target}`],
      icon: `<span class="prompt-shape">${shapeSVG(target, '#ffffff')}</span>`,
    },
    items
  );
}
