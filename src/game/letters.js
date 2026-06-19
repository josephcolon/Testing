/* ==========================================================================
   letters.js — alphabet + phonics data for the ABCmouse-style literacy games.
   ========================================================================== */

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const letterToken = (L) => `l_${L.toLowerCase()}`;

// A clear first-sound picture for each letter (used by the phonics game).
export const PHONICS = {
  A: '🍎', B: '⚽', C: '🐱', D: '🐶', E: '🥚', F: '🐟', G: '🍇', H: '🎩',
  I: '🧊', J: '🧃', K: '🪁', L: '🦁', M: '🌙', N: '🪺', O: '🍊', P: '🐷',
  Q: '👑', R: '🌈', S: '☀️', T: '🌳', U: '☂️', V: '🎻', W: '🐳', X: '🎵',
  Y: '🧶', Z: '🦓',
};
// Letters with a clean, recognizable picture — used when we need an emoji.
export const PHONICS_LETTERS = Object.keys(PHONICS).filter((L) => !['X'].includes(L));
