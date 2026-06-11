/* ==========================================================================
   tickle.js — "Tickle them N times!" (FUN + one-to-one counting)
   One big giggling mascot; tap it exactly N times, counting each tap aloud-ish
   with a wiggle. Cause-and-effect delight wrapped around true 1:1 counting.
   ========================================================================== */

import { mascotSVG } from '../mascots.js';

export const id = 'tickle';

export function create(theme, count) {
  const target = Math.max(2, Math.min(5, count));
  let taps = 0, btn;
  return {
    prompt: {
      text: `Tickle ${target} times!`,
      speechTokens: ['tickle', `n_${target}`, 'times'],
      icon: '🤚',
    },
    mount(b, api) {
      b.style.display = 'flex';
      b.style.alignItems = 'center';
      b.style.justifyContent = 'center';
      b.innerHTML = '';
      btn = document.createElement('button');
      btn.className = 'choice tickle-target';
      btn.dataset.target = '1';
      btn.innerHTML = mascotSVG(theme.id, 'happy');
      btn.addEventListener('pointerdown', () => {
        taps += 1;
        btn.classList.remove('giggle');
        void btn.offsetWidth;
        btn.classList.add('giggle');
        if (taps >= target) api.solved();
        else api.progress();
      });
      b.appendChild(btn);
    },
    hintTarget() { return btn; },
  };
}
