/* ==========================================================================
   themes.js — visual identity + sprite art.

   Two themes ("trucks", "unicorns") are skins over the identical game. Each
   theme provides a palette, a colorable hero character, themed praise lines,
   themed collectible stickers, and a sticker emoji. All art is authored inline
   SVG (CC0 / original) so the game is fully self-contained and crisp at any
   size — no external image files needed.

   The heroes have faces on purpose: eyes and a smile are what turn a sprite
   into a character a 3-year-old bonds with.
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

// Age-appropriate subsets for the easiest boards: primary-ish colors that are
// never perceptually confusable side by side, and the four canonical shapes.
export const EASY_COLOR_IDS = ['red', 'blue', 'green', 'yellow'];
export const EASY_SHAPES = ['circle', 'square', 'triangle', 'star'];

const darken = (hex, amt = 0.72) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * amt);
  const g = Math.round(((n >> 8) & 255) * amt);
  const b = Math.round((n & 255) * amt);
  return `rgb(${r},${g},${b})`;
};

const lighten = (hex, amt = 0.4) => {
  const n = parseInt(hex.slice(1), 16);
  const L = (c) => Math.round(c + (255 - c) * amt);
  return `rgb(${L((n >> 16) & 255)},${L((n >> 8) & 255)},${L(n & 255)})`;
};

/* ---- Hero sprites (colorable, with faces) ---- */

function truckSVG(hex) {
  const dark = darken(hex);
  const gid = 'tg' + hex.slice(1); // same color => same gradient, ids may repeat safely
  return `<svg viewBox="0 0 120 94" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${lighten(hex)}"/>
        <stop offset="1" stop-color="${hex}"/>
      </linearGradient>
    </defs>
    <!-- cargo peeking out of the dump bed -->
    <circle cx="18" cy="30" r="8" fill="#c9b8a8" stroke="${dark}" stroke-width="2.5"/>
    <circle cx="33" cy="27" r="9" fill="#bfae9e" stroke="${dark}" stroke-width="2.5"/>
    <circle cx="48" cy="30" r="8" fill="#d4c4b4" stroke="${dark}" stroke-width="2.5"/>
    <!-- dump bed -->
    <rect x="4" y="30" width="62" height="36" rx="9" fill="url(#${gid})" stroke="${dark}" stroke-width="3"/>
    <!-- cab -->
    <path d="M66 38 h26 q5 0 8 4 l8 11 q2 3 2 6 v7 h-44 z"
      fill="url(#${gid})" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
    <!-- windshield with eyes -->
    <rect x="71" y="43" width="22" height="15" rx="5" fill="#eaf7ff" stroke="${dark}" stroke-width="2.5"/>
    <circle cx="78" cy="50.5" r="3.4" fill="#2b2d5c"/>
    <circle cx="87" cy="50.5" r="3.4" fill="#2b2d5c"/>
    <circle cx="79.2" cy="49.3" r="1.2" fill="#fff"/>
    <circle cx="88.2" cy="49.3" r="1.2" fill="#fff"/>
    <!-- smile + cheek -->
    <path d="M76 62 q7 5 14 0" fill="none" stroke="${dark}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="72" cy="61" r="2.6" fill="#ff9fc1" opacity="0.8"/>
    <!-- bumper + headlight -->
    <rect x="105" y="60" width="9" height="11" rx="3.5" fill="#cfd8e3" stroke="${dark}" stroke-width="2.5"/>
    <circle cx="106" cy="55" r="3" fill="#ffe14d" stroke="${dark}" stroke-width="2"/>
    <!-- wheels -->
    <g>
      <circle cx="24" cy="70" r="12" fill="#333a47"/><circle cx="24" cy="70" r="5" fill="#d9dee7"/>
      <circle cx="48" cy="70" r="12" fill="#333a47"/><circle cx="48" cy="70" r="5" fill="#d9dee7"/>
      <circle cx="94" cy="70" r="12" fill="#333a47"/><circle cx="94" cy="70" r="5" fill="#d9dee7"/>
    </g>
  </svg>`;
}

