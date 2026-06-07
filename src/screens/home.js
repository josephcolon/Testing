/* ==========================================================================
   home.js — title + mode select.

   Three big mode cards (icons carry the meaning for pre-readers) plus a small
   parent gear in the corner that leads to the parent-gated settings.
   ========================================================================== */

import { speak } from '../audio.js';

const MODES = [
  { id: 'solo',  glyph: '🚚',     label: '1 Player',      mode: { kind: 'solo', need: 1 } },
  { id: 'turns', glyph: '🚚🦄',   label: '2 Players · Take Turns', mode: { kind: 'turns', need: 2 } },
  { id: 'split', glyph: '🚚 ⏐ 🦄', label: '2 Players · Side by Side', mode: { kind: 'split', need: 2 } },
];

export function renderHome({ root, show }) {
  root.innerHTML = `
    <div class="screen">
      <button class="iconbtn" id="gear" title="Grown-ups"
        style="position:absolute;top:var(--gap);right:var(--gap)">⚙️</button>
      <h1 class="title">🚚 Trucks &amp; Unicorns 🦄</h1>
      <p class="subtitle">Pick how to play!</p>
      <div class="mode-grid">
        ${MODES.map(
          (m) => `
          <div class="mode-card" data-mode="${m.id}">
            <div class="glyph">${m.glyph}</div>
            <div class="label">${m.label}</div>
          </div>`
        ).join('')}
      </div>
    </div>
  `;

  root.querySelectorAll('.mode-card').forEach((card) => {
    card.addEventListener('click', () => {
      const def = MODES.find((m) => m.id === card.dataset.mode);
      show('pick', { mode: def.mode });
    });
  });

  root.querySelector('#gear').addEventListener('click', () => {
    // Parent gate guards the settings screen.
    show('gate', { then: 'settings' });
  });

  speak('Pick how to play!');
}
