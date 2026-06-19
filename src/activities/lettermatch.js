/* lettermatch.js — "Find the little b!" (LITERACY: upper/lowercase matching) */
import { LETTERS, letterToken } from '../game/letters.js';
import { sample, shuffle, randInt } from '../game/round.js';
import { makeSingle } from '../game/single.js';

export const id = 'lettermatch';

export function create(theme, count) {
  const picks = sample(LETTERS, Math.max(2, count));
  const target = picks[randInt(0, picks.length - 1)];
  const items = shuffle(picks.map((L) => ({
    html: `<span class="glyph-letter lower">${L.toLowerCase()}</span>`, correct: L === target,
  })));
  return makeSingle(
    {
      text: `Find the little ${target.toLowerCase()}!`,
      speechTokens: ['find_letter', letterToken(target)],
      icon: `<span class="glyph-mini">${target}</span>`,
    },
    items
  );
}
