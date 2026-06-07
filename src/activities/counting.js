/* ==========================================================================
   counting.js — generates "Tap N trucks/unicorns" rounds.

   Each choice card shows a group containing a different number of theme heroes;
   the child counts and taps the group that matches the spoken/shown number.
   Numbers stay small for little ones and grow gently with difficulty.
   ========================================================================== */

import { NUMBER_WORDS, distinctInts, shuffle } from '../game/round.js';

export function makeCountingRound(theme, choiceCount) {
  // Counts grow with the board size but stay child-friendly.
  const maxCount = Math.min(10, choiceCount + 2);
  const counts = distinctInts(1, maxCount, choiceCount);
  const target = counts[Math.floor(Math.random() * counts.length)];

  const choices = shuffle(
    counts.map((n) => ({
      html: group(theme, n),
      correct: n === target,
    }))
  );

  return {
    kind: 'counting',
    promptText: `Tap ${target} ${target === 1 ? theme.nounSingular : theme.nounPlural}!`,
    promptSpeech: `Tap ${NUMBER_WORDS[target]} ${target === 1 ? theme.nounSingular : theme.nounPlural}!`,
    swatch: null,
    choices,
  };
}

// Lay out `n` hero sprites in a tidy grid inside a card.
function group(theme, n) {
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : 3;
  const color = '#3d8bff';
  const sprites = Array.from({ length: n }, () => theme.hero(color)).join('');
  return `<div class="count-group" style="grid-template-columns:repeat(${cols},1fr)">${sprites}</div>`;
}
