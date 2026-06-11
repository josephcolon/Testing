/* ==========================================================================
   countgroup.js — "Tap three trucks!"
   Each card holds a group of N heroes; tap the group with the right count.
   ========================================================================== */

import { NUMBER_WORDS, distinctInts, shuffle, randInt } from '../game/round.js';
import { makeSingle } from '../game/single.js';

export const id = 'countgroup';

export function create(theme, count) {
  const maxCount = Math.min(10, count + 2);
  const counts = distinctInts(1, maxCount, count);
  const target = counts[randInt(0, counts.length - 1)];
  const noun = target === 1 ? theme.nounSingular : theme.nounPlural;
  const items = shuffle(counts.map((n) => ({ html: group(theme, n), correct: n === target })));
  return makeSingle(
    {
      text: `Tap ${target} ${noun}!`,
      speechTokens: ['tap', `n_${target}`, noun],
      icon: `<span class="prompt-num">${target}</span>`,
    },
    items
  );
}

function group(theme, n) {
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : 3;
  const sprites = Array.from({ length: n }, () => theme.hero(theme.primary)).join('');
  return `<div class="count-group" style="grid-template-columns:repeat(${cols},1fr)">${sprites}</div>`;
}
