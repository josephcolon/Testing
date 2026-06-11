/* ==========================================================================
   sizes.js — "Tap the biggest one!" / "Tap the smallest one!"
   Same hero at several sizes; tap the extreme. Teaches size comparison.
   ========================================================================== */

import { COLORS } from '../themes.js';
import { shuffle, sample, randInt } from '../game/round.js';
import { makeSingle } from '../game/single.js';

export const id = 'sizes';

export function create(theme, count) {
  const n = Math.max(3, Math.min(5, count + 1));
  const biggest = Math.random() < 0.5;
  const color = sample(COLORS, 1)[0].hex;
  // Distinct sizes from small to large (as % of the card).
  const sizes = [];
  for (let i = 0; i < n; i++) sizes.push(40 + i * (55 / (n - 1)));
  const targetSize = biggest ? sizes[n - 1] : sizes[0];
  const items = shuffle(
    sizes.map((s) => ({
      html: `<div class="sizer" style="width:${s}%">${theme.hero(color)}</div>`,
      correct: s === targetSize,
    }))
  );
  return makeSingle(
    {
      text: biggest ? 'Tap the biggest one!' : 'Tap the smallest one!',
      speechTokens: [biggest ? 'biggest' : 'smallest'],
      icon: biggest ? '⬆️' : '⬇️',
    },
    items
  );
}