function unicornSVG(hex) {
  const dark = darken(hex);
  const gid = 'ug' + hex.slice(1);
  return `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${lighten(hex)}"/>
        <stop offset="1" stop-color="${hex}"/>
      </linearGradient>
    </defs>
    <!-- rainbow tail -->
    <path d="M22 58 q-14 2 -12 16" fill="none" stroke="#ff7bc0" stroke-width="5" stroke-linecap="round"/>
    <path d="M24 63 q-11 3 -9 13" fill="none" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/>
    <path d="M26 68 q-8 3 -6 10" fill="none" stroke="#7ec8ff" stroke-width="5" stroke-linecap="round"/>
    <!-- legs -->
    <rect x="32" y="78" width="8" height="16" rx="3.5" fill="url(#${gid})" stroke="${dark}" stroke-width="2.5"/>
    <rect x="46" y="80" width="8" height="15" rx="3.5" fill="url(#${gid})" stroke="${dark}" stroke-width="2.5"/>
    <rect x="60" y="80" width="8" height="15" rx="3.5" fill="url(#${gid})" stroke="${dark}" stroke-width="2.5"/>
    <rect x="72" y="78" width="8" height="16" rx="3.5" fill="url(#${gid})" stroke="${dark}" stroke-width="2.5"/>
    <!-- body -->
    <ellipse cx="54" cy="64" rx="33" ry="21" fill="url(#${gid})" stroke="${dark}" stroke-width="3"/>
    <!-- neck + head -->
    <path d="M74 52 q4 -18 14 -26 l14 10 q4 10 -2 18 z" fill="url(#${gid})" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="92" cy="36" r="15" fill="url(#${gid})" stroke="${dark}" stroke-width="3"/>
    <!-- muzzle -->
    <ellipse cx="102" cy="42" rx="8" ry="6.5" fill="${lighten(hex, 0.65)}" stroke="${dark}" stroke-width="2.5"/>
    <circle cx="104" cy="42" r="1.4" fill="${dark}"/>
    <!-- ear + golden horn -->
    <path d="M80 24 l4 -10 l7 8 z" fill="url(#${gid})" stroke="${dark}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M92 21 l4 -17 l5 16 z" fill="#ffd23f" stroke="#c79a00" stroke-width="2.5" stroke-linejoin="round"/>
    <!-- rainbow mane -->
    <path d="M84 22 q-12 6 -14 22 q-2 12 -10 16" fill="none" stroke="#ff7bc0" stroke-width="6" stroke-linecap="round"/>
    <path d="M89 24 q-10 8 -11 22 q-1 10 -7 15" fill="none" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/>
    <path d="M93 28 q-8 8 -8 20" fill="none" stroke="#7ec8ff" stroke-width="4.5" stroke-linecap="round"/>
    <!-- eye with lashes, highlight, blush -->
    <circle cx="90" cy="35" r="4.2" fill="#2b2d5c"/>
    <circle cx="91.4" cy="33.6" r="1.4" fill="#fff"/>
    <path d="M85 30 l-3.4 -2" stroke="#2b2d5c" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M86.5 28 l-2.4 -3" stroke="#2b2d5c" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="96" cy="44" r="3" fill="#ff9fc1" opacity="0.75"/>
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
    primary: '#3d8bff', // default hero color (counting groups, avatars)
    hero: truckSVG,
    nounSingular: 'truck',
    nounPlural: 'trucks',
    praise: ['Honk honk! Great job!', 'Beep beep! You got it!', 'Great driving!', 'Vroom! Amazing!', 'Awesome, driver!'],
    stickerSet: ['🚚', '🚒', '🚜', '🚛', '🏗️', '🚦', '⭐', '🔧'],
  },
  unicorns: {
    id: 'unicorns',
    label: 'Unicorns',
    emoji: '🦄',
    sticker: '🌈',
    bg: ['#ffb3e6', '#9b5de5'],
    accent: '#ffd23f',
    primary: '#b07ce8',
    hero: unicornSVG,
    nounSingular: 'unicorn',
    nounPlural: 'unicorns',
    praise: ['Magical!', 'Sparkly! Great job!', 'Unicorn magic!', 'Amazing! So sparkly!', 'You got it!'],
    stickerSet: ['🦄', '🌈', '✨', '🧁', '🌸', '👑', '💖', '⭐'],
  },
};

export { shapeSVG };

/** Apply a theme's palette to the document (or a specific panel root). */
export function applyThemePalette(theme, el = document.body) {
  el.style.setProperty('--bg-1', theme.bg[0]);
  el.style.setProperty('--bg-2', theme.bg[1]);
  el.style.setProperty('--accent', theme.accent);
}
