/* ==========================================================================
   vehicles.js — side-view vehicles for the Free Drive sandbox.
   Each returns a body SVG (colorable) plus wheel positions (in the body's
   0..120 x 0..64 box) so the driving screen can place spinning wheels on top.
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
const wrap = (inner) => `<svg viewBox="0 0 120 64" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

function car(hex) {
  const d = darken(hex), l = lighten(hex);
  return wrap(`
    <rect x="6" y="32" width="108" height="20" rx="10" fill="${hex}" stroke="${d}" stroke-width="3"/>
    <path d="M30 33 Q36 16 54 16 L74 16 Q90 16 95 33 Z" fill="${l}" stroke="${d}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="42" y="20" width="16" height="12" rx="3" fill="#cdeeff"/>
    <rect x="64" y="20" width="16" height="12" rx="3" fill="#cdeeff"/>
    <circle cx="110" cy="36" r="4" fill="#ffe14d"/>`);
}
function truck(hex) {
  const d = darken(hex), l = lighten(hex);
  return wrap(`
    <rect x="6" y="22" width="58" height="30" rx="5" fill="${hex}" stroke="${d}" stroke-width="3"/>
    <path d="M66 30 h22 l20 12 v10 h-42 z" fill="${l}" stroke="${d}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="90" y="33" width="14" height="10" rx="2" fill="#cdeeff"/>
    <circle cx="112" cy="38" r="3.5" fill="#ffe14d"/>`);
}
function bus(hex) {
  const d = darken(hex), l = lighten(hex);
  let win = '';
  for (let i = 0; i < 4; i++) win += `<rect x="${16 + i * 22}" y="22" width="16" height="12" rx="2" fill="#cdeeff"/>`;
  return wrap(`
    <rect x="6" y="14" width="108" height="38" rx="11" fill="${hex}" stroke="${d}" stroke-width="3"/>
    ${win}
    <rect x="98" y="38" width="12" height="14" rx="2" fill="${l}"/>
    <circle cx="112" cy="30" r="3.5" fill="#ffe14d"/>`);
}
function race(hex) {
  const d = darken(hex), l = lighten(hex);
  return wrap(`
    <path d="M4 48 L26 38 L66 36 L82 26 L98 36 L116 42 L116 50 L4 50 Z" fill="${hex}" stroke="${d}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M70 36 Q76 28 88 30 L84 38 Z" fill="#cdeeff"/>
    <rect x="104" y="22" width="14" height="6" rx="2" fill="${l}" stroke="${d}" stroke-width="2"/>
    <rect x="40" y="40" width="40" height="5" rx="2" fill="#fff" opacity="0.5"/>`);
}
function unicorn(hex) {
  const d = darken(hex), l = lighten(hex);
  return wrap(`
    <rect x="6" y="32" width="108" height="20" rx="12" fill="${hex}" stroke="${d}" stroke-width="3"/>
    <path d="M30 33 Q36 16 54 16 L74 16 Q90 16 95 33 Z" fill="${l}" stroke="${d}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="48" y="20" width="30" height="12" rx="3" fill="#cdeeff"/>
    <path d="M101 30 l5 -16 4 16 z" fill="#ffd23f" stroke="#c79a00" stroke-width="2"/>
    <path d="M26 30 q-8 4 -10 16 q9 -5 16 -2z" fill="#ff7bc0"/>
    <path d="M30 31 q-5 5 -5 14 q6 -4 12 -3z" fill="#7ec8ff"/>`);
}

const BODIES = { car, truck, bus, race, unicorn };

/** Returns { svg, wheels:[{x,y,r}], w, h } for a vehicle type + hex color. */
export function vehicle(type, hex) {
  const make = BODIES[type] || car;
  const wheels = type === 'race'
    ? [{ x: 32, y: 50, r: 12 }, { x: 94, y: 50, r: 12 }]
    : type === 'bus'
      ? [{ x: 32, y: 52, r: 11 }, { x: 90, y: 52, r: 11 }]
      : [{ x: 34, y: 52, r: 12 }, { x: 92, y: 52, r: 12 }];
  return { svg: make(hex), wheels, w: 120, h: 64 };
}

/** A spinning wheel SVG (rotated by the driving screen each frame). */
export const wheelSVG = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="19" fill="#33384a"/>
  <circle cx="20" cy="20" r="8" fill="#d9dee7"/>
  <g stroke="#aeb6c4" stroke-width="3">
    <line x1="20" y1="3" x2="20" y2="37"/><line x1="3" y1="20" x2="37" y2="20"/>
    <line x1="8" y1="8" x2="32" y2="32"/><line x1="32" y1="8" x2="8" y2="32"/>
  </g></svg>`;
