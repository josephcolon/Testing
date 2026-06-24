/* ==========================================================================
   drive.js — Free Drive: a deep, open, no-fail driving world.

   The car rides over rolling HILLS and travels through changing BIOMES
   (grassland → desert → snow → city → beach), each with its own sky, ground,
   hills, animals and landmarks. Drive into COINS to collect them (they feed the
   Prize Machine). Hit a RAMP to launch a jump. A DAY/NIGHT cycle drifts by.
   HONK and the animals call back ("Moo!", "Woof!"). A distance odometer tracks
   the trip. Endless in both directions, no obstacles — never gets stuck.
   ========================================================================== */

import { getProfile, getProfiles, getCar, setCar, addCoins } from '../state.js';
import { vehicle, VEHICLES, CAR_COLORS, wheelSVG } from '../game/vehicles.js';
import { themeSounds, speak } from '../audio.js';
import { burst } from '../ui/confetti.js';

export const DRIVE = { CRUISE: 360, ACCEL: 7, WHEEL_K: 0.6 };
const SP = 230, CAR_SX = 0.34, ZONE = 4200, JUMP_DUR = 0.8;

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

export function terrainFrac(wx) {
  return 0.72 - 0.055 * Math.sin(wx * 0.0016) - 0.06 * Math.sin(wx * 0.00064 + 1.7) - 0.02 * Math.sin(wx * 0.004 + 0.5);
}

/** 0 (full day) .. ~0.6 (deep night), cycling slowly with distance. */
export function nightAmount(wx) {
  return Math.max(0, Math.sin(wx * 0.00035)) * 0.6;
}

export const BIOMES = [
  { id: 'grass',  sky: ['#8fd0ff', '#d7f3ff'], ground: '#6fb84a', far: '#a7d98a', near: '#84c46a', animals: ['🐮', '🐑', '🐰', '🐦', '🐶', '🐱'], landmarks: ['🏠', '🌳', '🌷', '🌻', '🏡', '🚜'] },
  { id: 'desert', sky: ['#ffd98a', '#ffe9b8'], ground: '#e6c27a', far: '#e0b96a', near: '#d4a85a', animals: ['🐫', '🦎', '🐍', '🦂', '🐦'], landmarks: ['🌵', '⛺', '🪨', '🌵'] },
  { id: 'snow',   sky: ['#bfe3ff', '#eaf7ff'], ground: '#eef4fb', far: '#d8e8f5', near: '#c8dcec', animals: ['🐧', '🦌', '🐰', '🐻‍❄️'], landmarks: ['⛄', '🎄', '🛷', '🏠'] },
  { id: 'city',   sky: ['#9bbce6', '#cfe0f5'], ground: '#9aa2ad', far: '#b6c0cc', near: '#a6b0bc', animals: ['🐕', '🐈', '🐦', '🐀'], landmarks: ['🏢', '🏬', '🏪', '🚦', '🏨'] },
  { id: 'beach',  sky: ['#8fe0ff', '#d8f7ff'], ground: '#f2e2a8', far: '#ffe9a0', near: '#f5d98a', animals: ['🦀', '🐙', '🐠', '🐦', '🐢'], landmarks: ['🌴', '⛱️', '🏝️', '⛵'] },
];
export const biomeAt = (wx) => BIOMES[Math.floor(Math.abs(wx) / ZONE) % BIOMES.length];

const SOUND = { '🐮': 'Moo!', '🐑': 'Baa!', '🐶': 'Woof!', '🐕': 'Woof!', '🐱': 'Meow!', '🐈': 'Meow!', '🐸': 'Ribbit!', '🐦': 'Tweet!', '🦆': 'Quack!', '🐫': 'Grunt!', '🐧': 'Squawk!', '🦌': 'Snort!', '🐰': 'Boing!', '🦀': 'Snip!', '🐙': 'Bloop!', '🐠': 'Blub!', '🐢': 'Hello!', '🦎': 'Hiss!', '🐍': 'Hiss!', '🐀': 'Squeak!', '🐻‍❄️': 'Rawr!' };
const rng = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function entityFor(slot) {
  if (slot === 0) return null;
  const wx = slot * SP, b = biomeAt(wx), r = rng(slot);
  if (r < 0.30) return { slot, wx, type: 'coin', emoji: rng(slot + 9) < 0.5 ? '⭐' : '🎈' };
  if (r < 0.40) return { slot, wx, type: 'ramp', emoji: '' };
  if (r < 0.68) return { slot, wx, type: 'animal', emoji: b.animals[Math.floor(rng(slot + 3) * b.animals.length)] };
  if (r < 0.86) return { slot, wx, type: 'landmark', emoji: b.landmarks[Math.floor(rng(slot + 5) * b.landmarks.length)] };
  return null;
}

