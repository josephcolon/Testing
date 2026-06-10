/* ==========================================================================
   scene.js — soft, illustrated, animated backgrounds (Sago Mini-ish).

   Each theme gets a layered scene: a warm sky, a drifting sun, puffy clouds
   that float across, and rolling ground. Trucks get a sunny construction hill
   with a road; unicorns get a flowery meadow under a rainbow. Pure SVG/CSS so
   it stays crisp and offline. Returned markup is placed behind the play area.
   ========================================================================== */

const cloud = (x, y, s, dur, delay) =>
  `<g class="cloud" style="--y:${y}px;--s:${s};--dur:${dur}s;--delay:${delay}s">
     <ellipse cx="${x}" cy="0" rx="34" ry="22" fill="#ffffff" opacity="0.9"/>
     <ellipse cx="${x - 26}" cy="8" rx="24" ry="16" fill="#ffffff" opacity="0.9"/>
     <ellipse cx="${x + 26}" cy="8" rx="24" ry="16" fill="#ffffff" opacity="0.9"/>
   </g>`;

function trucksScene() {
  return `
    <svg class="scene-sky" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <circle class="sun" cx="330" cy="70" r="42" fill="#ffe487"/>
      <circle cx="330" cy="70" r="30" fill="#fff2b8"/>
      <g class="clouds">${cloud(120, 50, 1, 38, 0)}${cloud(300, 30, 0.7, 52, 8)}${cloud(60, 90, 0.85, 46, 20)}</g>
      <path d="M0 230 Q120 180 240 220 T400 210 V300 H0 Z" fill="#9ad26b"/>
      <path d="M0 255 Q160 215 320 250 T400 245 V300 H0 Z" fill="#7cbe4f"/>
      <path d="M0 285 H400 V300 H0 Z" fill="#6a6f7a"/>
      <g class="road-dashes" fill="#ffd23f">
        <rect x="30" y="291" width="34" height="6" rx="3"/>
        <rect x="120" y="291" width="34" height="6" rx="3"/>
        <rect x="210" y="291" width="34" height="6" rx="3"/>
        <rect x="300" y="291" width="34" height="6" rx="3"/>
      </g>
    </svg>`;
}

function unicornsScene() {
  return `
    <svg class="scene-sky" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <circle class="sun" cx="70" cy="64" r="38" fill="#fff0b8"/>
      <g fill="none" stroke-width="9">
        <path d="M-20 300 A220 220 0 0 1 420 300" stroke="#ff8fb3"/>
        <path d="M-20 300 A205 205 0 0 1 420 300" stroke="#ffd27a"/>
        <path d="M-20 300 A190 190 0 0 1 420 300" stroke="#9be08a"/>
        <path d="M-20 300 A175 175 0 0 1 420 300" stroke="#8fc6ff"/>
        <path d="M-20 300 A160 160 0 0 1 420 300" stroke="#c79bf0"/>
      </g>
      <g class="clouds">${cloud(150, 60, 0.9, 44, 0)}${cloud(330, 40, 0.7, 56, 10)}</g>
      <path d="M0 235 Q120 195 240 230 T400 220 V300 H0 Z" fill="#bfe89a"/>
      <path d="M0 262 Q150 225 320 258 T400 252 V300 H0 Z" fill="#a6da7d"/>
      <g class="flowers" fill="#ff7bc0">
        <circle cx="50" cy="285" r="5"/><circle cx="150" cy="278" r="5" fill="#ffd23f"/>
        <circle cx="250" cy="286" r="5" fill="#9b5de5"/><circle cx="350" cy="280" r="5" fill="#ff9f1c"/>
      </g>
    </svg>`;
}

/** Background scene markup for a theme. */
export function sceneHTML(themeId) {
  return `<div class="scene" aria-hidden="true">${themeId === 'unicorns' ? unicornsScene() : trucksScene()}</div>`;
}
