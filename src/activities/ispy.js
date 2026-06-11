/* ==========================================================================
   ispy.js — "Can you find the red one?" (LEARNING: visual search / attention)
   A crowded field of heroes in many colors with a single target color. Like
   Find It but busier — trains focused visual scanning among distractors.
   ========================================================================== */

import { COLORS } from '../themes.js';
import { sample, shuffle, layoutGrid, choiceButton } from '../game/round.js';

export const id = 'ispy';
export const minDifficulty = 2;

export function create(theme, count) {
  const n = Math.min(12, count + 5);
  const target = sample(COLORS, 1)[0];
  const others = COLORS.filter((c) => c.id !== target.id);
  const cards = [{ hex: target.hex, correct: true }];
  for (let i = 0; i < n - 1; i++) cards.push({ hex: others[i % others.length].hex, correct: false });
  const shuffled = shuffle(cards);
  let board;
  return {
    prompt: {
      text: `Can you find the ${target.name} one?`,
      speechTokens: ['find_the', `c_${target.id}`, theme.nounSingular],
      icon: `<span class="swatch" style="background:${target.hex}"></span>`,
    },
    mount(b, api) {
      board = b;
      layoutGrid(b, n);
      b.innerHTML = '';
      shuffled.forEach((card) => {
        const btn = choiceButton(theme.hero(card.hex), (el) => (card.correct ? api.solved(el) : api.wrong(el)), {
          target: card.correct,
        });
        b.appendChild(btn);
      });
    },
    hintTarget() { return board && board.querySelector('[data-target]'); },
  };
}
