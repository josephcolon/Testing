/* numberfind.js — "Find the number 5!" (NUMERACY: numeral recognition) */
import { distinctInts, shuffle, randInt } from '../game/round.js';
import { makeSingle } from '../game/single.js';

export const id = 'numberfind';

export function create(theme, count) {
  const max = Math.min(10, count + 4);
  const picks = distinctInts(1, max, Math.max(2, count));
  const target = picks[randInt(0, picks.length - 1)];
  const items = shuffle(picks.map((n) => ({ html: `<span class="glyph-letter">${n}</span>`, correct: n === target })));
  return makeSingle(
    { text: `Find the number ${target}!`, speechTokens: ['find_number', `n_${target}`], icon: `<span class="prompt-num">${target}</span>` },
    items
  );
}
