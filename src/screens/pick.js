/* ==========================================================================
   pick.js — choose which child profile(s) will play.

   Solo needs 1 profile (tap to start). Two-player modes need 2 (tap two, in
   turn order, then it starts). Avatars carry identity for pre-readers.
   ========================================================================== */

import { getProfiles } from '../state.js';
import { THEMES } from '../themes.js';
import { speak } from '../audio.js';

export function renderPick({ root, show, params }) {
  const { mode } = params;
  const need = mode.need;
  const profiles = getProfiles();
  const chosen = []; // ordered list of profile ids

  root.innerHTML = `
    <div class="screen">
      <button class="iconbtn back-btn" id="back">⬅️</button>
      <h1 class="title">${need === 1 ? 'Who is playing?' : 'Pick 2 players'}</h1>
      <div class="profiles"></div>
    </div>
  `;
  const list = root.querySelector('.profiles');

  function draw() {
    list.innerHTML = profiles
      .map((p) => {
        const theme = THEMES[p.theme];
        const order = chosen.indexOf(p.id);
        const badge = order >= 0 ? `<div class="name">#${order + 1}</div>` : `<div class="name">${p.name}</div>`;
        return `
          <div class="profile ${order >= 0 ? 'selected' : ''}" data-id="${p.id}">
            <div class="avatar">${theme.hero(theme.primary)}</div>
            ${badge}
          </div>`;
      })
      .join('');
    list.querySelectorAll('.profile').forEach((el) => {
      // pointerdown: a toddler's slipping tap still registers.
      el.addEventListener('pointerdown', () => pick(el.dataset.id));
    });
  }

  function pick(id) {
    if (need === 1) {
      start([id]);
      return;
    }
    if (chosen.includes(id)) return; // already picked
    chosen.push(id);
    draw();
    if (chosen.length === need) {
      setTimeout(() => start(chosen.slice()), 250);
    }
  }

  function start(ids) {
    const players = ids.map((id) => profiles.find((p) => p.id === id));
    show('game', { mode, players });
  }

  root.querySelector('#back').addEventListener('click', () => show('home'));
  draw();
  speak(need === 1 ? 'Who is playing?' : 'Pick two players!');
}
