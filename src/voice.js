/* ==========================================================================
   voice.js — "record it in your own voice" engine.

   Prompts are dynamic ("Find the red truck", "Tap three trucks"), so instead of
   recording every sentence, a parent records a small VOCABULARY of ~40 short
   clips. The game stitches the right clips together to speak any prompt.

   Storage: clips live as audio Blobs in IndexedDB (survive reloads, work
   offline). Playback: if EVERY token in a prompt has a recorded clip, we play
   them in sequence (the warm, human path). Otherwise we fall back to the
   browser's SpeechSynthesis so nothing is ever silent.
   ========================================================================== */

import { speak as ttsSpeak } from './audio.js';
import { getSettings } from './state.js';

/* ---- The vocabulary the parent records ---- */
// Each entry: { token, label (shown), say (what to read aloud while recording) }
const group = (items) => items;

export const VOCAB_GROUPS = [
  {
    title: 'Instructions',
    items: group([
      { token: 'find_the', label: 'Find the…', say: 'Find the' },
      { token: 'tap', label: 'Tap…', say: 'Tap' },
      { token: 'try_again', label: 'Try again!', say: 'Try again!' },
    ]),
  },
  {
    title: 'Cheers (said when they get it right)',
    items: group([
      { token: 'praise_1', label: 'Cheer 1', say: 'Yay!' },
      { token: 'praise_2', label: 'Cheer 2', say: 'Great job!' },
      { token: 'praise_3', label: 'Cheer 3', say: 'Woohoo!' },
      { token: 'praise_4', label: 'Cheer 4', say: 'You did it!' },
      { token: 'reward', label: 'Sticker reward', say: 'You earned a sticker!' },
    ]),
  },
  {
    title: 'Game prompts',
    items: group([
      { token: 'tap_all', label: 'Tap all the…', say: 'Tap all the' },
      { token: 'different', label: 'Which is different?', say: 'Which one is different?' },
      { token: 'match', label: 'Match the pairs', say: 'Find the matching pairs!' },
      { token: 'biggest', label: 'Biggest', say: 'Tap the biggest one!' },
      { token: 'smallest', label: 'Smallest', say: 'Tap the smallest one!' },
      { token: 'next', label: 'What comes next?', say: 'What comes next?' },
      { token: 'pop', label: 'Pop them!', say: 'Pop them all!' },
      { token: 'peekaboo', label: 'Peekaboo!', say: 'Peekaboo! Find the hiding one!' },
      { token: 'tickle', label: 'Tickle…', say: 'Tickle them' },
      { token: 'times', label: '…times!', say: 'times!' },
      { token: 'how_many', label: 'How many?', say: 'How many?' },
      { token: 'which_more', label: 'Which has more?', say: 'Which has more?' },
      { token: 'in_order', label: 'Smallest first', say: 'Tap them in order, smallest first!' },
      { token: 'sorting', label: 'Sort into baskets', say: 'Put each one in the matching basket!' },
      { token: 'shadow', label: 'Match the shadow', say: 'Which one fits the shadow?' },
      { token: 'connect', label: 'Numbers in order', say: 'Tap the numbers in order!' },
      { token: 'same_diff', label: 'Same or different?', say: 'Are they the same?' },
      { token: 'feed', label: 'Feed them…', say: 'Feed them' },
      { token: 'treats', label: '…treats!', say: 'treats!' },
      { token: 'echo', label: 'Watch then copy', say: 'Watch, then copy!' },
      { token: 'find_letter', label: 'Find the letter…', say: 'Find the letter' },
      { token: 'find_number', label: 'Find the number…', say: 'Find the number' },
      { token: 'pop_letter', label: 'Pop the letter…', say: 'Pop the letter' },
      { token: 'starts_with', label: 'Which starts with…', say: 'Which one starts with' },
      { token: 'abc_order', label: 'Letters in order', say: 'Tap the letters in order!' },
      { token: 'trace', label: 'Trace the…', say: 'Trace the' },
    ]),
  },
  {
    title: 'Letters (A–Z) — optional',
    items: group('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((L) => ({
      token: `l_${L.toLowerCase()}`, label: L, say: L,
    }))),
  },
  {
    title: 'Colors',
    items: group(
      ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'].map((c) => ({
        token: `c_${c}`, label: c, say: c,
      }))
    ),
  },
  {
    title: 'Shapes',
    items: group(
      ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'oval'].map((s) => ({
        token: `s_${s}`, label: s, say: s,
      }))
    ),
  },
  {
    title: 'Numbers',
    items: group(
      ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'].map(
        (n, i) => ({ token: `n_${i + 1}`, label: n, say: n })
      )
    ),
  },
  {
    title: 'Characters',
    items: group([
      { token: 'truck', label: 'truck', say: 'truck' },
      { token: 'trucks', label: 'trucks', say: 'trucks' },
      { token: 'unicorn', label: 'unicorn', say: 'unicorn' },
      { token: 'unicorns', label: 'unicorns', say: 'unicorns' },
    ]),
  },
];