const uri = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const dk = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgb(${Math.round(((n >> 16) & 255) * a)},${Math.round(((n >> 8) & 255) * a)},${Math.round((n & 255) * a)})`; };
const lt = (hex, a) => { const n = parseInt(hex.slice(1), 16); const L = (c) => Math.round(c + (255 - c) * a); return `rgb(${L((n >> 16) & 255)},${L((n >> 8) & 255)},${L(n & 255)})`; };
const CLOUDS = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='200'><g fill='#ffffff' opacity='0.95'><ellipse cx='120' cy='70' rx='60' ry='34'/><ellipse cx='80' cy='90' rx='42' ry='26'/><ellipse cx='170' cy='92' rx='44' ry='26'/><ellipse cx='430' cy='50' rx='50' ry='28'/><ellipse cx='400' cy='66' rx='34' ry='22'/><ellipse cx='465' cy='66' rx='36' ry='22'/></g></svg>`;
const hillsSvg = (color, w, h) => {
  const hi = (color.startsWith('#') ? lt(color, 0.2) : color);
  const def = color.startsWith('#') ? `<defs><linearGradient id='hg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${hi}'/><stop offset='1' stop-color='${color}'/></linearGradient></defs>` : '';
  const fill = color.startsWith('#') ? 'url(#hg)' : color;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${def}<path d='M0 ${h} V${h * 0.62} Q${w * 0.25} ${h * 0.26} ${w * 0.5} ${h * 0.62} T${w} ${h * 0.62} V${h} Z' fill='${fill}'/></svg>`;
};

export function renderDrive({ root, show, params }) {
  const profile = getProfile(params.profileId) || getProfiles()[0];
  const car = { ...getCar(profile) };
  const sounds = themeSounds('trucks');

  root.innerHTML = `
    <div class="drive-scene">
      <div class="dlayer sky"></div>
      <div class="sun"></div>
      <div class="dlayer clouds"></div>
      <div class="dlayer hills-far"></div>
      <div class="dlayer hills-near"></div>
      <svg class="terrain"><path class="grass"/><path class="roadline"/><path class="roaddash"/></svg>
      <div class="entities"></div>
      <div class="car"></div>
      <div class="daynight"></div>
      <div class="beep">Beep beep! 📣</div>
      <div class="hud coin-hud">🪙 <b id="coincount">0</b></div>
      <div class="hud dist-hud">🏁 <b id="dist">0</b>m</div>
      <button class="iconbtn back-btn" id="back">⬅️</button>
      <button class="iconbtn" id="garage" title="Change car"
        style="position:absolute;top:var(--gap);right:var(--gap);z-index:7">🔧</button>
      <div class="drive-controls">
        <button class="ctl left" aria-label="Drive left">◀</button>
        <button class="ctl honk" aria-label="Honk">📣</button>
        <button class="ctl right" aria-label="Drive right">▶</button>
      </div>
    </div>`;

  const scene = root.querySelector('.drive-scene');
  const sky = root.querySelector('.sky');
  const clouds = root.querySelector('.clouds');
  const hf = root.querySelector('.hills-far');
  const hn = root.querySelector('.hills-near');
  const daynight = root.querySelector('.daynight');
  setBg(clouds, CLOUDS, '600px auto', 'top');
  const terrain = root.querySelector('.terrain');
  const grass = root.querySelector('.grass');
  const roadline = root.querySelector('.roadline');
  const roaddash = root.querySelector('.roaddash');
  const entityWrap = root.querySelector('.entities');
  const carEl = root.querySelector('.car');
  const coinCountEl = root.querySelector('#coincount');
  const distEl = root.querySelector('#dist');
  let wheels = [], coins = 0, curBiome = null;

  function paintCar() {
    const v = vehicle(car.type, CAR_COLORS[car.color].hex);
    carEl.innerHTML = `<div class="car-body">${v.svg}</div>` + v.wheels.map((wp) =>
      `<div class="dwheel" style="left:${(wp.x / 120) * 100}%;top:${(wp.y / 64) * 100}%;width:${(wp.r * 2 / 120) * 100}%">${wheelSVG}</div>`).join('');
    wheels = [...carEl.querySelectorAll('.dwheel')];
  }
  paintCar();

  function applyBiome(b) {
    curBiome = b.id;
    scene.style.setProperty('--grass', b.ground);
    sky.style.background = `linear-gradient(180deg, ${b.sky[0]} 0%, ${b.sky[1]} 72%)`;
    setBg(hf, hillsSvg(b.far, 800, 240), '800px auto', 'bottom');
    setBg(hn, hillsSvg(b.near, 600, 220), '600px auto', 'bottom');
  }
  applyBiome(biomeAt(0));

  const state = { worldX: 0, vel: 0, dir: 0, wheel: 0, facing: 1, t: 0, jumpT: null };
  const entities = new Map();

  const setDir = (d) => { state.dir = d; root.querySelector('.ctl.left').classList.toggle('on', d < 0); root.querySelector('.ctl.right').classList.toggle('on', d > 0); };
  root.querySelector('.ctl.left').addEventListener('pointerdown', (e) => { e.preventDefault(); setDir(-1); });
  root.querySelector('.ctl.right').addEventListener('pointerdown', (e) => { e.preventDefault(); setDir(1); });
  const release = () => setDir(0);
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  function honk() {
    sounds.bonus(); setTimeout(() => sounds.bonus(), 130);
    const beep = root.querySelector('.beep');
    beep.classList.remove('show'); void beep.offsetWidth; beep.classList.add('show');
    carEl.classList.remove('hop'); void carEl.offsetWidth; carEl.classList.add('hop');
    // Beep beep clears the road: everything in the way (animals AND obstacles
    // like trees/houses/cactus) scurries off. Coins and ramps are left alone.
    const W = scene.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
    let nearest = null, nd = 1e9;
    entities.forEach((e) => {
      if (!e || e.collected) return;
      if (e.data.type === 'coin' || e.data.type === 'ramp') return;
      const sx = CAR_SX * W + (e.data.wx - state.worldX);
      if (sx > -90 && sx < W + 220) {
        const d = Math.abs(e.data.wx - state.worldX);
        if (e.data.type === 'animal' && d < nd) { nd = d; nearest = e; }
        e.collected = true;
        e.el.style.setProperty('--flee', sx < CAR_SX * W ? '-1' : '1');
        e.el.classList.add('flee');
        setTimeout(() => { if (e.el.parentNode) e.el.remove(); }, 650);
      }
    });
    speak(nearest ? (SOUND[nearest.data.emoji] || 'Beep beep!') : 'Beep beep!');
  }
  root.querySelector('.ctl.honk').addEventListener('pointerdown', (e) => { e.preventDefault(); honk(); });
  root.querySelector('#garage').addEventListener('pointerdown', openGarage);
  root.querySelector('#back').addEventListener('pointerdown', () => { stop(); show('home'); });

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

  let raf = null, last = 0, running = true;
  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.034, ((t - last) || 16) / 1000); last = t;
    stepDrive(state, dt);
    apply(dt);
    raf = requestAnimationFrame(frame);
  }

  function apply(dt) {
    const W = scene.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const H = scene.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600);

    const b = biomeAt(state.worldX);
    if (b.id !== curBiome) applyBiome(b);
    clouds.style.backgroundPositionX = `${-state.worldX * 0.12}px`;
    hf.style.backgroundPositionX = `${-state.worldX * 0.32}px`;
    hn.style.backgroundPositionX = `${-state.worldX * 0.55}px`;
    daynight.style.opacity = nightAmount(state.worldX).toFixed(3);
    distEl.textContent = Math.floor(Math.abs(state.worldX) / 100);

    terrain.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const N = 28, pts = [];
    for (let i = 0; i <= N; i++) {
      const sx = (i / N) * W;
      pts.push([sx, terrainFrac(state.worldX + (sx - CAR_SX * W)) * H]);
    }
    const poly = pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ');
    grass.setAttribute('d', `M 0 ${H} L ${poly} L ${W} ${H} Z`);
    roadline.setAttribute('d', `M ${poly}`);
    roaddash.setAttribute('d', `M ${poly}`);
    roaddash.style.strokeDashoffset = `${-state.worldX}`;

    // jump arc
    if (state.jumpT != null) { state.jumpT += dt; if (state.jumpT >= JUMP_DUR) state.jumpT = null; }
    const lift = state.jumpT != null ? Math.sin(Math.PI * state.jumpT / JUMP_DUR) * H * 0.24 : 0;

    const surface = terrainFrac(state.worldX) * H;
    const slope = (terrainFrac(state.worldX + 40) - terrainFrac(state.worldX - 40)) * H;
    const tilt = Math.atan2(slope, 80) * (180 / Math.PI);
    const spin = state.jumpT != null ? (state.jumpT / JUMP_DUR) * 360 * state.facing : tilt;
    const moving = Math.abs(state.vel) > 8;
    const bob = Math.sin(state.t * 9) * (moving ? 2.5 : 1);
    const ch = carEl.offsetHeight || (W * 0.34 * 64 / 120);
    carEl.style.left = `${CAR_SX * W}px`;
    carEl.style.top = `${surface - ch * 0.84 + bob - lift}px`;
    carEl.style.transform = `translateX(-50%) rotate(${spin}deg) scaleX(${state.facing})`;
    wheels.forEach((w) => { w.style.transform = `translate(-50%,-50%) rotate(${state.wheel}deg)`; });

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
      entities.set(s, { data, el, collected: false, used: false });
    }
    entities.forEach((e, s) => {
      if (s < sMin - 2 || s > sMax + 2) { if (e && e.el && e.el.parentNode) e.el.remove(); entities.delete(s); return; }
      if (!e || e.collected) return;
      const sx = CAR_SX * W + (e.data.wx - state.worldX);
      const sy = terrainFrac(e.data.wx) * H;
      if (e.data.type === 'coin') {
        e.el.style.left = `${sx}px`;
        e.el.style.top = `${sy - H * 0.17 + Math.sin(state.t * 3 + s) * 6}px`;
        e.el.style.transform = 'translate(-50%,-50%)';
        if (Math.abs(e.data.wx - state.worldX) < 70) collect(e);
      } else if (e.data.type === 'ramp') {
        e.el.style.left = `${sx}px`;
        e.el.style.top = `${sy}px`;
        e.el.style.transform = 'translate(-50%,-100%)';
        if (!e.used && Math.abs(e.data.wx - state.worldX) < 55 && Math.abs(state.vel) > 60 && state.jumpT == null) {
          e.used = true; state.jumpT = 0; sounds.bonus();
          burst({ x: CAR_SX, y: 0.6, count: 26 });
        }
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
  if (typeof requestAnimationFrame !== 'undefined') raf = requestAnimationFrame(frame); else apply(0.016);

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
      ov.querySelectorAll('.g-car').forEach((b2) => { b2.classList.toggle('on', b2.dataset.type === car.type); b2.innerHTML = miniCar(b2.dataset.type, CAR_COLORS[car.color].hex); });
      ov.querySelectorAll('.g-color').forEach((b2) => b2.classList.toggle('on', +b2.dataset.color === car.color));
      paintCar();
      if (profile) setCar(profile.id, car);
    };
    ov.querySelectorAll('.g-car').forEach((b2) => b2.addEventListener('pointerdown', () => { car.type = b2.dataset.type; refresh(); }));
    ov.querySelectorAll('.g-color').forEach((b2) => b2.addEventListener('pointerdown', () => { car.color = +b2.dataset.color; refresh(); }));
    ov.querySelector('#g-done').addEventListener('pointerdown', () => ov.remove());
  }

  speak('Drive your car!');
  root.__drive = { state, tick: (dt) => { stepDrive(state, dt); apply(dt); }, setDir, honk, collected: () => coins, entities };
}

function setBg(el, svg, size, anchor) {
  el.style.backgroundImage = uri(svg);
  el.style.backgroundRepeat = 'repeat-x';
  el.style.backgroundSize = size;
  el.style.backgroundPosition = `0px ${anchor}`;
}
function miniCar(type, hex) { return `<div class="mini">${vehicle(type, hex).svg}</div>`; }
