/* ==========================================================================
   main.js — app boot + a tiny screen router.

   Screens render into #app. Navigation is a single show(name, params) call.
   Audio is unlocked on the first user gesture (required by mobile browsers).
   ========================================================================== */

import { unlockAudio } from './audio.js';
import { renderHome } from './screens/home.js';
import { renderPick } from './screens/pick.js';
import { renderGate } from './screens/parentGate.js';
import { renderSettings } from './screens/settings.js';
import { renderGame } from './screens/game.js';

const root = document.getElementById('app');

const screens = {
  home: renderHome,
  pick: renderPick,
  gate: renderGate,
  settings: renderSettings,
  game: renderGame,
};

export const app = {
  show(name, params = {}) {
    root.className = ''; // reset any mode-specific classes (e.g. split-mode)
    root.innerHTML = '';
    document.body.style.background = '';
    const screen = screens[name];
    if (screen) screen({ root, show: app.show, params });
  },
};

// Unlock audio/speech on the very first interaction.
const unlockOnce = () => {
  unlockAudio();
  window.removeEventListener('pointerdown', unlockOnce);
};
window.addEventListener('pointerdown', unlockOnce);

app.show('home');
