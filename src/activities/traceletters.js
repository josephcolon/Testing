/* traceletters.js — "Trace the A!" (LITERACY: letter formation / fine motor) */
import { GLYPHS } from '../game/glyphs.js';
import { LETTERS, letterToken } from '../game/letters.js';
import { makeTrace } from '../game/tracing.js';
import { sample } from '../game/round.js';

export const id = 'traceletters';

export function create(theme, count) {
  const L = sample(LETTERS, 1)[0];
  return makeTrace(GLYPHS[L], {
    text: `Trace the ${L}!`,
    speechTokens: ['trace', letterToken(L)],
    icon: `<span class="glyph-mini">${L}</span>`,
  });
}
