/* ==========================================================================
   tracing.js — "trace the shape" the friendly way.

   The glyph is shown as a big, fat, light TRACK (a thick ribbon in the shape of
   the letter/number). The child drags a finger along it however they like and
   the track FILLS with color as they go — they don't have to hit individual
   points, they just have to follow the shape. Generous tolerance, forgiving of
   fast swipes and wobbles. Finishing all strokes solves it. No fail state.
   ========================================================================== */

const SVGNS = 'http://www.w3.org/2000/svg';

function resample(points, spacing) {
  const out = [points[0]];
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    let [x0, y0] = out[out.length - 1];
    const [x1, y1] = points[i];
    let seg = Math.hypot(x1 - x0, y1 - y0);
    while (seg >= spacing - acc) {
      const t = (spacing - acc) / seg;
      const nx = x0 + (x1 - x0) * t, ny = y0 + (y1 - y0) * t;
      out.push([nx, ny]); x0 = nx; y0 = ny;
      seg = Math.hypot(x1 - x0, y1 - y0); acc = 0;
    }
    acc += seg;
  }
  const last = points[points.length - 1];
  if (Math.hypot(out[out.length - 1][0] - last[0], out[out.length - 1][1] - last[1]) > spacing * 0.4) out.push(last);
  return out;
}

export function makeTrace(glyph, prompt) {
  let board, svg, strokes = [], sIdx = 0, prog = 0, drawing = false, frontEl, startEl, fills = [];

  function layout() {
    const w = board.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const h = board.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600);
    const S = Math.min(w, h) * 0.82;
    return { w, h, S, ox: (w - S) / 2, oy: (h - S) / 2 };
  }
  const poly = (pts) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return {
    prompt,
    mount(b, api) {
      board = b;
      b.style.position = 'relative'; b.style.display = 'block'; b.style.overflow = 'hidden';
      b.innerHTML = '';
      const { S, ox, oy } = layout();
      const px = ([gx, gy]) => ({ x: ox + (gx / 100) * S, y: oy + (gy / 100) * S });
      const TOL = Math.max(34, S * 0.17);
      const tw = Math.max(20, S * 0.12);

      svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('class', 'trace-svg');
      const surface = document.createElement('div');
      surface.className = 'trace-surface';
      surface.style.position = 'absolute'; surface.style.inset = '0'; surface.style.touchAction = 'none';
      b.appendChild(surface); surface.appendChild(svg);

      strokes = glyph.map((stroke) => resample(stroke, 5).map(px));
      surface._waypoints = strokes; // (tests)
      fills = [];
      // tracks (visible fat glyph), then fills (colored progress) on top
      strokes.forEach((pts) => {
        const track = document.createElementNS(SVGNS, 'polyline');
        track.setAttribute('class', 'trace-track'); track.setAttribute('points', poly(pts));
        track.setAttribute('stroke-width', tw); svg.appendChild(track);
      });
      strokes.forEach((pts) => {
        const fill = document.createElementNS(SVGNS, 'polyline');
        fill.setAttribute('class', 'trace-fill'); fill.setAttribute('points', '');
        fill.setAttribute('stroke-width', tw); svg.appendChild(fill); fills.push(fill);
      });
      startEl = document.createElementNS(SVGNS, 'circle'); startEl.setAttribute('class', 'trace-start'); startEl.setAttribute('r', tw * 0.62); svg.appendChild(startEl);
      frontEl = document.createElementNS(SVGNS, 'circle'); frontEl.setAttribute('class', 'trace-front'); frontEl.setAttribute('r', tw * 0.5); svg.appendChild(frontEl);

      sIdx = 0; prog = 0; updateActive();

      const localPos = (e) => { const r = surface.getBoundingClientRect(); return { x: (e.clientX ?? 0) - r.left, y: (e.clientY ?? 0) - r.top }; };
      const advance = (pos) => {
        if (sIdx >= strokes.length) return;
        const pts = strokes[sIdx];
        let far = prog;
        for (let i = prog + 1; i < pts.length && i <= prog + 14; i++) {
          if (Math.hypot(pts[i].x - pos.x, pts[i].y - pos.y) <= TOL) far = i;
        }
        if (far > prog) {
          prog = far;
          fills[sIdx].setAttribute('points', poly(pts.slice(0, prog + 1)));
          frontEl.setAttribute('cx', pts[prog].x); frontEl.setAttribute('cy', pts[prog].y);
          if (prog >= pts.length - 1) completeStroke(api);
        }
      };
      surface.addEventListener('pointerdown', (e) => { drawing = true; advance(localPos(e)); });
      surface.addEventListener('pointermove', (e) => { if (drawing) advance(localPos(e)); });
      const up = () => { drawing = false; };
      surface.addEventListener('pointerup', up);
      surface.addEventListener('pointerleave', up);

      function completeStroke(a) {
        fills[sIdx].setAttribute('points', poly(strokes[sIdx]));
        sIdx += 1; prog = 0;
        if (sIdx >= strokes.length) {
          startEl.style.display = 'none'; frontEl.style.display = 'none';
          a.solved();
        } else { a.progress(); updateActive(); }
      }
      function updateActive() {
        const p0 = strokes[sIdx][0];
        startEl.setAttribute('cx', p0.x); startEl.setAttribute('cy', p0.y); startEl.style.display = '';
        frontEl.setAttribute('cx', p0.x); frontEl.setAttribute('cy', p0.y); frontEl.style.display = '';
      }
      this._updateActive = updateActive;
    },
    hintTarget() { return null; },
  };
}
