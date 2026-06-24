/* ==========================================================================
   linematch.js — draw-a-line matching (the RV-AppStudios-style game).
   Two columns; drag a big line from a left card to its match on the right.
   Simple, forgiving, big swipes — great for the youngest. Content varies:
   letter -> picture, uppercase -> lowercase, or number -> dots.
   ========================================================================== */

import { LETTERS, PHONICS, PHONICS_LETTERS } from '../game/letters.js';
import { COLORS } from '../themes.js';
import { sample, shuffle, randInt } from '../game/round.js';
import { splatAt } from '../game/juice.js';

export const id = 'linematch';

const LINE_COLORS = ['#ff4d4d', '#3d8bff', '#9b5de5', '#4caf50', '#ff9f1c'];
const SVGNS = 'http://www.w3.org/2000/svg';

function buildPairs(count) {
  const n = Math.max(3, Math.min(5, count + 1));
  const type = sample(['letterpic', 'upperlower', 'numdots'], 1)[0];
  if (type === 'letterpic') {
    const keys = sample(PHONICS_LETTERS, n);
    return keys.map((L) => ({ key: L, left: `<span class="glyph-letter">${L}</span>`, right: `<span class="emoji-pic">${PHONICS[L]}</span>` }));
  }
  if (type === 'upperlower') {
    const keys = sample(LETTERS, n);
    return keys.map((L) => ({ key: L, left: `<span class="glyph-letter">${L}</span>`, right: `<span class="glyph-letter lower">${L.toLowerCase()}</span>` }));
  }
  // numdots
  const nums = shuffle(Array.from({ length: 9 }, (_, i) => i + 1)).slice(0, n);
  return nums.map((m) => ({
    key: 'n' + m,
    left: `<span class="glyph-letter">${m}</span>`,
    right: `<span class="dots-pic">${'●'.repeat(m)}</span>`,
  }));
}

export function create(theme, count) {
  const pairs = buildPairs(count);
  const lefts = pairs.map((p, i) => ({ ...p, color: LINE_COLORS[i % LINE_COLORS.length] }));
  const rights = shuffle(pairs.map((p) => ({ key: p.key, html: p.right })));

  let board, svg, wrap, activeLeft = null, temp = null, matched = 0;

  function center(el) {
    const r = el.getBoundingClientRect();
    const s = svg.getBoundingClientRect();
    return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top };
  }
  function line(cls) { const l = document.createElementNS(SVGNS, 'line'); l.setAttribute('class', cls); svg.appendChild(l); return l; }
  function setLine(l, a, b) { l.setAttribute('x1', a.x); l.setAttribute('y1', a.y); l.setAttribute('x2', b.x); l.setAttribute('y2', b.y); }
  function cancelTemp() { if (temp) { temp.remove(); temp = null; } activeLeft = null; }

  function startDrag(p, el) {
    if (el.classList.contains('done')) return;
    cancelTemp();
    activeLeft = { ...p, el, c: center(el) };
    temp = line('lm-line temp');
    temp.style.stroke = p.color;
    setLine(temp, activeLeft.c, activeLeft.c);
  }
  function tryDrop(p, el, api) {
    if (!activeLeft || el.classList.contains('done')) return;
    const left = activeLeft; // capture before cancelTemp clears it
    if (p.key === left.key) {
      const committed = line('lm-line');
      committed.style.stroke = left.color;
      setLine(committed, left.c, center(el));
      cancelTemp();
      left.el.classList.add('done');
      el.classList.add('done');
      splatAt(el, 14, 'sm');
      matched += 1;
      if (matched >= lefts.length) api.solved();
      else api.progress();
    } else {
      cancelTemp();
      api.wrong(el, { dim: false });
    }
  }

  return {
    prompt: { text: 'Match them up!', speechTokens: ['match'], icon: '🔗' },
    mount(b, api) {
      board = b;
      b.style.position = 'relative'; b.style.display = 'block'; b.style.overflow = 'hidden';
      b.innerHTML = `<div class="lm-wrap">
        <div class="lm-col left"></div>
        <div class="lm-col right"></div>
      </div>`;
      wrap = b.querySelector('.lm-wrap');
      svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('class', 'lm-lines');
      wrap.appendChild(svg);
      const colL = b.querySelector('.lm-col.left');
      const colR = b.querySelector('.lm-col.right');

      lefts.forEach((p) => {
        const el = document.createElement('button');
        el.className = 'choice lm-node';
        el.style.setProperty('--ln', p.color);
        el.dataset.leftKey = p.key;
        el.innerHTML = p.left;
        el.addEventListener('pointerdown', () => startDrag(p, el));
        colL.appendChild(el);
      });
      rights.forEach((p) => {
        const el = document.createElement('button');
        el.className = 'choice lm-node';
        el.dataset.rightKey = p.key;
        el.innerHTML = p.html;
        el.addEventListener('pointerup', () => tryDrop(p, el, api));
        colR.appendChild(el);
      });

      b.addEventListener('pointermove', (e) => {
        if (!activeLeft || !temp) return;
        const s = svg.getBoundingClientRect();
        setLine(temp, activeLeft.c, { x: (e.clientX ?? 0) - s.left, y: (e.clientY ?? 0) - s.top });
      });
      // If the finger lifts somewhere that isn't a right node, drop the temp line.
      b.addEventListener('pointerup', () => setTimeout(cancelTemp, 0));
    },
    teardown() {},
    hintTarget() { return board && board.querySelector('.lm-node[data-left-key]:not(.done)'); },
  };
}
