/* ==========================================================================
   engine.js — the core game loop, shared by all three play modes.

   One engine drives a single play "panel". Modes are thin configs over it:
     • 1 Player      -> one engine, one profile
     • 2P turn-based -> one engine, two profiles, turnBased: true
     • 2P split      -> two engines side by side, one profile each

   Loop: show a spoken prompt + a board of big choice cards (count = the active
   child's difficulty). Correct tap -> celebrate + sticker + next round. Wrong
   tap -> gentle bounce + "try again", the board stays open (no game-over).
   ========================================================================== */

import { THEMES, applyThemePalette } from '../themes.js';
import { choiceCountFor } from '../state.js';
import { sfx, speak, randomPraise } from '../audio.js';
import { burst } from '../ui/confetti.js';
import { makeColorsOrShapesRound } from '../activities/colorsShapes.js';
import { makeCountingRound } from '../activities/counting.js';

const REWARD_EVERY = 5; // stickers between celebration screens
const HINT_AFTER_MS = 7000; // gently wiggle the answer if a child is stuck

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
    this.hintTimer = null;
    this.build();
    this.nextRound();
  }

  get activeProfile() {
    return this.profiles[this.activeIndex];
  }
  get activeTheme() {
    return THEMES[this.activeProfile.theme] || THEMES.trucks;
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
      <div class="prompt" title="Say it again"></div>
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
    // Tapping the prompt repeats it aloud — helps a child who missed it.
    this.elPrompt.addEventListener('click', () => {
      if (this.round) speak(this.round.promptSpeech);
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
    this.applyTheme();
    this.renderScore();

    const theme = this.activeTheme;
    const count = choiceCountFor(this.activeProfile);
    // Alternate between colors/shapes and counting for variety.
    const useCounting = Math.random() < 0.5;
    this.round = useCounting
      ? makeCountingRound(theme, count)
      : makeColorsOrShapesRound(theme, count);

    // Prompt (with optional color swatch) + speak it.
    this.elPrompt.innerHTML =
      (this.round.swatch ? `<span class="swatch" style="background:${this.round.swatch}"></span>` : '') +
      `<span>${this.round.promptText}</span>`;
    speak(this.round.promptSpeech);

    // Board layout: tidy columns for the chosen number of cards.
    const n = this.round.choices.length;
    const cols = n === 4 ? 2 : n <= 3 ? n : 3;
    this.elChoices.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    this.elChoices.innerHTML = '';
    this.round.choices.forEach((choice) => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.innerHTML = choice.html;
      btn.addEventListener('click', () => this.onChoice(btn, choice));
      this.elChoices.appendChild(btn);
    });

    // Gentle hint if the child hesitates — keeps the experience frustration-free.
    this.hintTimer = setTimeout(() => {
      const idx = this.round.choices.findIndex((c) => c.correct);
      const node = this.elChoices.children[idx];
      if (node && !this.locked) node.classList.add('hint');
    }, HINT_AFTER_MS);
  }

  onChoice(btn, choice) {
    if (this.locked) return;
    sfx.tap();
    if (choice.correct) {
      this.onCorrect(btn);
    } else {
      // No punishment: bounce, soft sound, dim the wrong card, keep playing.
      btn.classList.add('wrong');
      sfx.wrong();
      speak('Try again');
      setTimeout(() => btn.classList.remove('wrong'), 400);
      btn.classList.add('dim');
    }
  }

  onCorrect(btn) {
    this.locked = true;
    clearTimeout(this.hintTimer);
    btn.classList.remove('hint');
    btn.classList.add('correct');
    sfx.correct();
    speak(randomPraise());

    // Confetti from the tapped card's position.
    const r = btn.getBoundingClientRect();
    burst({ x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight, count: 60 });

    const id = this.activeProfile.id;
    this.scores[id] += 1;
    this.renderScore();

    const reachedReward = this.scores[id] % REWARD_EVERY === 0;
    setTimeout(() => {
      if (reachedReward) {
        this.showReward(() => this.advanceTurnAndNext());
      } else {
        this.advanceTurnAndNext();
      }
    }, 750);
  }

  advanceTurnAndNext() {
    if (this.turnBased) this.activeIndex = (this.activeIndex + 1) % this.profiles.length;
    this.nextRound();
  }

  showReward(done) {
    const theme = this.activeTheme;
    sfx.win();
    burst({ x: 0.5, y: 0.4, count: 160 });
    speak('Wow! Amazing!');
    const overlay = document.createElement('div');
    overlay.className = 'reward';
    overlay.innerHTML = `
      <div class="big-sticker">${theme.sticker}</div>
      <div class="cheer">Amazing!</div>
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
