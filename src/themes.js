/* ==========================================================================
   themes.js — visual identity + sprite art.

   Two themes ("trucks", "unicorns") are skins over the identical game. Each
   theme provides a background palette, a colorable hero sprite, and a friendly
   sticker. All art is authored inline SVG (CC0 / original) so the game is fully
   self-contained and crisp at any size — no external image files needed.
   ========================================================================== */

// Kid-friendly colors with spoken names. Used by the colors activity.
export const COLORS = [
  { id: 'red',    hex: '#ff4d4d', name: 'red' },
  { id: 'blue',   hex: '#3d8bff', name: 'blue' },
  { id: 'green',  hex: '#4caf50', name: 'green' },
  { id: 'yellow', hex: '#ffd23f', name: 'yellow' },
  { id: 'purple', hex: '#9b5de5', name: 'purple' },
  { id: 'orange', hex: '#ff9f1c', name: 'orange' },
  { id: 'pink',   hex: '#ff7bc0', name: 'pink' },
];

// Basic shapes with spoken names. Used by the shapes activity.
// (At least 6 so the hardest difficulty — 6 choices — always has enough.)
export const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'oval'];

const darken = (hex, amt = 0.78) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * amt);
  const g = Math.round(((n >> 8) & 255) * amt);
  const b = Math.round((n & 255) * amt);
  return `rgb(${r},${g},${b})`;
};

/* ---- Hero sprites (colorable) ---- */

function truckSVG(hex) {
  const dark = darken(hex);
  return `<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
    <g stroke="${dark}" stroke-width="3" stroke-linejoin="round">
      <rect x="6" y="34" width="64" height="34" rx="6" fill="${hex}"/>
      <path d="M70 44 h22 l16 16 v8 h-38 z" fill="${hex}"/>
      <rect x="74" y="46" width="18" height="14" rx="3" fill="#bfe9ff" stroke="${dark}"/>
    </g>
    <circle cx="30" cy="72" r="12" fill="#333"/><circle cx="30" cy="72" r="5" fill="#ccc"/>
    <circle cx="92" cy="72" r="12" fill="#333"/><circle cx="92" cy="72" r="5" fill="#ccc"/>
    <rect x="104" y="58" width="6" height="8" rx="2" fill="#ffe14d"/>
  </svg>`;
}

function unicornSVG(hex) {
  const dark = darken(hex);
  const mane = darken(hex, 0.6);
  return `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
    <g stroke="${dark}" stroke-width="3" stroke-linejoin="round">
      <ellipse cx="58" cy="64" rx="40" ry="26" fill="${hex}"/>
      <path d="M86 44 q22 -6 26 14 q-14 -4 -20 6 q-2 -14 -6 -20 z" fill="${hex}"/>
      <rect x="22" y="78" width="8" height="16" rx="3" fill="${hex}"/>
      <rect x="80" y="78" width="8" height="16" rx="3" fill="${hex}"/>
    </g>
    <path d="M96 26 l8 22 -16 -4 z" fill="#ffd23f" stroke="${dark}" stroke-width="2"/>
    <path d="M70 38 q-10 -8 -22 -2 q10 2 8 14 q8 -8 14 -12z" fill="${mane}"/>
    <circle cx="98" cy="56" r="4" fill="#2b2d5c"/>
    <path d="M30 56 q-12 0 -16 14 q10 -6 18 0z" fill="${mane}"/>
  </svg>`;
}

function shapeSVG(shape, hex) {
  const dark = darken(hex);
  const wrap = (inner) =>
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">` +
    `<g fill="${hex}" stroke="${dark}" stroke-width="5" stroke-linejoin="round">${inner}</g></svg>`;
  switch (shape) {
    case 'circle':   return wrap('<circle cx="50" cy="50" r="40"/>');
    case 'square':   return wrap('<rect x="14" y="14" width="72" height="72" rx="8"/>');
    case 'triangle': return wrap('<path d="M50 12 L88 84 L12 84 Z"/>');
    case 'star':     return wrap('<path d="M50 8 L61 38 L93 38 L67 58 L77 90 L50 70 L23 90 L33 58 L7 38 L39 38 Z"/>');
    case 'heart':    return wrap('<path d="M50 86 C8 56 14 20 38 20 C48 20 50 30 50 30 C50 30 52 20 62 20 C86 20 92 56 50 86 Z"/>');
    case 'diamond':  return wrap('<path d="M50 10 L88 50 L50 90 L12 50 Z"/>');
    case 'oval':     return wrap('<ellipse cx="50" cy="50" rx="42" ry="28"/>');
    default:         return wrap('<circle cx="50" cy="50" r="40"/>');
  }
}

export const THEMES = {
  trucks: {
    id: 'trucks',
    label: 'Trucks',
    emoji: '🚚',
    sticker: '⭐',
    bg: ['#7ec8ff', '#2b7fff'],
    accent: '#ffd23f',
    hero: truckSVG,
    nounSingular: 'truck',
    nounPlural: 'trucks',
  },
  unicorns: {
    id: 'unicorns',
    label: 'Unicorns',
    emoji: '🦄',
    sticker: '🌈',
    bg: ['#ffb3e6', '#9b5de5'],
    accent: '#ffd23f',
    hero: unicornSVG,
    nounSingular: 'unicorn',
    nounPlural: 'unicorns',
  },
};

export { shapeSVG };

/** Apply a theme's palette to the document (or a specific panel root). */
export function applyThemePalette(theme, el = document.body) {
  el.style.setProperty('--bg-1', theme.bg[0]);
  el.style.setProperty('--bg-2', theme.bg[1]);
  el.style.setProperty('--accent', theme.accent);
}
