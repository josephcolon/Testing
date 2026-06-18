/* ==========================================================================
   juice.js — "game feel" helpers: screen shake, squash, and splatter.
   Based on the well-worn juice playbook (Juice It or Lose It / Art of
   Screenshake): tiny, fast feedback on every meaningful action makes a
   functional game feel alive and satisfying.
   ========================================================================== */

import { burst } from '../ui/confetti.js';

/** Briefly shake the whole screen. level: 'sm' | 'lg'. */
export function screenShake(level = 'sm') {
  const app = document.getElementById('app');
  if (!app) return;
  app.classList.remove('shake-sm', 'shake-lg');
  void app.offsetWidth; // restart the animation
  app.classList.add(level === 'lg' ? 'shake-lg' : 'shake-sm');
  const cls = level === 'lg' ? 'shake-lg' : 'shake-sm';
  setTimeout(() => app.classList.remove(cls), 450);
}

/** Squash-and-stretch pop on an element. */
export function squish(el) {
  if (!el) return;
  el.classList.remove('squish');
  void el.offsetWidth;
  el.classList.add('squish');
}

/** Colorful splatter burst centered on an element (e.g. a popped bubble). */
export function splatAt(el, count = 22, shake = 'sm') {
  if (el && el.getBoundingClientRect && typeof window !== 'undefined') {
    const r = el.getBoundingClientRect();
    const w = window.innerWidth || 1, h = window.innerHeight || 1;
    burst({ x: (r.left + r.width / 2) / w, y: (r.top + r.height / 2) / h, count });
  }
  if (shake) screenShake(shake);
}
