/* ==========================================================================
   drive.js — Free Drive: an open, no-fail side-scrolling sandbox with depth.

   The car rides over rolling HILLS (the ground is a live terrain curve), drives
   through a world of roadside ANIMALS and LANDMARKS that react when you honk,
   and drives into floating COINS/BALLOONS to collect them (which feed the Prize
   Machine). Endless in both directions, no obstacles — a 3-year-old can never
   get stuck. Controls: two giant hold-to-drive arrows + a honk button.
   ========================================================================== */

import { getProfile, getProfiles, getCar, setCar, addCoins } from '../state.js';
import { vehicle, VEHICLES, CAR_COLORS, wheelSVG } from '../game/vehicles.js';
import { themeSounds, speak } from '../audio.js';
import { burst } from '../ui/confetti.js';

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

/** Ground surface height as a fraction of scene height (smaller = higher hill). */
export function terrainFrac(wx) {
  return 0.72 - 0.055 * Math.sin(wx * 0.0016) - 0.06 * Math.sin(wx * 0.00064 + 1.7) - 0.02 * Math.sin(wx * 0.004 + 0.5);
}

const SP = 230; // world px between procedural entity slots
const CAR_SX = 0.34; // car horizontal position (fraction of width)
const ANIMALS = ['🐮', '🐑', '🐰', '🐦', '🐸', '🐶', '🐱', '🦆'];
const LANDMARKS = ['🏠', '⛽', '🌳', '🚦', '🌷', '🏡', '🌻', '🪧'];
const rng = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function entityFor(slot) {
  if (slot === 0) return null;
  const wx = slot * SP;
  const r = rng(slot);
  if (r < 0.34) return { slot, wx, type: 'coin', emoji: rng(slot + 9) < 0.5 ? '⭐' : '🎈' };
  if (r < 0.66) return { slot, wx, type: 'animal', emoji: ANIMALS[Math.floor(rng(slot + 3) * ANIMALS.length)] };
  if (r < 0.84) return { slot, wx, type: 'landmark', emoji: LANDMARKS[Math.floor(rng(slot + 5) * LANDMARKS.length)] };
  return null;
}

