/* ==========================================================================
   whichmore.js — "Which has more?" (LEARNING: comparing quantity)
   Two (or three) groups; tap the one with the most. Counts differ clearly so
   the youngest can compare at a glance. Builds magnitude comparison.
   ========================================================================== */

import { distinctInts, shuffle, randInt } from '../game/round.js';
import { makeSingle } from '../game/single.js';
import { line } from '../content/lines.js';

export const id = 'whichmore';

export function create(theme, count) {
  const groups = count <= 3 ? 2 : 3;
  // Spread the counts out so "more" is visually obvious for little ones.
  let counts = distinctInts(1, 9, groups);
  counts = counts.sort((a, b) => a - b);
  // Ensure a clear gap between the two largest.
  if (counts[counts.length - 1] - counts[counts.length - 2] < 2) {
    counts[counts.length - 1] = Math.min(10, counts[counts.length - 2] + 2 + randInt(0, 2));
  }
  const max = Math.max(...counts);
  const items = shuffle(counts.map((n) => ({ html: group(theme, n), correct: n === max })));
  return makeSingle({ text: line('which_more'), speechTokens: ['which_more'], icon: '🤔' }, items);
}

function group(theme, n) {
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : 3;
  const sprites = Array.from({ length: n }, () => theme.hero(theme.primary)).join('');
  return `<div class="count-group" style="grid-template-columns:repeat(${cols},1fr)">${sprites}</div>`;
}
