/* ==========================================================================
   tracing.js — ABCmouse-style "trace the shape" mechanic.

   Given a glyph (array of strokes of [x,y] in a 0..100 box), it lays the glyph
   out centered in the board, drops faint guide dots along each stroke, and lets
   the child drag a finger to light them up in order. Finishing a stroke is a
   progress step; finishing all strokes solves it. No fail state — you just keep
   tracing. Lenient hit radius for little fingers.
   ========================================================================== */

const SVGNS = 'http://www.w3.org/2000/svg';

function resample(points, spacing) {
  // Walk the polyline and emit points roughly `spacing` apart (0..100 space).
  const out = [points[0]];
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    let [x0, y0] = out[out.length - 1];
    const [x1, y1] = points[i];
    let segLen = Math.hypot(x1 - x0, y1 - y0);
    while (segLen >= spacing - acc) {
      const t = (spacing - acc) / segLen;
      const nx = x0 + (x1 - x0) * t, ny = y0 + (y1 - y0) * t;
      out.push([nx, ny]);
      x0 = nx; y0 = ny;
      segLen = Math.hypot(x1 - x0, y1 - y0);
      acc = 0;
    }
    acc += segLen;
  }
  const last = points[points.length - 1];
  if (Math.hypot(out[out.length - 1][0] - last[0], out[out.length - 1][1] - last[1]) > spacing * 0.4) out.push(last);
  return out;
}

export function makeTrace(glyph, prompt) {
  let surface, board, wp = [], sIdx = 0, wIdx = 0, drawing = false, hintEl = null;

  function layout() {
    const w = board.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const h = board.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600);
    const S = Math.min(w, h) * 0.78;
    return { w, h, S, ox: (w - S) / 2, oy: (h - S) / 2 };
  }

  return {
    prompt,
    mount(b, api) {
      board = b;
      b.style.position = 'relative'; b.style.display = 'block'; b.style.overflow = 'hidden';
      b.innerHTML = '';
      const { S, ox, oy } = layout();
      const px = ([gx, gy]) => ({ x: ox + (gx / 100) * S, y: oy + (gy / 100) * S });
      const R = Math.max(26, S * 0.14);

      surface = document.createElement('div');
      surface.className = 'trace-surface';
      surface.style.position = 'absolute';
      surface.style.inset = '0';
      surface.style.touchAction = 'none';
      b.appendChild(surface);

      // Guide outline (dotted) for looks.
      const svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('class', 'trace-svg');
      surface.appendChild(svg);

      wp = [];
      glyph.forEach((stroke) => {
        const sampled = resample(stroke, 9).map(px);
        wp.push(sampled);
        const poly = document.createElementNS(SVGNS, 'polyline');
        poly.setAttribute('points', stroke.map((p) => { const q = px(p); return `${q.x},${q.y}`; }).join(' '));
        poly.setAttribute('class', 'trace-guide');
        svg.appendChild(poly);
        const trail = document.createElementNS(SVGNS, 'polyline');
        trail.setAttribute('class', 'trace-trail');
        svg.appendChild(trail);
        sampled._trail = trail;
        sampled.forEach((q) => {
          const dot = document.createElement('div');
          dot.className = 'trace-dot';
          dot.style.left = q.x + 'px'; dot.style.top = q.y + 'px';
          surface.appendChild(dot);
          q.dot = dot;
        });
      });
      surface._waypoints = wp; // (used by tests)

      sIdx = 0; wIdx = 0;
      highlight();

      const localPos = (e) => {
        const r = surface.getBoundingClientRect();
        return { x: (e.clientX ?? 0) - r.left, y: (e.clientY ?? 0) - r.top };
      };
      const tryReach = (pos) => {
        if (sIdx >= wp.length) return;
        const stroke = wp[sIdx];
        // Reach the next dot, and any subsequent dots also under the finger.
        while (wIdx < stroke.length && Math.hypot(pos.x - stroke[wIdx].x, pos.y - stroke[wIdx].y) <= R) {
          stroke[wIdx].dot.classList.add('on');
          const pts = stroke.slice(0, wIdx + 1).map((q) => `${q.x},${q.y}`).join(' ');
          stroke._trail.setAttribute('points', pts);
          wIdx += 1;
        }
        if (wIdx >= stroke.length) {
          sIdx += 1; wIdx = 0;
          if (sIdx >= wp.length) { clearHint(); api.solved(); }
          else { api.progress(); highlight(); }
        }
      };

      surface.addEventListener('pointerdown', (e) => { drawing = true; tryReach(localPos(e)); });
      surface.addEventListener('pointermove', (e) => { if (drawing) tryReach(localPos(e)); });
      const stop = () => { drawing = false; };
      surface.addEventListener('pointerup', stop);
      surface.addEventListener('pointerleave', stop);

      function highlight() {
        clearHint();
        const stroke = wp[sIdx];
        if (stroke && stroke[wIdx]) { hintEl = stroke[wIdx].dot; hintEl.classList.add('target'); }
      }
      function clearHint() { if (hintEl) hintEl.classList.remove('target'); hintEl = null; }
      this._highlight = highlight;
    },
    hintTarget() { return hintEl; },
  };
}
