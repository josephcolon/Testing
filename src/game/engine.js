/* ==========================================================================
   engine.js — the core game loop / mini-game host, shared by all three modes.

   The engine owns everything around a round — the illustrated scene, the
   talking mascot, the speech bubble, scoring, sticker rewards, confetti, sound,
   and the recorded/synthesised voice. The actual round is delegated to a
   MINI-GAME (see ../activities/* and ./minigames.js), which renders its own
   board and reports back through a small API:

     api.progress()       a partial step went right (one of several targets)
     api.wrong(el, opts)  a wrong tap (opts.dim=false to not grey it out)
     api.solved(el)       the round is complete (el = card to celebrate on)

   Modes are thin configs: 1 player, 2-player turn-based, 2-player split.
   Choice cards fire on pointerdown so a toddler's slipping tap still registers.
   ========================================================================== */

import { THEMES, applyThemePalette } from '../themes.js';
import { choiceCountFor, addSticker } from '../state.js';
import { themeSounds } from '../audio.js';
import { speakTokens, PRAISE_TOKENS } from '../voice.js';
import { mascotSVG } from '../mascots.js';
import { sceneHTML } from '../ui/scene.js';
import { burst } from '../ui/confetti.js';
import { pickGame } from './minigames.js';
import { screenShake, squish } from './juice.js';

const REWARD_EVERY = 5; // stickers between celebration screens
const HINT_AFTER_MS = 7000; // gently wiggle the answer if a child is stuck
const randomFrom = (a) => a[Math.floor(Math.random() * a.length)];

export class GameEngine {
  constructor({ root, profiles, turnBased = false, split = false, onExit, level = null }) {
    this.root = root;
    this.profiles = profiles;
    this.turnBased = turnBased;
    this.split = split;
    this.onExit = onExit;
    this.level = level; // { index, rounds, gamePool, onComplete } for a map stop
    this.activeIndex = 0;
    this.scores = Object.fromEntries(profiles.map((p) => [p.id, 0]));
    this.roundsDone = 0;
    this.levelFirstTry = 0;
    this.locked = false;
    this.firstTry = true;
    this.hintTimer = null;
    this.announceTurn = turnBased;
    this.build();
    this.nextRound();
  }

  get activeProfile() { return this.profiles[this.activeIndex]; }
  get activeTheme() { return THEMES[this.activeProfile.theme] || THEMES.trucks; }
  get sfx() { return themeSounds(this.activeTheme.id); }
  get prompt() { return this.game?.prompt; }

  say(tokens, fallback, urgent = false) {
    speakTokens(tokens, fallback, { interrupt: urgent && !this.split });
  }

  build() {
    this.root.classList.add('panel');
    if (this.split) this.root.classList.add('split');
    this.root.innerHTML = `
      <div class="scene-holder"></div>
      <div class="topbar">
        <button class="iconbtn back" title="Back">⬅️</button>
        <div class="turn-banner" hidden></div>
        <div class="scoreboard"></div>
      </div>
      <div class="stage">
        <div class="mascot" title="Say it again"></div>
        <div class="speech">
          <button class="iconbtn say-again" title="Say it again">🔊</button>
          <div class="prompt"></div>
        </div>
      </div>
      <div class="choices"></div>
    `;
    this.elScene = this.root.querySelector('.scene-holder');
    this.elBanner = this.root.querySelector('.turn-banner');
    this.elScore = this.root.querySelector('.scoreboard');
    this.elMascot = this.root.querySelector('.mascot');
    this.elPrompt = this.root.querySelector('.prompt');
    this.elChoices = this.root.querySelector('.choices');

    this.root.querySelector('.back').addEventListener('click', () => {
      this.destroy();
      this.onExit?.();
    });
    const repeat = () => this.prompt && this.say(this.prompt.speechTokens, this.prompt.text, true);
    this.root.querySelector('.say-again').addEventListener('pointerdown', repeat);
    this.elMascot.addEventListener('pointerdown', repeat);
  }

