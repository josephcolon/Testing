/* ==========================================================================
   oddoneout.js — "Which one is different?"
   All cards are identical except one (different color, or different shape).
   ========================================================================== */

import { COLORS, SHAPES, EASY_SHAPES, shapeSVG } from '../themes.js';
import { sample, shuffle, randInt } from '../game/round.js';
import { makeSingle } from '../game/single.js';
import { line } from '../content/lines.js';

export const id = 'oddoneout';

export function create(theme, count) {
  const n = Math.max(3, count); // need at least 3 to read as "the odd one"
  const byColor = Math.random() < 0.5;
  const items = byColor ? colorOdd(theme, n) : shapeOdd(theme, n, count);
  return makeSingle(
    { text: line('different'), speechTokens: ['different'], icon: '🔎' },
    items
  );
}

function colorOdd(theme, n) {
  const [common, odd] = sample(COLORS, 2);
  const arr = Array.from({ length: n }, (_, i) => ({
    html: theme.hero(i === 0 ? odd.hex : common.hex),
    correct: i === 0,
  }));
  return shuffle(arr);
}

function shapeOdd(theme, n, count) {
  const pool = count <= 3 ? EASY_SHAPES : SHAPES;
  const [common, odd] = sample(pool, 2);
  const fill = '#6c7be0';
  const arr = Array.from({ length: n }, (_, i) => ({
    html: shapeSVG(i === 0 ? odd : common, fill),
    correct: i === 0,
  }));
  return shuffle(arr);
}
