/* ==========================================================================
   mascots.js — the talking buddies who guide and react.

   Each theme has a mascot: "Rumble" the truck and "Stella" the unicorn. They
   greet on the home screen, give the prompts, and react to answers. mascotSVG()
   takes a mood so the engine can swap expressions:
     idle  — gentle resting smile
     happy — big open smile + sparkly eyes (correct answer / celebration)
     oops  — soft "ooh" mouth, encouraging (wrong answer — never sad)
     wave  — cheerful greeting
   Eyes blink and the body bobs via CSS (see main.css).
   ========================================================================== */

export const MASCOTS = {
  trucks: { name: 'Rumble', id: 'trucks' },
  unicorns: { name: 'Stella', id: 'unicorns' },
};

export const mascotName = (themeId) => (MASCOTS[themeId] || MASCOTS.trucks).name;

function mouth(mood, color) {
  switch (mood) {
    case 'happy': return `<path d="M38 64 Q50 80 62 64 Q50 70 38 64 Z" fill="#7a2540"/>
      <path d="M38 64 Q50 80 62 64" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
    case 'oops':  return `<ellipse cx="50" cy="66" rx="6" ry="8" fill="#7a2540"/>`;
    default:      return `<path d="M40 64 Q50 72 60 64" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
  }
}

function eyes(mood) {
  const sparkle = mood === 'happy'
    ? '<circle cx="36.5" cy="44.5" r="2" fill="#fff"/><circle cx="63.5" cy="44.5" r="2" fill="#fff"/>'
    : '';
  const brow = mood === 'oops'
    ? '<path d="M30 36 q8 -4 14 0" stroke="#5b4636" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M56 36 q6 -4 14 0" stroke="#5b4636" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    : '';
  return `<g class="m-eyes">
      <circle cx="38" cy="47" r="9" fill="#fff" stroke="#2b2d5c" stroke-width="2"/>
      <circle cx="62" cy="47" r="9" fill="#fff" stroke="#2b2d5c" stroke-width="2"/>
      <circle cx="38" cy="47" r="4.5" fill="#2b2d5c"/>
      <circle cx="62" cy="47" r="4.5" fill="#2b2d5c"/>
      <circle cx="39.4" cy="45.4" r="1.6" fill="#fff"/>
      <circle cx="63.4" cy="45.4" r="1.6" fill="#fff"/>
      ${sparkle}
    </g>${brow}`;
}

function truckMascot(mood) {
  return `
    <ellipse cx="50" cy="92" rx="30" ry="5" fill="rgba(0,0,0,0.12)"/>
    <rect x="14" y="22" width="72" height="50" rx="16" fill="#ff6b5e" stroke="#c4453b" stroke-width="3"/>
    <rect x="20" y="16" width="20" height="12" rx="5" fill="#ffd23f" stroke="#c99a00" stroke-width="2"/>
    <circle cx="30" cy="13" r="3.5" fill="#ff5ea8"/>
    <rect x="22" y="58" width="56" height="12" rx="6" fill="#ffd23f" stroke="#c99a00" stroke-width="2"/>
    ${eyes(mood)}
    <g class="m-mouth">${mouth(mood, '#c4453b')}</g>
    <circle cx="50" cy="55" r="5" fill="#ff9fc1" opacity="0.55"/>
    <circle cx="30" cy="80" r="10" fill="#3a3f4b"/><circle cx="30" cy="80" r="4" fill="#cfd6e0"/>
    <circle cx="70" cy="80" r="10" fill="#3a3f4b"/><circle cx="70" cy="80" r="4" fill="#cfd6e0"/>`;
}

function unicornMascot(mood) {
  return `
    <ellipse cx="50" cy="92" rx="28" ry="5" fill="rgba(0,0,0,0.12)"/>
    <path d="M50 4 l5 16 -10 0 z" fill="#ffd23f" stroke="#c99a00" stroke-width="2"/>
    <path d="M24 24 l-6 -14 14 6 z" fill="#caa6f7" stroke="#9b5de5" stroke-width="2"/>
    <path d="M76 24 l6 -14 -14 6 z" fill="#caa6f7" stroke="#9b5de5" stroke-width="2"/>
    <ellipse cx="50" cy="56" rx="34" ry="32" fill="#fff0fb" stroke="#d9a7e8" stroke-width="3"/>
    <path d="M30 22 q-12 8 -8 26 q6 -10 12 -8 q-6 -10 4 -16z" fill="#ff7bc0"/>
    <path d="M70 22 q12 8 8 26 q-6 -10 -12 -8 q6 -10 -4 -16z" fill="#7ec8ff"/>
    <path d="M50 18 q-10 4 -8 16 q6 -8 16 0 q2 -12 -8 -16z" fill="#ffd23f"/>
    ${eyes(mood)}
    <g class="m-mouth">${mouth(mood, '#c47ab0')}</g>
    <circle cx="32" cy="58" r="5.5" fill="#ff9fc1" opacity="0.7"/>
    <circle cx="68" cy="58" r="5.5" fill="#ff9fc1" opacity="0.7"/>`;
}

/** Returns an inline SVG string for a theme mascot in the given mood. */
export function mascotSVG(themeId, mood = 'idle') {
  const inner = themeId === 'unicorns' ? unicornMascot(mood) : truckMascot(mood);
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="mascot-svg mood-${mood}">${inner}</svg>`;
}
