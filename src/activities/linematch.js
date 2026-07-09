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
import { line as vo } from '../content/lines.js';

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

  let board, svg, colR, activeLeft = null, temp = null, matched = 0, onMove = null, onUp = null;

  function center(el) {
    const r = el.getBoundingClientRect();
    const s = svg.getBoundingClientRect();
    return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top };
  }
  function line(cls) { const l = document.createElementNS(SVGNS, 'line'); l.setAttribute('class', cls); svg.appendChild(l); return l; }
  function setLine(l, a, b) { l.setAttribute('x1', a.x); l.setAttribute('y1', a.y); l.setAttribute('x2', b.x); l.setAttribute('y2', b.y); }

  function endDrag() {
    if (temp) { temp.remove(); temp = null; }
    activeLeft = null;
    if (onMove) window.removeEventListener('pointermove', onMove);
    if (onUp) window.removeEventListener('pointerup', onUp);
    onMove = onUp = null;
  }

  // Which right card is under the drop point (with a forgiving radius)?
  function rightNodeAt(x, y) {
    let best = null, bestD = Infinity;
    colR.querySelectorAll('.lm-node[data-right-key]:not(.done)').forEach((n) => {
      const r = n.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(x - cx, y - cy);
      const inside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      const thresh = Math.max(r.width, r.height) * 0.7 || 50;
      if ((inside || d < thresh) && d < bestD) { best = n; bestD = d; }
    });
    return best;
  }

  function startDrag(p, leftEl, api) {
    if (leftEl.classList.contains('done')) return;
    endDrag();
    activeLeft = { ...p, el: leftEl, c: center(leftEl) };
    temp = line('lm-line temp');
    temp.style.stroke = p.color;
    setLine(temp, activeLeft.c, activeLeft.c);

    onMove = (e) => {
      if (!temp) return;
      const s = svg.getBoundingClientRect();
      setLine(temp, activeLeft.c, { x: (e.clientX ?? 0) - s.left, y: (e.clientY ?? 0) - s.top });
    };
    onUp = (e) => {
      const left = activeLeft;
      const target = rightNodeAt(e.clientX ?? 0, e.clientY ?? 0);
      endDrag();
      if (!left || !target) return;
      if (target.dataset.rightKey === left.key) {
        const committed = line('lm-line');
        committed.style.stroke = left.color;
        setLine(committed, left.c, center(target));
        left.el.classList.add('done');
        target.classList.add('done');
        splatAt(target, 14, 'sm');
        matched += 1;
        if (matched >= lefts.length) api.solved();
        else api.progress();
      } else {
        api.wrong(target, { dim: false });
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return {
    prompt: { text: vo('prompt_match_up'), speechTokens: ['match'], icon: '🔗' },
    mount(b, api) {
      board = b;
      b.style.position = 'relative'; b.style.display = 'block'; b.style.overflow = 'hidden';
      b.innerHTML = `<div class="lm-wrap"><div class="lm-col left"></div><div class="lm-col right"></div></div>`;
      const wrap = b.querySelector('.lm-wrap');
      svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('class', 'lm-lines');
      wrap.appendChild(svg);
      const colL = b.querySelector('.lm-col.left');
      colR = b.querySelector('.lm-col.right');

      lefts.forEach((p) => {
        const el = document.createElement('button');
        el.className = 'choice lm-node';
        el.style.setProperty('--ln', p.color);
        el.dataset.leftKey = p.key;
        el.innerHTML = p.left;
        el.addEventListener('pointerdown', (e) => { e.preventDefault?.(); startDrag(p, el, api); });
        colL.appendChild(el);
      });
      rights.forEach((p) => {
        const el = document.createElement('button');
        el.className = 'choice lm-node';
        el.dataset.rightKey = p.key;
        el.innerHTML = p.html;
        colR.appendChild(el);
      });
    },
    teardown() { endDrag(); },
    hintTarget() { return board && board.querySelector('.lm-node[data-left-key]:not(.done)'); },
  };
}
