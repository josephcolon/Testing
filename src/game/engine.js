/* ==========================================================================
   engine.js — the core game loop, shared by all three play modes.

   One engine drives a single play "panel". Modes are thin configs over it:
     • 1 Player      -> one engine, one profile
     • 2P turn-based -> one engine, two profiles, turnBased: true
     • 2P split      -> two engines side by side, one profile each

   The panel has an illustrated animated SCENE behind it and a talking MASCOT
   who gives the prompt from a speech bubble and reacts to answers (happy on a
   correct tap, gently encouraging on a wrong one). Prompts play in the parent's
   recorded voice when available, otherwise fall back to speech synthesis.

   Toddler-input notes: choice cards listen on pointerdown (not click) because
   young children's taps slip a few pixels, which suppresses click events.
   ========================================================================== */

import { THEMES, applyThemePalette } from '../themes.js';
import { choiceCountFor, addSticker } from '../state.js';
import { themeSounds } from '../audio.js';
import { speakTokens, PRAISE_TOKENS } from '../voice.js';
import { mascotSVG } from '../mascots.js';
import { sceneHTML } from '../ui/scene.js';
import { burst } from '../ui/confetti.js';
import { makeColorsOrShapesRound } from '../activities/colorsShapes.js';
import { makeCountingRound } from '../activities/counting.js';

const REWARD_EVERY = 5; // stickers between celebration screens
const HINT_AFTER_MS = 7000; // gently wiggle the answer if a child is stuck
const randomFrom = (a) => a[Math.floor(Math.random() * a.length)];

export class GameEngine {
  constructor({ root, profiles, turnBased = false, split = false, onExit }) {
    this.root = root;
    this.profiles = profiles;
    this.turnBased = turnBased;
    this.split = split;
    this.onExit = onExit;
    this.activeIndex = 0;
    this.scores = Object.fromEntries(profiles.map((p) => [p.id, 0]));
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

  /** Speak prompt tokens; split panels queue so they never cancel each other. */
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
    const repeat = () => this.round && this.say(this.round.speechTokens, this.round.promptSpeech, true);
    this.root.querySelector('.say-again').addEventListener('pointerdown', repeat);
    this.elMascot.addEventListener('pointerdown', repeat);
  }

  setMascot(mood, anim) {
    this.elMascot.innerHTML = mascotSVG(this.activeTheme.id, mood);
    this.elMascot.className = 'mascot' + (anim ? ' anim-' + anim : '');
    // Restart the animation cleanly.
    void this.elMascot.offsetWidth;
    if (anim) this.elMascot.classList.add('anim-' + anim);
  }

  applyTheme() {
    const theme = this.activeTheme;
    const target = this.split ? this.root : document.body;
    applyThemePalette(theme, target);
    if (this.split) {
      this.root.style.background = `linear-gradient(160deg, ${theme.bg[0]}, ${theme.bg[1]})`;
    } else {
      document.body.style.background = `linear-gradient(160deg, ${theme.bg[0]}, ${theme.bg[1]})`;
    }
    this.elScene.innerHTML = sceneHTML(theme.id);
  }

  renderScore() {
    const theme = this.activeTheme;
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
    this.locked = false;
    this.firstTry = true;
    this.applyTheme();
    this.renderScore();
    this.setMascot('idle');

    const theme = this.activeTheme;
    const count = choiceCountFor(this.activeProfile);
    const useCounting = Math.random() < 0.5;
    this.round = useCounting
      ? makeCountingRound(theme, count)
      : makeColorsOrShapesRound(theme, count);

    this.elPrompt.innerHTML =
      (this.round.promptIcon || '') + `<span>${this.round.promptText}</span>`;

    // Voice: announce the active child by name on turn change (TTS — names
    // aren't in the recorded vocabulary), then the prompt.
    if (this.announceTurn) {
      this.say(null, `${this.activeProfile.name}, your turn!`, false);
      this.announceTurn = false;
    }
    this.say(this.round.speechTokens, this.round.promptSpeech, false);

    const n = this.round.choices.length;
    const cols = n === 4 ? 2 : n <= 3 ? n : 3;
    const rows = Math.ceil(n / cols);
    this.elChoices.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    this.elChoices.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
    this.elChoices.innerHTML = '';
    this.round.choices.forEach((choice) => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.innerHTML = choice.html;
      btn.addEventListener('pointerdown', () => this.onChoice(btn, choice));
      this.elChoices.appendChild(btn);
    });

    this.armHint();
  }

  armHint() {
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => {
      const idx = this.round.choices.findIndex((c) => c.correct);
      const node = this.elChoices.children[idx];
      if (node && !this.locked) node.classList.add('hint');
    }, HINT_AFTER_MS);
  }

  onChoice(btn, choice) {
    if (this.locked || btn.classList.contains('dim')) return;
    this.sfx.tap();
    if (choice.correct) {
      this.onCorrect(btn);
    } else {
      this.firstTry = false;
      btn.classList.add('wrong');
      this.sfx.wrong();
      this.setMascot('oops', 'shake');
      // Re-anchor the task: "Try again!" + repeat the prompt.
      this.say(['try_again', ...this.round.speechTokens], `Try again! ${this.round.promptSpeech}`, true);
      setTimeout(() => btn.classList.remove('wrong'), 400);
      btn.classList.add('dim');
      this.armHint();
    }
  }

  onCorrect(btn) {
    this.locked = true;
    clearTimeout(this.hintTimer);
    btn.classList.remove('hint');
    btn.classList.add('correct');
    this.sfx.correct();
    if (this.firstTry) this.sfx.bonus();
    this.setMascot('happy', 'bounce');

    const praiseTok = randomFrom(PRAISE_TOKENS);
    this.say([praiseTok], randomFrom(this.activeTheme.praise), true);

    const r = btn.getBoundingClientRect();
    burst({
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + r.height / 2) / window.innerHeight,
      count: this.firstTry ? 110 : 60,
    });

    const id = this.activeProfile.id;
    this.scores[id] += 1;
    this.renderScore();

    const reachedReward = this.scores[id] % REWARD_EVERY === 0;
    setTimeout(() => {
      if (reachedReward) this.showReward(() => this.advanceTurnAndNext());
      else this.advanceTurnAndNext();
    }, 1100);
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
    this.root.innerHTML = '';
    this.root.className = '';
    this.root.style.background = '';
  }
}
