/* ==========================================================================
   shadowmatch.js — "Which one fits the shadow?" (LEARNING: visual matching)
   A dark silhouette is shown; tap the (differently-colored) shape with the same
   outline. Matching by form alone — a different skill from naming the shape.
   ========================================================================== */

import { SHAPES, EASY_SHAPES, COLORS, shapeSVG } from '../themes.js';
import { sample, shuffle, randInt } from '../game/round.js';
import { makeSingle } from '../game/single.js';

export const id = 'shadowmatch';

export function create(theme, count) {
  const pool = count <= 3 ? EASY_SHAPES : SHAPES;
  const picks = sample(pool, Math.max(2, count));
  const target = picks[randInt(0, picks.length - 1)];
  const colors = sample(COLORS, picks.length); // each shape a different color
  const items = shuffle(
    picks.map((s, i) => ({ html: shapeSVG(s, colors[i % colors.length].hex), correct: s === target }))
  );
  return makeSingle(
    {
      text: 'Which one fits the shadow?',
      speechTokens: ['shadow'],
      icon: `<span class="prompt-shape">${shapeSVG(target, '#2b2d5c')}</span>`,
    },
    items
  );
}
