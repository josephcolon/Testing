/* ==========================================================================
   prizes.js — the Prize Machine: earn coins by playing, spend them to open
   surprise prizes and fill a collection. The meta goal that makes rounds add up
   (ABCmouse "tickets", Toca-style reward). One coin per correct answer; bonus
   coins for finishing a world-map stop.
   ========================================================================== */

import { getProfiles, getProfile, getCoins, spendCoins, addCoins, addPrize } from '../state.js';
import { THEMES } from '../themes.js';
import { burst } from '../ui/confetti.js';
import { themeSounds, speak } from '../audio.js';

const COST = 5;
export const PRIZES = [
  '🐶','🐱','🐰','🦊','🐻','🐼','🐨','🦁','🐯','🦄','🐸','🐵','🐔','🐧','🦉','🦋',
  '🐙','🐬','🐳','🐝','🐞','🦕','🚗','🚓','🚒','🚜','🚂','✈️','🚀','🚁','⛵','🚲',
  '🍎','🍓','🍩','🍪','🧁','🍦','🎈','🎁','⭐','🌈','🌟','🧸','🎨','🪀','👑','💎',
];

export function renderPrizes({ root, show, params }) {
  const profiles = getProfiles();
  let selId = params.profileId || profiles[0].id;

  function draw() {
    const p = getProfile(selId) || profiles[0];
    selId = p.id;
    const theme = THEMES[p.theme] || THEMES.trucks;
    const coins = getCoins(p);
    const owned = p.prizes || {};
    const ownedCount = Object.keys(owned).filter((k) => owned[k] > 0).length;

    root.innerHTML = `
      <div class="screen" style="justify-content:flex-start;overflow:auto;padding-top:calc(var(--gap)*2)">
        <button class="iconbtn back-btn" id="back">⬅️</button>
        <h1 class="title" style="font-size:clamp(1.5rem,5.5vmin,2.8rem)">🎁 Prize Machine</h1>
        <div class="kid-chips">
          ${profiles.map((k) => `<button class="kid-chip ${k.id === selId ? 'on' : ''}" data-id="${k.id}">${THEMES[k.theme].emoji} ${escapeHtml(k.name)}</button>`).join('')}
        </div>
        <div class="machine">
          <div class="coin-balance">🪙 <b>${coins}</b></div>
          <div class="machine-body">🎰</div>
          <button class="btn accent big open-prize" ${coins < COST ? 'disabled' : ''}>Open a Prize! (${COST} 🪙)</button>
          <div class="machine-hint">${coins < COST ? `Play games to earn ${COST - coins} more coin${COST - coins === 1 ? '' : 's'}!` : ''}</div>
        </div>
        <h2 class="subtitle" style="color:var(--ink)">Collection — ${ownedCount}/${PRIZES.length}</h2>
        <div class="prize-grid">
          ${PRIZES.map((e) => {
            const n = owned[e] || 0;
            return `<div class="prize-cell ${n ? 'have' : 'locked'}">${n ? e : '❓'}${n > 1 ? `<span class="cnt">${n}</span>` : ''}</div>`;
          }).join('')}
        </div>
      </div>
    `;

    root.querySelector('#back').addEventListener('pointerdown', () => show('home'));
    root.querySelectorAll('.kid-chip').forEach((c) => c.addEventListener('pointerdown', () => { selId = c.dataset.id; draw(); }));
    const openBtn = root.querySelector('.open-prize');
    if (openBtn) openBtn.addEventListener('pointerdown', () => openPrize(p, theme));
  }

  function openPrize(p, theme) {
    if (!spendCoins(p.id, COST)) return;
    const key = PRIZES[Math.floor(Math.random() * PRIZES.length)];
    const isNew = !(p.prizes && p.prizes[key]);
    addPrize(p.id, key);
    themeSounds(theme.id).win();
    burst({ x: 0.5, y: 0.4, count: 160 });
    speak(isNew ? 'A new prize!' : 'You got a prize!');

    const overlay = document.createElement('div');
    overlay.className = 'reward';
    overlay.innerHTML = `<div class="big-sticker">${key}</div><div class="cheer">${isNew ? 'New prize!' : 'Nice!'}</div>`;
    root.appendChild(overlay);
    setTimeout(() => { overlay.remove(); draw(); }, 1800);
  }

  draw();
  speak('Open a prize!');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