  setMascot(mood, anim) {
    this.elMascot.innerHTML = mascotSVG(this.activeTheme.id, mood);
    this.elMascot.className = 'mascot';
    void this.elMascot.offsetWidth;
    if (anim) this.elMascot.classList.add('anim-' + anim);
  }

  applyTheme() {
    const theme = this.activeTheme;
    const target = this.split ? this.root : document.body;
    applyThemePalette(theme, target);
    const bg = `linear-gradient(160deg, ${theme.bg[0]}, ${theme.bg[1]})`;
    if (this.split) this.root.style.background = bg;
    else document.body.style.background = bg;
    this.elScene.innerHTML = sceneHTML(theme.id);
  }

  renderScore() {
    const theme = this.activeTheme;
    if (this.level) {
      // Map stop: show the stop number and progress pips.
      const pips = Array.from({ length: this.level.rounds }, (_, i) =>
        `<span class="pip ${i < this.roundsDone ? 'on' : ''}">●</span>`).join('');
      this.elBanner.hidden = false;
      this.elBanner.innerHTML = `${theme.emoji} Stop ${this.level.index}`;
      this.elScore.innerHTML = `<span class="pips">${pips}</span>`;
      return;
    }
    if (this.turnBased) {
      this.elScore.innerHTML = this.profiles
        .map((p) => {
          const t = THEMES[p.theme];
          return `<span class="stickers">${t.sticker}${this.scores[p.id]}</span>`;
        })
        .join('<span style="opacity:.6">·</span>');
      this.elBanner.hidden = false;
      this.elBanner.innerHTML = `${theme.emoji} ${this.activeProfile.name}'s turn`;
    } else {
      this.elScore.innerHTML = `<span class="stickers">${theme.sticker} ${this.scores[this.activeProfile.id]}</span>`;
      this.elBanner.hidden = true;
    }
  }

  nextRound() {
    clearTimeout(this.hintTimer);
    this.game?.teardown?.(); // stop any physics loop from the previous round
    this.locked = false;
    this.firstTry = true;
    this.applyTheme();
    this.renderScore();
    this.setMascot('idle');

    const theme = this.activeTheme;
    const count = choiceCountFor(this.activeProfile);
    const game = pickGame(this.activeProfile.difficulty || 1, this.level?.gamePool);
    this.game = game.create(theme, count);

    const p = this.game.prompt;
    this.elPrompt.innerHTML = (p.icon || '') + `<span>${p.text}</span>`;

    if (this.announceTurn) {
      this.say(null, `${this.activeProfile.name}, your turn!`, false);
      this.announceTurn = false;
    }
    this.say(p.speechTokens, p.text, false);

    // Each mini-game owns its board layout; fully reset it between rounds
    // (inline styles, classes, and any data-* a previous game left behind).
    this.elChoices.style.cssText = '';
    this.elChoices.className = 'choices';
    Object.keys(this.elChoices.dataset).forEach((k) => delete this.elChoices.dataset[k]);
    this.game.mount(this.elChoices, {
      theme,
      choiceCount: count,
      progress: () => this.onProgress(),
      wrong: (el, opts) => this.onWrong(el, opts),
      solved: (el) => this.onSolved(el),
    });

    this.armHint();
  }

  armHint() {
    clearTimeout(this.hintTimer);
    if (!this.game.hintTarget) return;
    this.hintTimer = setTimeout(() => {
      const node = this.game.hintTarget();
      if (node && !this.locked) node.classList.add('hint');
    }, HINT_AFTER_MS);
  }

  onProgress() {
    if (this.locked) return;
    this.sfx.bonus();
    this.setMascot('happy', 'bounce');
    screenShake('sm');
    this.armHint();
  }