export const ALL_VOCAB = VOCAB_GROUPS.flatMap((g) => g.items);
export const PRAISE_TOKENS = ['praise_1', 'praise_2', 'praise_3', 'praise_4'];

/* ---- IndexedDB clip store ---- */
const DB_NAME = 'tu-voice';
const STORE = 'clips';
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('no-idb'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idbGet(token) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly').objectStore(STORE).get(token);
      tx.onsuccess = () => resolve(tx.result || null);
      tx.onerror = () => reject(tx.error);
    });
  } catch { return null; }
}

async function idbSet(token, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite').objectStore(STORE).put(blob, token);
    tx.onsuccess = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(token) {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(token);
      tx.onsuccess = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch { /* ignore */ }
}

async function idbKeys() {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly').objectStore(STORE).getAllKeys();
      tx.onsuccess = () => resolve(tx.result || []);
      tx.onerror = () => resolve([]);
    });
  } catch { return []; }
}

/* ---- Public clip API (used by the record screen) ---- */
export const saveClip = (token, blob) => idbSet(token, blob);
export const getClip = (token) => idbGet(token);
export const deleteClip = (token) => idbDelete(token);

/** Set of tokens that currently have a recording (cached for fast lookups). */
let recordedSet = new Set();
export async function refreshRecorded() {
  recordedSet = new Set(await idbKeys());
  return recordedSet;
}
export const isRecorded = (token) => recordedSet.has(token);
export const recordedCount = () => recordedSet.size;
export const hasAnyVoice = () => recordedSet.size > 0;

// token -> the word/phrase it represents, for per-word TTS of un-recorded tokens.
const SAY = Object.fromEntries(ALL_VOCAB.map((v) => [v.token, v.say]));

/**
 * Ask the browser to keep our recordings durably (so iOS/Safari is far less
 * likely to evict them). Safe to call repeatedly; ignored where unsupported.
 */
export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) await navigator.storage.persist();
  } catch { /* ignore */ }
}

/* ---- Playback ---- */
let currentAudio = null;
let playId = 0; // bumps on every new utterance so stale sequences abort

/** Stop any in-flight playback (recorded clips and speech synthesis). */
export function stopVoice() {
  playId += 1;
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

/**
 * Speak a prompt. `tokens` is the ordered list of vocabulary tokens; `fallback`
 * is the plain sentence for TTS.
 *   • No tokens recorded yet  -> speak the whole natural sentence with TTS.
 *   • Every token recorded    -> play the parent's clips back to back.
 *   • Partially recorded      -> MIX: play each recorded clip, and speak the
 *     missing words with TTS, in order. This is the key bit: once you record a
 *     word, it shows up in EVERY prompt that uses it, everywhere in the game.
 */
export async function speakTokens(tokens, fallback, { interrupt = true } = {}) {
  if (!getSettings().voiceOn) return;
  if (interrupt) stopVoice();
  if (!tokens || !tokens.length) { ttsSpeak(fallback, { interrupt }); return; }
  if (!tokens.some((t) => recordedSet.has(t))) { ttsSpeak(fallback, { interrupt }); return; }

  const myId = ++playId;
  const parts = [];
  for (const t of tokens) {
    if (recordedSet.has(t)) {
      const blob = await idbGet(t);
      if (blob) { parts.push({ type: 'audio', url: URL.createObjectURL(blob) }); continue; }
    }
    parts.push({ type: 'tts', text: SAY[t] || t });
  }
  if (myId !== playId) { parts.forEach((p) => p.url && URL.revokeObjectURL(p.url)); return; }
  playParts(parts, myId);
}

function playParts(parts, myId) {
  let i = 0;
  const next = () => {
    if (myId !== playId) { parts.slice(i).forEach((p) => p.url && URL.revokeObjectURL(p.url)); return; }
    if (i >= parts.length) return;
    const part = parts[i++];
    if (part.type === 'audio') {
      const audio = new Audio(part.url);
      currentAudio = audio;
      audio.onended = () => { URL.revokeObjectURL(part.url); next(); };
      audio.onerror = () => { URL.revokeObjectURL(part.url); next(); };
      audio.play().catch(() => { URL.revokeObjectURL(part.url); next(); });
    } else {
      if (!('speechSynthesis' in window)) { next(); return; }
      try {
        const u = new SpeechSynthesisUtterance(part.text);
        u.rate = 0.95; u.pitch = 1.1;
        u.onend = () => next();
        u.onerror = () => next();
        window.speechSynthesis.speak(u);
      } catch { next(); }
    }
  };
  next();
}
