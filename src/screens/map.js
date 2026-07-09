/* ==========================================================================
   map.js — the world map: a themed journey of stops for one child.

   Stops zig-zag down a path. Completed stops show their best star count; the
   next stop pulses with the child's mascot standing on it; later stops are
   locked until the one before is cleared (gentle, no-fail unlocking). Tapping a
   playable stop starts that stop's short level.
   ========================================================================== */

import { getProfile, getJourney, JOURNEY_STOPS } from '../state.js';
import { STOPS, getStop } from '../game/journey.js';
import { THEMES } from '../themes.js';
import { mascotSVG, mascotName } from '../mascots.js';
import { sceneHTML } from '../ui/scene.js';
import { speak } from '../audio.js';
import { line } from '../content/lines.js';

const OFFSETS = [-24, 0, 24, 0]; // serpentine x-offset (vw) by stop index

export function renderMap({ root, show, params }) {
  const profile = getProfile(params.profileId);
  if (!profile) { show('home'); return; }
  const theme = THEMES[profile.theme] || THEMES.trucks;
  const journey = getJourney(profile);
  const unlocked = journey.unlocked;

  // Current stop = first unlocked-but-not-yet-completed, else the furthest one.
  let current = Math.min(unlocked, JOURNEY_STOPS);
  for (let n = 1; n <= unlocked; n++) {
    if (!(journey.stars[n] > 0)) { current = n; break; }
  }

  root.innerHTML = `
    <div class="scene-holder home-scene">${sceneHTML(theme.id)}</div>
    <div class="map-screen">
      <div class="map-head">
        <button class="iconbtn back-btn" id="back">⬅️</button>
        <h1 class="title map-title">${escapeHtml(profile.name)}'s Adventure</h1>
      </div>
      <div class="map-scroll">
        <div class="map-path">
          <div class="map-line"></div>
          ${STOPS.map((s) => stopHTML(s, journey, unlocked, current, theme)).join('')}
        </div>
      </div>
    </div>
  `;

  root.querySelector('#back').addEventListener('click', () => show('home'));

  root.querySelectorAll('.map-stop').forEach((el) => {
    const n = Number(el.dataset.n);
    if (n > unlocked) return; // locked
    el.addEventListener('pointerdown', () => {
      show('game', { mode: { kind: 'journey' }, players: [profile], stop: getStop(n) });
    });
  });

  // Bring the current (or just-finished) stop into view.
  const focusN = params.justFinished ? Math.min(params.justFinished + 1, JOURNEY_STOPS) : current;
  const focusEl = root.querySelector(`.map-stop[data-n="${focusN}"]`) || root.querySelector('.map-stop.current');
  if (focusEl && focusEl.scrollIntoView) focusEl.scrollIntoView({ block: 'center' });

  speak(params.justFinished ? line('ui_next_stop') : line(theme.id === 'unicorns' ? 'map_go_stella' : 'map_go_rumble'));
}

function stopHTML(stop, journey, unlocked, current, theme) {
  const n = stop.n;
  const stars = journey.stars[n] || 0;
  const locked = n > unlocked;
  const done = stars > 0;
  const isCurrent = n === current;
  const dx = OFFSETS[(n - 1) % OFFSETS.length];
  const cls = ['map-stop', locked ? 'locked' : '', done ? 'done' : '', isCurrent ? 'current' : ''].join(' ');
  const starRow = `<span class="ministars">${[1, 2, 3].map((i) => (i <= stars ? '★' : '☆')).join('')}</span>`;
  const face = locked ? '🔒' : (stop.last ? '🏁' : n);
  return `
    <div class="${cls}" data-n="${n}" style="transform:translateX(${dx}vw)">
      ${isCurrent ? `<div class="map-mascot">${mascotSVG(theme.id, 'wave')}</div>` : ''}
      <div class="stop-bubble">${face}</div>
      ${locked ? '' : starRow}
    </div>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
