/* tracenumbers.js — "Trace the 3!" (NUMERACY: numeral formation / fine motor) */
import { GLYPHS } from '../game/glyphs.js';
import { makeTrace } from '../game/tracing.js';
import { randInt } from '../game/round.js';

export const id = 'tracenumbers';

export function create(theme, count) {
  const N = randInt(1, 9);
  return makeTrace(GLYPHS[String(N)], {
    text: `Trace the ${N}!`,
    speechTokens: ['trace', `n_${N}`],
    icon: `<span class="prompt-num">${N}</span>`,
  });
}
