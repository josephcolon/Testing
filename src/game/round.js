/* ==========================================================================
   round.js — shared helpers for building a Round.

   A Round is the unit the engine renders:
     {
       kind:        'colors' | 'shapes' | 'counting',
       promptText:  string,        // shown on screen
       promptSpeech:string,        // spoken aloud
       swatch:      hex | null,    // optional color chip beside the prompt
       choices:     [{ html, correct }]
     }
   ========================================================================== */

export const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five',
  'six', 'seven', 'eight', 'nine', 'ten',
];

export const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick `n` distinct items from a list. */
export function sample(list, n) {
  return shuffle(list).slice(0, n);
}

/** Pick `n` distinct integers from an inclusive range. */
export function distinctInts(min, max, n) {
  const pool = [];
  for (let i = min; i <= max; i++) pool.push(i);
  return sample(pool, Math.min(n, pool.length));
}
