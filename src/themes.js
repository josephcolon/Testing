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
  const out = darken(hex, 0.5);   // bold dark outline
  const lo = darken(hex, 0.85);
  const hi = lighten(hex, 0.6);
  const gid = 'tg' + hex.slice(1);
  return `<svg viewBox="0 0 120 94" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${hi}"/><stop offset="0.55" stop-color="${hex}"/><stop offset="1" stop-color="${lo}"/>
      </linearGradient>
    </defs>
    <ellipse cx="60" cy="86" rx="46" ry="6" fill="rgba(0,0,0,0.16)"/>
    <g stroke="${out}" stroke-width="5" stroke-linejoin="round">
      <rect x="8" y="30" width="70" height="40" rx="14" fill="url(#${gid})"/>
      <path d="M78 40 h14 q7 0 11 6 l7 11 q2 3 2 7 v6 h-45 z" fill="url(#${gid})"/>
    </g>
    <rect x="82" y="46" width="22" height="16" rx="6" fill="#dff3ff" stroke="${out}" stroke-width="4"/>
    <circle cx="88" cy="55" r="5" fill="#2b2d5c"/><circle cx="98" cy="55" r="5" fill="#2b2d5c"/>
    <circle cx="89.8" cy="53" r="1.8" fill="#fff"/><circle cx="99.8" cy="53" r="1.8" fill="#fff"/>
    <path d="M85 67 q9 7 19 0" fill="none" stroke="${out}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="80" cy="64" r="3.4" fill="#ff9ec4" opacity="0.85"/>
    <path d="M16 37 q22 -7 50 -1 q-6 7 -50 5 z" fill="#fff" opacity="0.32"/>
    <circle cx="112" cy="60" r="3.6" fill="#ffe14d" stroke="${out}" stroke-width="2.5"/>
    <g stroke="${out}" stroke-width="4.5">
      <circle cx="33" cy="74" r="14" fill="#363b49"/><circle cx="92" cy="74" r="14" fill="#363b49"/>
    </g>
    <circle cx="33" cy="74" r="5.5" fill="#dfe4ee"/><circle cx="92" cy="74" r="5.5" fill="#dfe4ee"/>
  </svg>`;
}

function unicornSVG(hex) {
  const out = darken(hex, 0.5);
  const lo = darken(hex, 0.85);
  const hi = lighten(hex, 0.62);
  const gid = 'ug' + hex.slice(1);
  return `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${hi}"/><stop offset="0.55" stop-color="${hex}"/><stop offset="1" stop-color="${lo}"/>
      </linearGradient>
    </defs>
    <ellipse cx="58" cy="92" rx="42" ry="6" fill="rgba(0,0,0,0.16)"/>
    <g fill="none" stroke-linecap="round">
      <path d="M20 58 q-15 4 -13 20" stroke="#ff7bc0" stroke-width="7"/>
      <path d="M24 62 q-12 5 -10 17" stroke="#ffd23f" stroke-width="6"/>
      <path d="M28 66 q-9 5 -7 14" stroke="#7ec8ff" stroke-width="5"/>
    </g>
    <g stroke="${out}" stroke-width="4" stroke-linejoin="round">
      <rect x="34" y="74" width="11" height="20" rx="5" fill="url(#${gid})"/>
      <rect x="68" y="74" width="11" height="20" rx="5" fill="url(#${gid})"/>
    </g>
    <ellipse cx="54" cy="60" rx="36" ry="24" fill="url(#${gid})" stroke="${out}" stroke-width="5"/>
    <path d="M74 50 q6 -22 18 -30 q14 4 16 18 q1 12 -8 20 z" fill="url(#${gid})" stroke="${out}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="92" cy="34" r="17" fill="url(#${gid})" stroke="${out}" stroke-width="5"/>
    <ellipse cx="103" cy="40" rx="9" ry="7.5" fill="${hi}" stroke="${out}" stroke-width="3"/>
    <circle cx="105" cy="40" r="1.6" fill="${out}"/>
    <path d="M80 20 l3 -11 8 8 z" fill="url(#${gid})" stroke="${out}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M93 18 l5 -16 5 15 z" fill="#ffd23f" stroke="#c79a00" stroke-width="3" stroke-linejoin="round"/>
    <g fill="none" stroke-linecap="round">
      <path d="M82 18 q-14 8 -15 26 q-2 13 -11 18" stroke="#ff7bc0" stroke-width="7"/>
      <path d="M88 20 q-11 9 -12 25" stroke="#ffd23f" stroke-width="6"/>
      <path d="M93 24 q-9 9 -9 22" stroke="#7ec8ff" stroke-width="5"/>
    </g>
    <circle cx="90" cy="33" r="5.5" fill="#fff" stroke="${out}" stroke-width="2"/>
    <circle cx="90.5" cy="34" r="3.4" fill="#2b2d5c"/>
    <circle cx="92" cy="32.4" r="1.4" fill="#fff"/>
    <path d="M84 26 l-4 -2 M87 24 l-2.6 -3.4" stroke="${out}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="96" cy="42" r="3.4" fill="#ff9ec4" opacity="0.8"/>
    <path d="M30 44 q20 -8 40 -2 q-6 7 -40 5 z" fill="#fff" opacity="0.30"/>
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
