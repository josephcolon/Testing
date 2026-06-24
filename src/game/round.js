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

/* ---- Shared board helpers (used by every mini-game) ---- */

/** Lay out a board as centered, squarish cards (not full-height columns). */
export function layoutGrid(board, n) {
  const cols = n === 4 ? 2 : n <= 3 ? n : n <= 6 ? 3 : 4;
  const rows = Math.ceil(n / cols);
  board.classList.add('grid-cards');
  board.style.display = 'grid';
  board.style.placeContent = 'center';
  board.style.gap = 'var(--gap)';
  board.style.gridTemplateColumns = `repeat(${cols}, minmax(0, var(--card)))`;
  board.style.gridAutoRows = 'min-content';
  board.style.setProperty('--cols', cols);
  board.style.setProperty('--rows', rows);
}

/** Make a standard tappable choice card. Fires on pointerdown (toddler-safe). */
export function choiceButton(html, onTap, { target = false, extraClass = '' } = {}) {
  const b = document.createElement('button');
  b.className = 'choice' + (extraClass ? ' ' + extraClass : '');
  b.innerHTML = html;
  if (target) b.dataset.target = '1'; // marks the "right" card(s) for hints + tests
  b.addEventListener('pointerdown', () => onTap(b));
  return b;
}