  onWrong(el, { dim = true } = {}) {
    if (this.locked) return;
    this.firstTry = false;
    if (el) {
      el.classList.add('wrong');
      setTimeout(() => el.classList.remove('wrong'), 400);
      if (dim) el.classList.add('dim');
    }
    this.sfx.wrong();
    this.setMascot('oops', 'shake');
    screenShake('sm');
    const p = this.game.prompt;
    this.say(['try_again', ...p.speechTokens], `Try again! ${p.text}`, true);
    this.armHint();
  }

  onSolved(el) {
    if (this.locked) return;
    this.locked = true;
    clearTimeout(this.hintTimer);
    if (el) { el.classList.remove('hint'); el.classList.add('correct'); squish(el); }
    this.sfx.correct();
    if (this.firstTry) this.sfx.bonus();
    this.setMascot('happy', 'bounce');
    screenShake(this.firstTry ? 'lg' : 'sm');
    this.say([randomFrom(PRAISE_TOKENS)], randomFrom(this.activeTheme.praise), true);

    const rect = el ? el.getBoundingClientRect() : null;
    burst({
      x: rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5,
      y: rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.4,
      count: this.firstTry ? 110 : 70,
    });

    const id = this.activeProfile.id;
    this.scores[id] += 1;
    if (this.level) {
      this.roundsDone += 1;
      if (this.firstTry) this.levelFirstTry += 1;
    }
    this.renderScore();

    // In a map stop, finish the level once its rounds are done.
    if (this.level && this.roundsDone >= this.level.rounds) {
      setTimeout(() => this.finishLevel(), 1100);
      return;
    }

    const reachedReward = this.scores[id] % REWARD_EVERY === 0;
    setTimeout(() => {
      if (reachedReward) this.showReward(() => this.advanceTurnAndNext());
      else this.advanceTurnAndNext();
    }, 1100);
  }

  finishLevel() {
    const theme = this.activeTheme;
    const r = this.level.rounds;
    const ft = this.levelFirstTry;
    const stars = ft >= r ? 3 : ft >= Math.ceil(r / 2) ? 2 : 1;
    addSticker(this.activeProfile.id, randomFrom(theme.stickerSet));
    this.sfx.win();
    burst({ x: 0.5, y: 0.4, count: 200 });
    this.say(['reward'], 'You earned a sticker!', true);

    const overlay = document.createElement('div');
    overlay.className = 'reward level-done';
    overlay.innerHTML = `
      <div class="stars">${[1, 2, 3].map((i) => `<span class="star ${i <= stars ? 'on' : ''}" style="--i:${i}">★</span>`).join('')}</div>
      <div class="cheer">${this.level.last ? 'You finished the adventure!' : 'Stop complete!'}</div>
    `;
    this.root.appendChild(overlay);
    setTimeout(() => {
      overlay.remove();
      this.destroy();
      this.level.onComplete?.({ stars });
    }, 2600);
  }

  advanceTurnAndNext() {
    if (this.turnBased) {
      this.activeIndex = (this.activeIndex + 1) % this.profiles.length;
      this.announceTurn = true;
    }
    this.nextRound();
  }

  showReward(done) {
    const theme = this.activeTheme;
    const sticker = randomFrom(theme.stickerSet);
    addSticker(this.activeProfile.id, sticker);

    this.sfx.win();
    this.setMascot('happy', 'bounce');
    burst({ x: 0.5, y: 0.4, count: 160 });
    this.say(['reward'], 'You earned a sticker!', true);
    const overlay = document.createElement('div');
    overlay.className = 'reward';
    overlay.innerHTML = `
      <div class="big-sticker">${sticker}</div>
      <div class="cheer">A sticker for your book!</div>
    `;
    this.root.appendChild(overlay);
    setTimeout(() => { overlay.remove(); done(); }, 2200);
  }

  destroy() {
    clearTimeout(this.hintTimer);
    this.game?.teardown?.();
    this.root.innerHTML = '';
    this.root.className = '';
    this.root.style.background = '';
  }
}
