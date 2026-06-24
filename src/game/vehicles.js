/* ==========================================================================
   vehicles.js — glossy side-view vehicles for Free Drive.
   Each returns a body SVG (colorable, with gradient shading + a gloss highlight
   + bold outline) plus wheel positions so the driving screen can place spinning
   wheels on top.
   ========================================================================== */

import { COLORS } from '../themes.js';

export const VEHICLES = ['car', 'truck', 'bus', 'race', 'unicorn'];
export const CAR_COLORS = COLORS;

const darken = (hex, a = 0.72) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.round(((n >> 16) & 255) * a)},${Math.round(((n >> 8) & 255) * a)},${Math.round((n & 255) * a)})`;
};
const lighten = (hex, a = 0.4) => {
  const n = parseInt(hex.slice(1), 16);
  const L = (c) => Math.round(c + (255 - c) * a);
  return `rgb(${L((n >> 16) & 255)},${L((n >> 8) & 255)},${L(n & 255)})`;
};
const gid = (hex) => 'vg' + hex.slice(1);
const grad = (hex) =>
  `<linearGradient id="${gid(hex)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(hex, 0.55)}"/><stop offset="0.55" stop-color="${hex}"/><stop offset="1" stop-color="${darken(hex, 0.85)}"/></linearGradient>`;
const wrap = (hex, inner) =>
  `<svg viewBox="0 0 120 64" xmlns="http://www.w3.org/2000/svg"><defs>${grad(hex)}</defs>` +
  `<ellipse cx="60" cy="60" rx="54" ry="4" fill="rgba(0,0,0,0.16)"/>${inner}</svg>`;

function car(hex) {
  const out = darken(hex, 0.5), id = gid(hex);
  return wrap(hex, `
    <rect x="6" y="32" width="108" height="20" rx="11" fill="url(#${id})" stroke="${out}" stroke-width="3.5"/>
    <path d="M30 33 Q36 15 54 15 L74 15 Q90 15 95 33 Z" fill="url(#${id})" stroke="${out}" stroke-width="3.5" stroke-linejoin="round"/>
    <rect x="42" y="19" width="16" height="13" rx="3" fill="#cdeeff"/>
    <rect x="64" y="19" width="16" height="13" rx="3" fill="#cdeeff"/>
    <path d="M12 36 q42 -8 88 0 q-9 5 -88 3 z" fill="#fff" opacity="0.25"/>
    <circle cx="110" cy="36" r="4" fill="#ffe14d" stroke="${out}" stroke-width="2"/>`);
}
function truck(hex) {
  const out = darken(hex, 0.5), id = gid(hex);
  return wrap(hex, `
    <rect x="6" y="22" width="58" height="30" rx="6" fill="url(#${id})" stroke="${out}" stroke-width="3.5"/>
    <path d="M66 30 h22 l20 12 v10 h-42 z" fill="url(#${id})" stroke="${out}" stroke-width="3.5" stroke-linejoin="round"/>
    <rect x="90" y="33" width="14" height="10" rx="2" fill="#cdeeff"/>
    <path d="M12 27 q26 -6 46 0 q-6 5 -46 3 z" fill="#fff" opacity="0.22"/>
    <circle cx="112" cy="38" r="3.5" fill="#ffe14d" stroke="${out}" stroke-width="1.6"/>`);
}
function bus(hex) {
  const out = darken(hex, 0.5), id = gid(hex);
  let win = '';
  for (let i = 0; i < 4; i++) win += `<rect x="${16 + i * 22}" y="22" width="16" height="12" rx="2" fill="#cdeeff"/>`;
  return wrap(hex, `
    <rect x="6" y="14" width="108" height="38" rx="12" fill="url(#${id})" stroke="${out}" stroke-width="3.5"/>
    ${win}
    <rect x="98" y="38" width="12" height="14" rx="2" fill="${lighten(hex, 0.4)}"/>
    <path d="M12 19 q42 -7 90 0 q-9 5 -90 3 z" fill="#fff" opacity="0.22"/>
    <circle cx="112" cy="30" r="3.5" fill="#ffe14d" stroke="${out}" stroke-width="1.6"/>`);
}
function race(hex) {
  const out = darken(hex, 0.5), id = gid(hex);
  return wrap(hex, `
    <path d="M4 48 L26 38 L66 36 L82 26 L98 36 L116 42 L116 50 L4 50 Z" fill="url(#${id})" stroke="${out}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M70 36 Q76 28 88 30 L84 38 Z" fill="#cdeeff"/>
    <rect x="104" y="22" width="14" height="6" rx="2" fill="${lighten(hex, 0.4)}" stroke="${out}" stroke-width="2"/>
    <rect x="40" y="40" width="44" height="5" rx="2" fill="#fff" opacity="0.55"/>`);
}
function unicorn(hex) {
  const out = darken(hex, 0.5), id = gid(hex);
  return wrap(hex, `
    <rect x="6" y="32" width="108" height="20" rx="12" fill="url(#${id})" stroke="${out}" stroke-width="3.5"/>
    <path d="M30 33 Q36 15 54 15 L74 15 Q90 15 95 33 Z" fill="url(#${id})" stroke="${out}" stroke-width="3.5" stroke-linejoin="round"/>
    <rect x="48" y="19" width="30" height="13" rx="3" fill="#cdeeff"/>
    <path d="M101 30 l5 -16 4 16 z" fill="#ffd23f" stroke="#c79a00" stroke-width="2.4"/>
    <path d="M26 30 q-9 4 -11 17 q10 -6 17 -2z" fill="#ff7bc0"/>
    <path d="M30 31 q-6 5 -6 15 q7 -4 13 -3z" fill="#7ec8ff"/>
    <path d="M12 36 q42 -8 84 0 q-9 5 -84 3 z" fill="#fff" opacity="0.25"/>`);
}

const BODIES = { car, truck, bus, race, unicorn };

export function vehicle(type, hex) {
  const make = BODIES[type] || car;
  const wheels = type === 'race'
    ? [{ x: 32, y: 50, r: 12 }, { x: 94, y: 50, r: 12 }]
    : type === 'bus'
      ? [{ x: 32, y: 52, r: 11 }, { x: 90, y: 52, r: 11 }]
      : [{ x: 34, y: 52, r: 12 }, { x: 92, y: 52, r: 12 }];
  return { svg: make(hex), wheels, w: 120, h: 64 };
}

export const wheelSVG = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="19" fill="#33384a"/>
  <circle cx="20" cy="20" r="8" fill="#d9dee7"/>
  <g stroke="#aeb6c4" stroke-width="3">
    <line x1="20" y1="3" x2="20" y2="37"/><line x1="3" y1="20" x2="37" y2="20"/>
    <line x1="8" y1="8" x2="32" y2="32"/><line x1="32" y1="8" x2="8" y2="32"/>
  </g></svg>`;
