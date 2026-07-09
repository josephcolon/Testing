/* ==========================================================================
   stickers.js — the sticker book. One section per child showing every sticker
   they've ever earned. Tapping a sticker makes it pop with a sparkle — a tiny
   toy moment kids love, and a reason to come back and fill the book.
   ========================================================================== */

import { getProfiles } from '../state.js';
import { THEMES } from '../themes.js';
import { speak, themeSounds } from '../audio.js';
import { line } from '../content/lines.js';

export function renderStickers({ root, show }) {
  const profiles = getProfiles();
  root.innerHTML = `
    <div class="screen" style="justify-content:flex-start;overflow:auto;padding-top:calc(var(--gap)*2)">
      <button class="iconbtn back-btn" id="back">⬅️</button>
      <h1 class="title" style="font-size:clamp(1.6rem,6vmin,3rem)">📖 Sticker Book</h1>
      <div class="book-list">
        ${profiles.map(rowHTML).join('')}
      </div>
    </div>
  `;

  root.querySelector('#back').addEventListener('pointerdown', () => show('home'));

  root.querySelectorAll('.sticker').forEach((el) => {
    el.addEventListener('pointerdown', () => {
      const sounds = themeSounds(el.dataset.theme);
      sounds.tap();
      el.classList.remove('pop');
      void el.offsetWidth; // restart the animation
      el.classList.add('pop');
    });
  });

  speak(line('ui_stickers'));
}

function rowHTML(p) {
  const theme = THEMES[p.theme] || THEMES.trucks;
  const stickers = p.stickers || [];
  const grid = stickers.length
    ? stickers
        .map((s) => `<button class="sticker" data-theme="${theme.id}">${s}</button>`)
        .join('')
    : `<div class="empty-hint">${theme.emoji} Play to earn stickers!</div>`;
  return `
    <div class="book-row">
      <div class="head">
        <div class="avatar">${theme.hero(theme.primary)}</div>
        <div class="name">${escapeHtml(p.name)} — ${stickers.length}</div>
      </div>
      <div class="sticker-grid">${grid}</div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
