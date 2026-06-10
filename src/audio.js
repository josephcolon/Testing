/* ==========================================================================
   audio.js — sound effects + spoken prompts.

   SFX are synthesized with the Web Audio API (no asset files, works offline)
   and are THEMED: trucks get honks and engine rumbles, unicorns get sparkle
   arpeggios and chimes. Spoken prompts use the browser SpeechSynthesis API so
   a non-reader never needs to read a menu.

   speak() supports interrupt control: praise is allowed to finish before the
   next prompt (queued, not cancelled), and split-screen panels never cancel
   each other's speech.
   ========================================================================== */

import { getSettings } from './state.js';

let ctx = null;
function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  // Browsers suspend audio until a user gesture; resume on demand.
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Must be called from a user gesture once to unlock audio on iOS/Safari. */
export function unlockAudio() {
  const c = audioCtx();
  if (c && c.state === 'suspended') c.resume();
  // Warm up speech synthesis voice list too.
  if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
}

function tone(freq, start, dur, { type = 'sine', gain = 0.18 } = {}) {
  const c = audioCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function play(notes) {
  if (!getSettings().soundOn) return;
  notes.forEach(([freq, start, dur, opts]) => tone(freq, start, dur, opts));
}

// Gentle, non-punishing "not quite" — shared by both themes on purpose.
const softWrong = () =>
  play([[200, 0, 0.18, { type: 'sine', gain: 0.12 }], [150, 0.12, 0.2, { type: 'sine', gain: 0.1 }]]);

const SOUND_THEMES = {
  trucks: {
    // Engine blip on tap, double honk + chord on correct, horn fanfare on win.
    tap: () => play([[110, 0, 0.1, { type: 'sawtooth', gain: 0.1 }]]),
    correct: () =>
      play([
        [330, 0, 0.12, { type: 'square', gain: 0.07 }],
        [392, 0.14, 0.2, { type: 'square', gain: 0.07 }],
        [523, 0.38, 0.26, { type: 'triangle', gain: 0.14 }],
      ]),
    wrong: softWrong,
    win: () =>
      play([
        [262, 0, 0.14, { type: 'square', gain: 0.07 }],
        [330, 0.14, 0.14, { type: 'square', gain: 0.07 }],
        [392, 0.28, 0.14, { type: 'square', gain: 0.07 }],
        [523, 0.42, 0.4, { type: 'triangle', gain: 0.15 }],
      ]),
    bonus: () => play([[784, 0, 0.08, { gain: 0.1 }], [1047, 0.07, 0.18, { gain: 0.12 }]]),
  },
  unicorns: {
    // Chime on tap, sparkle arpeggio on correct, glissando on win.
    tap: () => play([[880, 0, 0.07, { type: 'triangle', gain: 0.1 }]]),
    correct: () =>
      play([
        [1047, 0, 0.1, { gain: 0.12 }],
        [1319, 0.08, 0.1, { gain: 0.12 }],
        [1568, 0.16, 0.12, { gain: 0.12 }],
        [2093, 0.26, 0.3, { gain: 0.12 }],
      ]),
    wrong: softWrong,
    win: () =>
      play([
        [784, 0, 0.1, { gain: 0.1 }], [988, 0.08, 0.1, { gain: 0.1 }],
        [1175, 0.16, 0.1, { gain: 0.1 }], [1568, 0.24, 0.12, { gain: 0.12 }],
        [1976, 0.34, 0.14, { gain: 0.12 }], [2349, 0.46, 0.34, { gain: 0.12 }],
      ]),
    bonus: () => play([[1568, 0, 0.08, { gain: 0.1 }], [2093, 0.07, 0.2, { gain: 0.12 }]]),
  },
};

/** Themed sound set for a theme id (falls back to trucks). */
export function themeSounds(themeId) {
  return SOUND_THEMES[themeId] || SOUND_THEMES.trucks;
}

/* ---- Spoken prompts ---- */

let preferredVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Prefer a clear English voice; fall back to the first available.
  preferredVoice =
    voices.find((v) => /en[-_]US/i.test(v.lang) && /female|samantha|zira|google/i.test(v.name)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    voices[0];
  return preferredVoice;
}
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = pickVoice;
}

/**
 * Speak a short prompt aloud.
 * @param {string} text
 * @param {{interrupt?: boolean}} opts  interrupt=true cancels in-flight speech;
 *   interrupt=false queues politely (lets praise finish, avoids split-screen
 *   panels cancelling each other).
 */
export function speak(text, { interrupt = true } = {}) {
  if (!getSettings().voiceOn || !('speechSynthesis' in window)) return;
  try {
    if (interrupt) window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = preferredVoice || pickVoice();
    u.rate = 0.92; // a touch slower for little ears
    u.pitch = 1.15; // friendly and bright
    u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech unavailable — sounds + visuals still carry the game */
  }
}
