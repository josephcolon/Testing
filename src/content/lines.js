/* ==========================================================================
   lines.js — single catalog of every user-facing spoken/prompt line.

   Maps a stable snake_case ID -> { text, file } where `file` is the path to the
   pre-recorded voiceover (vo/<id>.mp3). Nothing plays these mp3s yet; this is
   the content source of truth for the VO pipeline + `recording-script.md`.

   ID scheme: atom IDs (colors c_*, shapes s_*, letters l_a..l_z, numbers n_*,
   nouns, instruction stems, cheers) intentionally MATCH the voice-token
   vocabulary in voice.js, so mini-game `speechTokens` arrays already reference
   these IDs. Full UI/celebration lines use readable IDs.

   Dynamic prompts (e.g. "Find the red truck") are assembled at runtime from
   these atoms via speechTokens — that is why every letter, digit, color, shape
   and noun has its own entry.
   ========================================================================== */

const map = (obj) => Object.entries(obj).map(([id, text]) => ({ id, text }));
const each = (arr, fn) => arr.map(fn);

export const GROUPS = [
  {
    category: 'UI & Navigation',
    items: map({
      ui_lets_play: "Let's play!",
      greet_rumble: "Hi! I'm Rumble!",
      greet_stella: "Hi! I'm Stella!",
      ui_who_is_playing: 'Who is playing?',
      ui_pick_two: 'Pick two players!',
      map_go_rumble: "Let's go, Rumble!",
      map_go_stella: "Let's go, Stella!",
      ui_next_stop: 'Great job! On to the next stop!',
      ui_stickers: 'Look at all your stickers!',
      ui_open_prize: 'Open a prize!',
      ui_new_prize: 'A new prize!',
      ui_got_prize: 'You got a prize!',
      drive_start: 'Drive your car!',
      honk_beep: 'Beep beep!',
    }),
  },
  {
    category: 'Feedback',
    items: map({
      try_again: 'Try again!',
      your_turn: 'your turn!',
      reward: 'You earned a sticker!',
    }),
  },
  {
    category: 'Cheers (correct answer)',
    items: map({
      praise_1: 'Yay!',
      praise_2: 'Great job!',
      praise_3: 'Woohoo!',
      praise_4: 'You did it!',
    }),
  },
  {
    category: 'Praise — Rumble (trucks)',
    items: map({
      praise_trucks_1: 'Honk honk! Great job!',
      praise_trucks_2: 'Beep beep! You got it!',
      praise_trucks_3: 'Great driving!',
      praise_trucks_4: 'Vroom! Amazing!',
      praise_trucks_5: 'Awesome, driver!',
    }),
  },
  {
    category: 'Praise — Stella (unicorns)',
    items: map({
      praise_unicorns_1: 'Magical!',
      praise_unicorns_2: 'Sparkly! Great job!',
      praise_unicorns_3: 'Unicorn magic!',
      praise_unicorns_4: 'Amazing! So sparkly!',
      praise_unicorns_5: 'You got it!',
    }),
  },
  {
    category: 'Game instructions',
    items: map({
      find_the: 'Find the',
      tap: 'Tap',
      tap_all: 'Tap all the',
      find_letter: 'Find the letter',
      find_number: 'Find the number',
      pop_letter: 'Pop the letter',
      starts_with: 'Which one starts with',
      feed: 'Feed them',
      tickle: 'Tickle them',
      trace: 'Trace the',
      times: 'times!',
      treats: 'treats!',
      how_many: 'How many?',
      which_more: 'Which has more?',
      different: 'Which one is different?',
      next: 'What comes next?',
      match: 'Find the matching pairs!',
      biggest: 'Tap the biggest one!',
      smallest: 'Tap the smallest one!',
      pop: 'Pop them all!',
      peekaboo: 'Peekaboo! Find the hiding one!',
      in_order: 'Tap them in order, smallest first!',
      sorting: 'Put each one in the matching basket!',
      shadow: 'Which one fits the shadow?',
      connect: 'Tap the numbers in order!',
      same_diff: 'Are they the same?',
      echo: 'Watch, then copy!',
      abc_order: 'Tap the letters in order!',
      prompt_pop_bubbles: 'Pop all the bubbles!',
      prompt_pop_balls: 'Pop all the balls!',
      prompt_smallest_first: 'Tap them, smallest first!',
      prompt_match_up: 'Match them up!',
    }),
  },
  {
    category: 'Colors',
    items: each(['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'], (c) => ({ id: `c_${c}`, text: c })),
  },
  {
    category: 'Shapes',
    items: each(['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'oval'], (s) => ({ id: `s_${s}`, text: s })),
  },
  {
    category: 'Letters (A–Z)',
    items: each('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), (L) => ({ id: `l_${L.toLowerCase()}`, text: L })),
  },
  {
    category: 'Numbers (0–10)',
    items: each(['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'], (word, i) => ({ id: `n_${i}`, text: word })),
  },
  {
    category: 'Characters',
    items: map({ truck: 'truck', trucks: 'trucks', unicorn: 'unicorn', unicorns: 'unicorns' }),
  },
  {
    category: 'Animal sounds (Free Drive)',
    items: map({
      sound_moo: 'Moo!', sound_baa: 'Baa!', sound_woof: 'Woof!', sound_meow: 'Meow!',
      sound_ribbit: 'Ribbit!', sound_tweet: 'Tweet!', sound_quack: 'Quack!', sound_grunt: 'Grunt!',
      sound_squawk: 'Squawk!', sound_snort: 'Snort!', sound_boing: 'Boing!', sound_snip: 'Snip!',
      sound_bloop: 'Bloop!', sound_blub: 'Blub!', sound_hello: 'Hello!', sound_hiss: 'Hiss!',
      sound_squeak: 'Squeak!', sound_rawr: 'Rawr!',
    }),
  },
];

/** { [id]: { text, file } } — the catalog. */
export const LINES = Object.fromEntries(
  GROUPS.flatMap((g) => g.items.map(({ id, text }) => [id, { text, file: `vo/${id}.mp3` }]))
);

/** Text for a line ID (falls back to the ID itself if unknown). */
export const line = (id) => (LINES[id] ? LINES[id].text : id);

/** VO file path for a line ID. */
export const lineFile = (id) => (LINES[id] ? LINES[id].file : null);
