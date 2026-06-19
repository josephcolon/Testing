/* startingsound.js — "Which starts with B?" (LITERACY: phonics / first sound) */
import { PHONICS, PHONICS_LETTERS, letterToken } from '../game/letters.js';
import { sample, shuffle, randInt } from '../game/round.js';
import { makeSingle } from '../game/single.js';

export const id = 'startingsound';
export const minDifficulty = 2;

export function create(theme, count) {
  const letters = sample(PHONICS_LETTERS, Math.max(2, Math.min(4, count)));
  const target = letters[randInt(0, letters.length - 1)];
  const items = shuffle(letters.map((L) => ({ html: `<span class="emoji-pic">${PHONICS[L]}</span>`, correct: L === target })));
  return makeSingle(
    { text: `Which starts with ${target}?`, speechTokens: ['starts_with', letterToken(target)], icon: `<span class="glyph-mini">${target}</span>` },
    items
  );
}
