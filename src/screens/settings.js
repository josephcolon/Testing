/* ==========================================================================
   settings.js — parent-only screen (reached through the gate).

   Per child: name, theme (trucks/unicorns), and difficulty 1..5 (which sets how
   many choices appear). Plus add/remove children and global sound/voice toggles.
   ========================================================================== */

import {
  getProfiles, updateProfile, addProfile, removeProfile,
  getSettings, updateSettings, DIFFICULTY_LEVELS,
} from '../state.js';
import { THEMES } from '../themes.js';

export function renderSettings({ root, show }) {
  function draw() {
    const profiles = getProfiles();
    const s = getSettings();
    root.innerHTML = `
      <div class="screen" style="justify-content:flex-start;overflow:auto;padding-top:calc(var(--gap)*2)">
        <button class="iconbtn back-btn" id="back">⬅️</button>
        <h1 class="title" style="font-size:clamp(1.6rem,6vmin,3rem)">Grown-up Settings</h1>
        <div class="settings-list">
          ${profiles.map(rowHTML).join('')}
          <button class="btn accent" id="add">➕ Add a child</button>
          <button class="btn" id="record">🎙️ Record the voice in your own voice</button>
          <div class="setting-row" style="justify-content:center">
            <button class="pill ${s.soundOn ? 'on' : ''}" id="sound">🔊 Sounds ${s.soundOn ? 'On' : 'Off'}</button>
            <button class="pill ${s.voiceOn ? 'on' : ''}" id="voice">🗣️ Voice ${s.voiceOn ? 'On' : 'Off'}</button>
          </div>
        </div>
      </div>
    `;
    wire();
  }

  function rowHTML(p) {
    const theme = THEMES[p.theme];
    return `
      <div class="setting-row" data-id="${p.id}">
        <div class="avatar">${theme.hero(theme.primary)}</div>
        <input type="text" class="pname" value="${escapeHtml(p.name)}" maxlength="12" />
        <div class="setting-field">
          <label>Theme</label>
          <div class="pillgroup theme">
            <button class="pill ${p.theme === 'trucks' ? 'on' : ''}" data-theme="trucks">🚚</button>
            <button class="pill ${p.theme === 'unicorns' ? 'on' : ''}" data-theme="unicorns">🦄</button>
          </div>
        </div>
        <div class="setting-field">
          <label>Difficulty</label>
          <div class="pillgroup diff">
            ${DIFFICULTY_LEVELS.map(
              (d) => `<button class="pill ${p.difficulty === d ? 'on' : ''}" data-diff="${d}">${d}</button>`
            ).join('')}
          </div>
        </div>
        <button class="iconbtn remove" title="Remove">🗑️</button>
      </div>
    `;
  }

  function wire() {
    root.querySelector('#back').addEventListener('click', () => show('home'));
    root.querySelector('#add').addEventListener('click', () => { addProfile(); draw(); });
    root.querySelector('#record').addEventListener('click', () => show('record'));

    const s = getSettings();
    root.querySelector('#sound').addEventListener('click', () => { updateSettings({ soundOn: !s.soundOn }); draw(); });
    root.querySelector('#voice').addEventListener('click', () => { updateSettings({ voiceOn: !s.voiceOn }); draw(); });

    root.querySelectorAll('.setting-row[data-id]').forEach((row) => {
      const id = row.dataset.id;
      // Name: save as they type, no rerender (keeps the keyboard focus).
      row.querySelector('.pname').addEventListener('input', (e) => {
        updateProfile(id, { name: e.target.value || 'Player' });
      });
      row.querySelectorAll('.theme .pill').forEach((b) =>
        b.addEventListener('click', () => { updateProfile(id, { theme: b.dataset.theme }); draw(); })
      );
      row.querySelectorAll('.diff .pill').forEach((b) =>
        b.addEventListener('click', () => { updateProfile(id, { difficulty: Number(b.dataset.diff) }); draw(); })
      );
      row.querySelector('.remove').addEventListener('click', () => { removeProfile(id); draw(); });
    });
  }

  draw();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
