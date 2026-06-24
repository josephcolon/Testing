/* ==========================================================================
   drive.js — Free Drive: an open, no-fail side-scrolling sandbox.

   The car sits centered; holding ◀ / ▶ scrolls an endless parallax world past
   it (so a 3-year-old can never get stuck or reach an end). A honk button adds
   cause-and-effect delight, and a garage lets them change car type + color
   (saved per child). Controls are two giant hold-to-drive arrows.
   ========================================================================== */

import { getProfile, getProfiles, getCar, setCar } from '../state.js';
import { vehicle, VEHICLES, CAR_COLORS, wheelSVG } from '../game/vehicles.js';
import { themeSounds, speak } from '../audio.js';

export const DRIVE = { CRUISE: 360, ACCEL: 7, WHEEL_K: 0.6 };

/** Advance the driving model by dt seconds (pure; used by the loop + tests). */
export function stepDrive(s, dt) {
  const target = s.dir * DRIVE.CRUISE;
  s.vel += (target - s.vel) * Math.min(1, DRIVE.ACCEL * dt);
  if (s.dir === 0 && Math.abs(s.vel) < 3) s.vel = 0;
  s.worldX += s.vel * dt;
  s.wheel += s.vel * dt * DRIVE.WHEEL_K;
  if (s.vel > 8) s.facing = 1; else if (s.vel < -8) s.facing = -1;
  s.t = (s.t || 0) + dt;
  return s;
}