const uri = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const CLOUDS = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='200'><g fill='#ffffff' opacity='0.92'><ellipse cx='120' cy='70' rx='60' ry='34'/><ellipse cx='80' cy='90' rx='42' ry='26'/><ellipse cx='170' cy='92' rx='44' ry='26'/><ellipse cx='430' cy='50' rx='50' ry='28'/><ellipse cx='400' cy='66' rx='34' ry='22'/><ellipse cx='465' cy='66' rx='36' ry='22'/></g></svg>`;
const HILLS_FAR = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='240'><path d='M0 240 V150 Q200 60 400 150 T800 150 V240 Z' fill='#a7d98a'/></svg>`;
const HILLS_NEAR = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='220'><path d='M0 220 V140 Q150 70 300 140 T600 140 V220 Z' fill='#84c46a'/></svg>`;
const SVGNS = 'http://www.w3.org/2000/svg';

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
      <svg class="terrain"><path class="grass"/><path class="roadline"/><path class="roaddash"/></svg>
      <div class="entities"></div>
      <div class="car"></div>
      <div class="beep">Beep beep! 📣</div>
      <div class="coin-hud">🪙 <b id="coincount">0</b></div>
      <button class="iconbtn back-btn" id="back">⬅️</button>
      <button class="iconbtn" id="garage" title="Change car"
        style="position:absolute;top:var(--gap);right:calc(var(--gap)*2 + clamp(60px,16vw,120px));z-index:5">🔧</button>
      <div class="drive-controls">
        <button class="ctl left" aria-label="Drive left">◀</button>
        <button class="ctl honk" aria-label="Honk">📣</button>
        <button class="ctl right" aria-label="Drive right">▶</button>
      </div>
    </div>`;

  const scene = root.querySelector('.drive-scene');
  const clouds = root.querySelector('.clouds');
  const hf = root.querySelector('.hills-far');
  const hn = root.querySelector('.hills-near');
  setBg(clouds, CLOUDS, '600px auto', 'top');
  setBg(hf, HILLS_FAR, '800px auto', 'bottom');
  setBg(hn, HILLS_NEAR, '600px auto', 'bottom');
  const terrain = root.querySelector('.terrain');
  const grass = root.querySelector('.grass');
  const roadline = root.querySelector('.roadline');
  const roaddash = root.querySelector('.roaddash');
  const entityWrap = root.querySelector('.entities');
  const carEl = root.querySelector('.car');
  const coinCountEl = root.querySelector('#coincount');
  let wheels = [];
  let coins = 0;

  function paintCar() {
    const v = vehicle(car.type, CAR_COLORS[car.color].hex);
    carEl.innerHTML = `<div class="car-body">${v.svg}</div>` + v.wheels.map((wp) =>
      `<div class="dwheel" style="left:${(wp.x / 120) * 100}%;top:${(wp.y / 64) * 100}%;width:${(wp.r * 2 / 120) * 100}%">${wheelSVG}</div>`).join('');
    wheels = [...carEl.querySelectorAll('.dwheel')];
  }
  paintCar();

  const state = { worldX: 0, vel: 0, dir: 0, wheel: 0, facing: 1, t: 0 };
  const entities = new Map(); // slot -> {data, el, collected}

  // ---- controls ----
  const setDir = (d) => { state.dir = d; root.querySelector('.ctl.left').classList.toggle('on', d < 0); root.querySelector('.ctl.right').classList.toggle('on', d > 0); };
  root.querySelector('.ctl.left').addEventListener('pointerdown', (e) => { e.preventDefault(); setDir(-1); });
  root.querySelector('.ctl.right').addEventListener('pointerdown', (e) => { e.preventDefault(); setDir(1); });
  const release = () => setDir(0);
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  function honk() {
    sounds.bonus(); setTimeout(() => sounds.bonus(), 130);
    speak('Beep beep!');
    const beep = root.querySelector('.beep');
    beep.classList.remove('show'); void beep.offsetWidth; beep.classList.add('show');
    carEl.classList.remove('hop'); void carEl.offsetWidth; carEl.classList.add('hop');
    // Nearby animals react.
    const W = scene.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
    entities.forEach((e) => {
      if (!e || e.data.type !== 'animal') return;
      const sx = CAR_SX * W + (e.data.wx - state.worldX);
      if (sx > -40 && sx < W + 40) { e.el.classList.remove('react'); void e.el.offsetWidth; e.el.classList.add('react'); }
    });
  }
  root.querySelector('.ctl.honk').addEventListener('pointerdown', (e) => { e.preventDefault(); honk(); });
  root.querySelector('#garage').addEventListener('pointerdown', openGarage);
  root.querySelector('#back').addEventListener('pointerdown', () => { stop(); show('home'); });

  // ---- collect ----
  function collect(e) {
    e.collected = true;
    coins += 1; coinCountEl.textContent = coins;
    if (profile) addCoins(profile.id, 1);
    sounds.bonus();
    const r = e.el.getBoundingClientRect();
    const w = window.innerWidth || 1, h = window.innerHeight || 1;
    if (r.width) burst({ x: (r.left + r.width / 2) / w, y: (r.top + r.height / 2) / h, count: 16 });
    e.el.classList.add('collected');
    setTimeout(() => { if (e.el.parentNode) e.el.remove(); }, 350);
  }

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
    const W = scene.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const H = scene.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600);
    clouds.style.backgroundPositionX = `${-state.worldX * 0.12}px`;
    hf.style.backgroundPositionX = `${-state.worldX * 0.32}px`;
    hn.style.backgroundPositionX = `${-state.worldX * 0.55}px`;

    // --- terrain curve under and around the car ---
    terrain.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const N = 28, pts = [];
    for (let i = 0; i <= N; i++) {
      const sx = (i / N) * W;
      const wx = state.worldX + (sx - CAR_SX * W);
      pts.push([sx, terrainFrac(wx) * H]);
    }
    const poly = pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ');
    grass.setAttribute('d', `M 0 ${H} L ${poly} L ${W} ${H} Z`);
    roadline.setAttribute('d', `M ${poly}`);
    roaddash.setAttribute('d', `M ${poly}`);
    roaddash.style.strokeDashoffset = `${-state.worldX}`;

    // --- car follows the surface + tilts to the slope ---
    const surface = terrainFrac(state.worldX) * H;
    const slope = (terrainFrac(state.worldX + 40) - terrainFrac(state.worldX - 40)) * H;
    const tilt = Math.atan2(slope, 80) * (180 / Math.PI);
    const moving = Math.abs(state.vel) > 8;
    const bob = Math.sin(state.t * 9) * (moving ? 2.5 : 1);
    const ch = carEl.offsetHeight || (W * 0.34 * 64 / 120);
    carEl.style.left = `${CAR_SX * W}px`;
    carEl.style.top = `${surface - ch * 0.84 + bob}px`;
    carEl.style.transform = `translateX(-50%) rotate(${tilt}deg) scaleX(${state.facing})`;
    wheels.forEach((w) => { w.style.transform = `translate(-50%,-50%) rotate(${state.wheel}deg)`; });

    // --- procedural entities (recycle the DOM) ---
    const sMin = Math.floor((state.worldX - W * 0.7) / SP);
    const sMax = Math.ceil((state.worldX + W * 1.1) / SP);
    for (let s = sMin; s <= sMax; s++) {
      if (entities.has(s)) continue;
      const data = entityFor(s);
      if (!data) { entities.set(s, null); continue; }
      const el = document.createElement('div');
      el.className = 'dentity ' + data.type;
      el.textContent = data.emoji;
      entityWrap.appendChild(el);
      entities.set(s, { data, el, collected: false });
    }
    entities.forEach((e, s) => {
      if (s < sMin - 2 || s > sMax + 2) {
        if (e && e.el && e.el.parentNode) e.el.remove();
        entities.delete(s);
        return;
      }
      if (!e || e.collected) return;
      const sx = CAR_SX * W + (e.data.wx - state.worldX);
      const sy = terrainFrac(e.data.wx) * H;
      if (e.data.type === 'coin') {
        e.el.style.left = `${sx}px`;
        e.el.style.top = `${sy - H * 0.17 + Math.sin(state.t * 3 + s) * 6}px`;
        e.el.style.transform = 'translate(-50%,-50%)';
        if (Math.abs(e.data.wx - state.worldX) < 70) collect(e);
      } else {
        e.el.style.left = `${sx}px`;
        e.el.style.top = `${sy}px`;
        e.el.style.transform = 'translate(-50%,-96%)';
      }
    });
  }

  function stop() {
    running = false;
    if (raf && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(raf);
    window.removeEventListener('pointerup', release);
    window.removeEventListener('pointercancel', release);
  }
  if (typeof requestAnimationFrame !== 'undefined') raf = requestAnimationFrame(frame); else apply();

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
  root.__drive = { state, tick: (dt) => { stepDrive(state, dt); apply(); }, setDir, honk, collected: () => coins, entities };
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
