/* ==========================================================================
   home.js — title + mode select, greeted by the two mascots.

   Mascots wave hello, an illustrated scene sits behind, and three big mode
   cards (icons carry meaning for pre-readers) sit below. A sticker book the
   kids open themselves and a parent gear round it out. Kid-facing targets use
   pointerdown so a toddler's slipping tap still registers.
   ========================================================================== */

import { speak } from '../audio.js';
import { mascotSVG, mascotName } from '../mascots.js';
import { sceneHTML } from '../ui/scene.js';

const MODES = [
  { id: 'journey', glyph: '🗺️', label: 'Adventure Map', mode: { kind: 'journey', need: 1 } },
  { id: 'solo',  glyph: '🚚',     label: '1 Player',      mode: { kind: 'solo', need: 1 } },
  { id: 'turns', glyph: '🚚🦄',   label: '2 Players · Take Turns', mode: { kind: 'turns', need: 2 } },
  { id: 'split', glyph: '🚚 ⏐ 🦄', label: '2 Players · Side by Side', mode: { kind: 'split', need: 2 } },
];

export function renderHome({ root, show }) {
  root.innerHTML = `
    <div class="scene-holder home-scene">${sceneHTML('unicorns')}</div>
    <div class="screen">
      <button class="iconbtn" id="book" title="Sticker book"
        style="position:absolute;top:var(--gap);left:var(--gap)">📖</button>
      <button class="iconbtn" id="prizes" title="Prize Machine"
        style="position:absolute;top:var(--gap);left:calc(var(--gap)*2 + clamp(44px,8vmin,64px))">🎁</button>
      <button class="iconbtn" id="gear" title="Grown-ups"
        style="position:absolute;top:var(--gap);right:var(--gap)">⚙️</button>
      <div class="greeters">
        <div class="mascot anim-wave" data-theme="trucks">${mascotSVG('trucks', 'wave')}</div>
        <div class="mascot anim-wave delay" data-theme="unicorns">${mascotSVG('unicorns', 'wave')}</div>
      </div>
      <h1 class="title home-title">Trucks &amp; Unicorns</h1>
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
    card.addEventListener('pointerdown', () => {
      const def = MODES.find((m) => m.id === card.dataset.mode);
      show('pick', { mode: def.mode });
    });
  });

  // Tapping a mascot makes it say hi.
  root.querySelectorAll('.greeters .mascot').forEach((el) => {
    el.addEventListener('pointerdown', () => speak(`Hi! I'm ${mascotName(el.dataset.theme)}!`));
  });

  root.querySelector('#book').addEventListener('pointerdown', () => show('stickers'));
  root.querySelector('#prizes').addEventListener('pointerdown', () => show('prizes', {}));
  root.querySelector('#gear').addEventListener('click', () => show('gate', { then: 'settings' }));

  speak("Let's play!");
}
