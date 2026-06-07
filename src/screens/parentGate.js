/* ==========================================================================
   parentGate.js — a simple math gate so little ones can't change settings.
   Answer a small addition problem to continue. (Answers are never spoken.)
   ========================================================================== */

import { shuffle, randInt } from '../game/round.js';

export function renderGate({ root, show, params }) {
  const a = randInt(5, 9);
  const b = randInt(4, 9);
  const answer = a + b;
  const options = shuffle([answer, answer + 1, answer - 2, answer + 3]);

  root.innerHTML = `
    <div class="screen">
      <button class="iconbtn back-btn" id="back">⬅️</button>
      <div class="gate-card">
        <h2>For grown-ups 🔒</h2>
        <div class="gate-question">${a} + ${b} = ?</div>
        <div class="gate-options">
          ${options.map((o) => `<button class="btn" data-v="${o}">${o}</button>`).join('')}
        </div>
      </div>
    </div>
  `;

  root.querySelectorAll('.gate-options .btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (Number(btn.dataset.v) === answer) {
        show(params.then || 'settings');
      } else {
        btn.classList.add('wrong');
        setTimeout(() => btn.classList.remove('wrong'), 400);
      }
    });
  });

  root.querySelector('#back').addEventListener('click', () => show('home'));
}
