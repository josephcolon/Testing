/* ==========================================================================
   single.js — helper for the many mini-games that are "tap the one right card".
   Used by Find It, Count the Group, Odd One Out, Sizes, and Pattern.
   ========================================================================== */

import { layoutGrid, choiceButton } from './round.js';

/**
 * @param {{text,speechTokens,icon}} prompt
 * @param {Array<{html, correct, style?}>} items  one item has correct:true
 * @returns mini-game { prompt, mount, hintTarget }
 */
export function makeSingle(prompt, items) {
  let board;
  return {
    prompt,
    mount(b, api) {
      board = b;
      layoutGrid(b, items.length);
      b.innerHTML = '';
      items.forEach((it) => {
        const btn = choiceButton(it.html, (el) => (it.correct ? api.solved(el) : api.wrong(el)), {
          target: it.correct,
        });
        if (it.style) btn.style.cssText += it.style;
        b.appendChild(btn);
      });
    },
    hintTarget() { return board && board.querySelector('[data-target]'); },
  };
}
