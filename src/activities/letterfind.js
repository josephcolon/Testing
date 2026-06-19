/* letterfind.js — "Find the letter B!" (LITERACY: letter recognition) */
import { LETTERS, letterToken } from '../game/letters.js';
import { sample, shuffle, randInt } from '../game/round.js';
import { makeSingle } from '../game/single.js';

export const id = 'letterfind';

export function create(theme, count) {
  const picks = sample(LETTERS, Math.max(2, count));
  const target = picks[randInt(0, picks.length - 1)];
  const items = shuffle(picks.map((L) => ({ html: `<span class="glyph-letter">${L}</span>`, correct: L === target })));
  return makeSingle(
    { text: `Find the letter ${target}!`, speechTokens: ['find_letter', letterToken(target)], icon: `<span class="glyph-mini">${target}</span>` },
    items
  );
}
