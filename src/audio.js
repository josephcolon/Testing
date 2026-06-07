/* ==========================================================================
   audio.js — sound effects + spoken prompts.

   SFX are synthesized with the Web Audio API (no asset files, works offline).
   Spoken prompts use the browser SpeechSynthesis API so a non-reader never
   needs to read a menu. Both respect the global sound/voice settings.
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

// A little musical vocabulary of feedback sounds.
export const sfx = {
  tap:   () => play([[440, 0, 0.08, { type: 'triangle', gain: 0.12 }]]),
  correct: () =>
    play([
      [523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.18], [1047, 0.32, 0.28],
    ]),
  wrong: () =>
    play([[200, 0, 0.18, { type: 'sine', gain: 0.12 }], [150, 0.12, 0.2, { type: 'sine', gain: 0.1 }]]),
  win: () =>
    play([
      [523, 0, 0.14], [659, 0.14, 0.14], [784, 0.28, 0.14],
      [1047, 0.42, 0.18], [784, 0.6, 0.12], [1047, 0.72, 0.36],
    ]),
};

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

/** Speak a short prompt aloud (cancels any in-flight speech). */
export function speak(text) {
  if (!getSettings().voiceOn || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
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

// Cheerful praise lines spoken on a correct answer.
const PRAISE = ['Yay!', 'Great job!', 'You got it!', 'Awesome!', 'Woohoo!', 'Perfect!'];
export const randomPraise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];
