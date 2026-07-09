/* ==========================================================================
   howmany.js — "How many?" (LEARNING: subitizing)
   Show a small set (2–5) of heroes; tap the number that matches. Numbers are
   shown as numeral + dots so a pre-reader can answer by the dots. Builds the
   "see the quantity instantly" skill that underpins early math.
   ========================================================================== */

import { distinctInts, randInt } from '../game/round.js';
import { makeSingle } from '../game/single.js';
import { line } from '../content/lines.js';

export const id = 'howmany';

export function create(theme, count) {
  const k = randInt(2, Math.min(5, count + 1)); // the true count (subitizing range)
  const choices = distinctInts(1, Math.min(7, k + 2), Math.max(2, count));
  if (!choices.includes(k)) choices[0] = k;

  const group = `<div class="hm-group">${Array.from({ length: k }, () => theme.hero(theme.primary)).join('')}</div>`;
  const items = choices
    .sort(() => Math.random() - 0.5)
    .map((n) => ({
      html: `<div class="numcard"><span class="num">${n}</span><span class="dots">${'●'.repeat(n)}</span></div>`,
      correct: n === k,
    }));

  // Reuse the single-correct helper, but show the set above the choices.
  const single = makeSingle({ text: line('how_many'), speechTokens: ['how_many'], icon: '🔢' }, items);
  const baseMount = single.mount;
  single.mount = (b, api) => {
    b.style.display = 'flex';
    b.style.flexDirection = 'column';
    const top = document.createElement('div');
    top.innerHTML = group;
    top.className = 'hm-top';
    const bottom = document.createElement('div');
    bottom.className = 'hm-choices choices';
    b.innerHTML = '';
    b.appendChild(top);
    b.appendChild(bottom);
    baseMount(bottom, api); // renders the number cards into the bottom grid
  };
  return single; // single.hintTarget already points at the bottom grid's target
}