const uri = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const CLOUDS = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='200'><g fill='#ffffff' opacity='0.92'><ellipse cx='120' cy='70' rx='60' ry='34'/><ellipse cx='80' cy='90' rx='42' ry='26'/><ellipse cx='170' cy='92' rx='44' ry='26'/><ellipse cx='430' cy='50' rx='50' ry='28'/><ellipse cx='400' cy='66' rx='34' ry='22'/><ellipse cx='465' cy='66' rx='36' ry='22'/></g></svg>`;
const HILLS_FAR = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='240'><path d='M0 240 V150 Q200 60 400 150 T800 150 V240 Z' fill='#a7d98a'/></svg>`;
const HILLS_NEAR = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='220'><path d='M0 220 V140 Q150 70 300 140 T600 140 V220 Z' fill='#84c46a'/></svg>`;
const TREES = `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='220'>
  <g><rect x='52' y='150' width='14' height='40' fill='#9c6b3f'/><circle cx='59' cy='140' r='34' fill='#5fae4e'/><circle cx='38' cy='150' r='24' fill='#6cbb58'/><circle cx='80' cy='150' r='24' fill='#6cbb58'/></g>
  <g><rect x='250' y='160' width='12' height='34' fill='#9c6b3f'/><circle cx='256' cy='150' r='26' fill='#67b653'/></g>
  <g><rect x='180' y='170' width='10' height='24' fill='#b07b48'/><path d='M185 130 l24 44 -48 0 z' fill='#5fae4e'/></g></svg>`;

export function renderDrive({ root, show, params }) {
  const profile = getProfile(params.profileId) || getProfiles()[0];
  const car = { ...getCar(profile) };
  const sounds = themeSounds('trucks');

  root.innerHTML = `
    <div class="drive-scene">
      <div class="dlayer sky"></div>
      <div class="dlayer clouds"></div>
      <div class="dlayer hills-far"></div>
      <div class="dlayer hills-near"></div>
      <div class="dlayer trees"></div>
      <div class="ground"><div class="road"><div class="road-dash"></div></div></div>
      <div class="car"></div>
      <div class="beep">Beep beep! 📣</div>
      <button class="iconbtn back-btn" id="back">⬅️</button>
      <button class="iconbtn" id="garage" title="Change car"
        style="position:absolute;top:var(--gap);right:var(--gap);z-index:5">🔧</button>
      <div class="drive-controls">
        <button class="ctl left" aria-label="Drive left">◀</button>
        <button class="ctl honk" aria-label="Honk">📣</button>
        <button class="ctl right" aria-label="Drive right">▶</button>
      </div>
    </div>
  `;

  const scene = root.querySelector('.drive-scene');
  const layers = {
    clouds: { el: root.querySelector('.clouds'), f: 0.12 },
    hf: { el: root.querySelector('.hills-far'), f: 0.32 },
    hn: { el: root.querySelector('.hills-near'), f: 0.58 },
    trees: { el: root.querySelector('.trees'), f: 0.82 },
  };
  setBg(layers.clouds.el, CLOUDS, '600px auto', 'top');
  setBg(layers.hf.el, HILLS_FAR, '800px auto', 'bottom');
  setBg(layers.hn.el, HILLS_NEAR, '600px auto', 'bottom');
  setBg(layers.trees.el, TREES, '360px auto', 'bottom');
  const dash = root.querySelector('.road-dash');
  const carEl = root.querySelector('.car');
  let wheels = [];

  function paintCar() {
    const v = vehicle(car.type, CAR_COLORS[car.color].hex);
    carEl.innerHTML = `<div class="car-body">${v.svg}</div>` + v.wheels.map((wp) =>
      `<div class="dwheel" style="left:${(wp.x / 120) * 100}%;top:${(wp.y / 64) * 100}%;width:${(wp.r * 2 / 120) * 100}%">${wheelSVG}</div>`).join('');
    wheels = [...carEl.querySelectorAll('.dwheel')];
  }
  paintCar();

  const state = { worldX: 0, vel: 0, dir: 0, wheel: 0, facing: 1, t: 0 };

  // ---- controls ----
  const setDir = (d) => { state.dir = d; root.querySelector('.ctl.left').classList.toggle('on', d < 0); root.querySelector('.ctl.right').classList.toggle('on', d > 0); };
  const lBtn = root.querySelector('.ctl.left'), rBtn = root.querySelector('.ctl.right'), hBtn = root.querySelector('.ctl.honk');
  lBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); setDir(-1); });
  rBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); setDir(1); });
  const release = () => setDir(0);
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  function honk() {
    sounds.bonus(); setTimeout(() => sounds.bonus(), 130);
    speak('Beep beep!');
    const beep = root.querySelector('.beep');
    beep.classList.remove('show'); void beep.offsetWidth; beep.classList.add('show');
    carEl.classList.remove('hop'); void carEl.offsetWidth; carEl.classList.add('hop');
  }
  hBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); honk(); });

  root.querySelector('#garage').addEventListener('pointerdown', openGarage);
  root.querySelector('#back').addEventListener('pointerdown', () => { stop(); show('home'); });

  // ---- loop ----
  let raf = null, last = 0, running = true;
  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.034, ((t - last) || 16) / 1000); last = t;
    stepDrive(state, dt);
    apply();
    raf = requestAnimationFrame(frame);
  }
  function apply() {
    layers.clouds.el.style.backgroundPositionX = `${-state.worldX * layers.clouds.f}px`;
    layers.hf.el.style.backgroundPositionX = `${-state.worldX * layers.hf.f}px`;
    layers.hn.el.style.backgroundPositionX = `${-state.worldX * layers.hn.f}px`;
    layers.trees.el.style.backgroundPositionX = `${-state.worldX * layers.trees.f}px`;
    dash.style.backgroundPositionX = `${-state.worldX}px`;
    const moving = Math.abs(state.vel) > 8;
    const bob = Math.sin(state.t * 9) * (moving ? 3 : 1.2);
    carEl.style.transform = `translateY(${bob}px) scaleX(${state.facing})`;
    wheels.forEach((w) => { w.style.transform = `translate(-50%,-50%) rotate(${state.wheel}deg)`; });
  }
  function stop() { running = false; if (raf && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(raf); window.removeEventListener('pointerup', release); window.removeEventListener('pointercancel', release); }
  if (typeof requestAnimationFrame !== 'undefined') raf = requestAnimationFrame(frame); else apply();

  // ---- garage ----
  function openGarage() {
    const ov = document.createElement('div');
    ov.className = 'garage';
    ov.innerHTML = `
      <div class="garage-card">
        <h2>🔧 My Car</h2>
        <div class="garage-row cars">${VEHICLES.map((tp) =>
          `<button class="g-car ${tp === car.type ? 'on' : ''}" data-type="${tp}">${miniCar(tp, CAR_COLORS[car.color].hex)}</button>`).join('')}</div>
        <div class="garage-row colors">${CAR_COLORS.map((c, i) =>
          `<button class="g-color ${i === car.color ? 'on' : ''}" data-color="${i}" style="background:${c.hex}"></button>`).join('')}</div>
        <button class="btn accent" id="g-done">Drive! 🚗</button>
      </div>`;
    scene.appendChild(ov);
    const refresh = () => {
      ov.querySelectorAll('.g-car').forEach((b) => { b.classList.toggle('on', b.dataset.type === car.type); b.innerHTML = miniCar(b.dataset.type, CAR_COLORS[car.color].hex); });
      ov.querySelectorAll('.g-color').forEach((b) => b.classList.toggle('on', +b.dataset.color === car.color));
      paintCar();
      if (profile) setCar(profile.id, car);
    };
    ov.querySelectorAll('.g-car').forEach((b) => b.addEventListener('pointerdown', () => { car.type = b.dataset.type; refresh(); }));
    ov.querySelectorAll('.g-color').forEach((b) => b.addEventListener('pointerdown', () => { car.color = +b.dataset.color; refresh(); }));
    ov.querySelector('#g-done').addEventListener('pointerdown', () => ov.remove());
  }

  speak('Drive your car!');
  root.__drive = { state, stepDrive: (dt) => stepDrive(state, dt), setDir, honk }; // test hook
}

function setBg(el, svg, size, anchor) {
  el.style.backgroundImage = uri(svg);
  el.style.backgroundRepeat = 'repeat-x';
  el.style.backgroundSize = size;
  el.style.backgroundPosition = `0px ${anchor}`;
}
function miniCar(type, hex) {
  const v = vehicle(type, hex);
  return `<div class="mini">${v.svg}</div>`;
}
