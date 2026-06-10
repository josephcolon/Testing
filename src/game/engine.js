/* ==========================================================================
   engine.js — the core game loop, shared by all three play modes.

   One engine drives a single play "panel". Modes are thin configs over it:
     • 1 Player      -> one engine, one profile
     • 2P turn-based -> one engine, two profiles, turnBased: true
     • 2P split      -> two engines side by side, one profile each

   Loop: show a spoken prompt + a board of big choice cards (count = the active
   child's difficulty). Correct tap -> celebrate + sticker + next round. Wrong
   tap -> gentle bounce + "try again" with the prompt repeated, the board stays
   open (no game-over).

   Toddler-input notes: choice cards listen on pointerdown (not click) because
   young children's taps slip a few pixels, which suppresses click events.
   Speech notes: praise is allowed to finish (the next prompt queues instead of
   cancelling), and split-screen panels never cancel each other's speech.
   ========================================================================== */

import { THEMES, applyThemePalette } from '../themes.js';
import { choiceCountFor, addSticker } from '../state.js';
import { themeSounds, speak } from '../audio.js';
import { burst } from '../ui/confetti.js';
import { makeColorsOrShapesRound } from '../activities/colorsShapes.js';
import { makeCountingRound } from '../activities/counting.js';

const REWARD_EVERY = 5; // stickers between celebration screens
const HINT_AFTER_MS = 7000; // gently wiggle the answer if a child is stuck
const randomFrom = (a) => a[Math.floor(Math.random() * a.length)];

export class GameEngine {
  /**
   * @param {Object} cfg
   * @param {HTMLElement} cfg.root      panel element to render into
   * @param {Array}  cfg.profiles       1 profile (single/split) or 2 (turn-based)
   * @param {boolean} cfg.turnBased     alternate profiles after each correct answer
   * @param {boolean} cfg.split         true when running inside a split panel
   * @param {Function} cfg.onExit       called when the back button is pressed
   */
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
    this.announceTurn = turnBased; // say whose turn it is, starting with round 1
    this.build();
    this.nextRound();
  }

  get activeProfile() {
    return this.profiles[this.activeIndex];
  }
  get activeTheme() {
    return THEMES[this.activeProfile.theme] || THEMES.trucks;
  }
  get sfx() {
    return themeSounds(this.activeTheme.id);
  }

  /** Panel-aware speech: split panels always queue so they never cancel each other. */
  say(text, urgent = false) {
    speak(text, { interrupt: urgent && !this.split });
  }

  build() {
    this.root.classList.add('panel');
    if (this.split) this.root.classList.add('split');
    this.root.innerHTML = `
      <div class="topbar">
        <button class="iconbtn back" title="Back">⬅️</button>
        <div class="turn-banner" hidden></div>
        <div class="scoreboard"></div>
      </div>
      <div class="prompt-row">
        <button class="iconbtn say-again" title="Say it again">🔊</button>
        <div class="prompt"></div>
      </div>
      <div class="choices"></div>
    `;
    this.elBanner = this.root.querySelector('.turn-banner');
    this.elScore = this.root.querySelector('.scoreboard');
    this.elPrompt = this.root.querySelector('.prompt');
    this.elChoices = this.root.querySelector('.choices');

    this.root.querySelector('.back').addEventListener('click', () => {
      this.destroy();
      this.onExit?.();
    });
    // Big obvious repeat button — pre-readers can always hear the task again.
    this.root.querySelector('.say-again').addEventListener('pointerdown', () => {
      if (this.round) this.say(this.round.promptSpeech, true);
    });
    this.elPrompt.addEventListener('pointerdown', () => {
      if (this.round) this.say(this.round.promptSpeech, true);
    });
  }

  applyTheme() {
    const theme = this.activeTheme;
    if (this.split) {
      applyThemePalette(theme, this.root);
      this.root.style.background = `linear-gradient(160deg, ${theme.bg[0]}, ${theme.bg[1]})`;
    } else {
      applyThemePalette(theme, document.body);
      document.body.style.background = `linear-gradient(160deg, ${theme.bg[0]}, ${theme.bg[1]})`;
    }
  }

  renderScore() {
    const theme = this.activeTheme;
    if (this.turnBased) {
      // Show both children's tallies.
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

    const theme = this.activeTheme;
    const count = choiceCountFor(this.activeProfile);
    // Alternate between colors/shapes and counting for variety.
    const useCounting = Math.random() < 0.5;
    this.round = useCounting
      ? makeCountingRound(theme, count)
      : makeColorsOrShapesRound(theme, count);

    // Prompt with its visual cue (swatch / shape icon / numeral), spoken aloud.
    this.elPrompt.innerHTML =
      (this.round.promptIcon || '') + `<span>${this.round.promptText}</span>`;
    let speech = this.round.promptSpeech;
    if (this.announceTurn) {
      speech = `${this.activeProfile.name}, your turn! ${speech}`;
      this.announceTurn = false;
    }
    // Queued (not urgent) so it never clips the praise that precedes it.
    this.say(speech, false);

    // Board layout: explicit rows so the grid can never overflow a short
    // phone-landscape panel.
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
      // pointerdown, not click: a toddler's slipping finger still counts.
      btn.addEventListener('pointerdown', () => this.onChoice(btn, choice));
      this.elChoices.appendChild(btn);
    });

    this.armHint();
  }

  /** Gentle hint if the child hesitates — keeps the experience frustration-free. */
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
      // No punishment: bounce, soft sound, dim the wrong card, keep playing.
      this.firstTry = false;
      btn.classList.add('wrong');
      this.sfx.wrong();
      // Re-anchor the task — a 3-year-old has likely forgotten the question.
      this.say(`Try again! ${this.round.promptSpeech}`, true);
      setTimeout(() => btn.classList.remove('wrong'), 400);
      btn.classList.add('dim');
      this.armHint(); // hint counts from the last interaction
    }
  }

  onCorrect(btn) {
    this.locked = true;
    clearTimeout(this.hintTimer);
    btn.classList.remove('hint');
    btn.classList.add('correct');
    this.sfx.correct();
    if (this.firstTry) this.sfx.bonus(); // extra sparkle for a first-try answer
    this.say(randomFrom(this.activeTheme.praise), true);

    // Confetti from the tapped card's position — bigger for a first-try answer.
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
    // Long enough to let the pop animation land and the praise be heard.
    setTimeout(() => {
      if (reachedReward) {
        this.showReward(() => this.advanceTurnAndNext());
      } else {
        this.advanceTurnAndNext();
      }
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
    // Earn a real, persistent sticker for the child's sticker book.
    const sticker = randomFrom(theme.stickerSet);
    addSticker(this.activeProfile.id, sticker);

    this.sfx.win();
    burst({ x: 0.5, y: 0.4, count: 160 });
    this.say('You earned a sticker!', true);
    const overlay = document.createElement('div');
    overlay.className = 'reward';
    overlay.innerHTML = `
      <div class="big-sticker">${sticker}</div>
      <div class="cheer">A sticker for your book!</div>
    `;
    this.root.appendChild(overlay);
    setTimeout(() => {
      overlay.remove();
      done();
    }, 2200);
  }

  destroy() {
    clearTimeout(this.hintTimer);
    this.root.innerHTML = '';
    this.root.className = '';
    this.root.style.background = '';
  }
}
