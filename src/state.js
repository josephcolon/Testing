/* ==========================================================================
   state.js — kid profiles + global settings, persisted to localStorage.

   A "profile" is one child: a name, a theme (trucks/unicorns) and a difficulty
   (1..5) that the parent sets behind the parent gate. Difficulty maps to how
   many choices appear on screen — the agreed difficulty dial.
   ========================================================================== */

const KEY = 'trucks-unicorns/v1';

// difficulty 1..5  ->  number of choice cards on screen
export const CHOICE_COUNT = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5];

const uid = () => Math.random().toString(36).slice(2, 9);

function defaultState() {
  return {
    profiles: [
      { id: uid(), name: 'Buddy', theme: 'trucks', difficulty: 1, stickers: [] },
      { id: uid(), name: 'Star', theme: 'unicorns', difficulty: 3, stickers: [] },
    ],
    settings: { soundOn: true, voiceOn: true },
  };
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // Merge with defaults so missing keys never crash older saves.
    const profiles = (parsed.profiles?.length ? parsed.profiles : defaultState().profiles)
      .map((p) => ({ stickers: [], ...p }));
    return {
      profiles,
      settings: { soundOn: true, voiceOn: true, ...(parsed.settings || {}) },
    };
  } catch {
    return defaultState();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / storage full — game still works for this session */
  }
}

export function getProfiles() {
  return state.profiles;
}

export function getProfile(id) {
  return state.profiles.find((p) => p.id === id);
}

export function updateProfile(id, patch) {
  const p = getProfile(id);
  if (p) Object.assign(p, patch);
  save();
  return p;
}

export function addProfile() {
  const p = { id: uid(), name: 'New', theme: 'trucks', difficulty: 1, stickers: [] };
  state.profiles.push(p);
  save();
  return p;
}

/** Add a collectible sticker to a child's persistent sticker book. */
export function addSticker(profileId, emoji) {
  const p = getProfile(profileId);
  if (!p) return;
  p.stickers = p.stickers || [];
  p.stickers.push(emoji);
  if (p.stickers.length > 500) p.stickers = p.stickers.slice(-500); // sane cap
  save();
}

export function removeProfile(id) {
  if (state.profiles.length <= 1) return; // always keep at least one player
  state.profiles = state.profiles.filter((p) => p.id !== id);
  save();
}

export function getSettings() {
  return state.settings;
}

export function updateSettings(patch) {
  Object.assign(state.settings, patch);
  save();
}

export function choiceCountFor(profile) {
  return CHOICE_COUNT[profile?.difficulty] ?? 3;
}
