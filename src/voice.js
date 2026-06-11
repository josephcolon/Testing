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
    ]),
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

/* ---- Playback ---- */
let currentAudio = null;

/** Stop any in-flight recorded playback. */
export function stopVoice() {
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.pause();
    currentAudio = null;
  }
}

/**
 * Speak a prompt. `tokens` is the ordered list of vocabulary tokens; `fallback`
 * is the plain sentence for TTS. If every token is recorded, play the human
 * clips in sequence; otherwise speak the fallback with TTS.
 */
export async function speakTokens(tokens, fallback, { interrupt = true } = {}) {
  if (interrupt) { stopVoice(); }
  const usable = tokens && tokens.length && tokens.every((t) => recordedSet.has(t));
  if (!usable) {
    ttsSpeak(fallback, { interrupt });
    return;
  }
  try {
    const blobs = await Promise.all(tokens.map((t) => idbGet(t)));
    if (blobs.some((b) => !b)) { ttsSpeak(fallback, { interrupt }); return; }
    playSequence(blobs.map((b) => URL.createObjectURL(b)));
  } catch {
    ttsSpeak(fallback, { interrupt });
  }
}

function playSequence(urls) {
  stopVoice();
  let i = 0;
  const next = () => {
    if (i >= urls.length) return;
    const url = urls[i++];
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => { URL.revokeObjectURL(url); next(); };
    audio.onerror = () => { URL.revokeObjectURL(url); next(); };
    audio.play().catch(() => { next(); });
  };
  next();
}
