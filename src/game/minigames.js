/* ==========================================================================
   minigames.js — the registry of mini-games + a fair picker.

   Every mini-game module exports:
     id                       unique string
     minDifficulty (optional) lowest difficulty (1..5) it should appear at
     create(theme, count) ->  { prompt:{text,speechTokens,icon}, mount(board,api), hintTarget? }

   The engine calls create(), shows the prompt, mounts the board, and reacts to
   api.progress() / api.wrong(el) / api.solved(el).
   ========================================================================== */

import * as findit from '../activities/findit.js';
import * as countgroup from '../activities/countgroup.js';
import * as countout from '../activities/countout.js';
import * as tapall from '../activities/tapall.js';
import * as oddoneout from '../activities/oddoneout.js';
import * as sizes from '../activities/sizes.js';
import * as pattern from '../activities/pattern.js';
import * as memory from '../activities/memory.js';
import * as pop from '../activities/pop.js';
import * as peekaboo from '../activities/peekaboo.js';
import * as tickle from '../activities/tickle.js';
import * as howmany from '../activities/howmany.js';
import * as whichmore from '../activities/whichmore.js';
import * as inorder from '../activities/inorder.js';
import * as sorting from '../activities/sorting.js';

export const GAMES = [
  findit, countgroup, countout, tapall, oddoneout, sizes, pattern, memory,
  pop, peekaboo, tickle, howmany, whichmore, inorder, sorting,
];

let last = null;

/** Pick a random mini-game appropriate for the difficulty, avoiding a repeat. */
export function pickGame(difficulty = 1) {
  const eligible = GAMES.filter((g) => (g.minDifficulty || 1) <= difficulty);
  const pool = eligible.length ? eligible : GAMES;
  let g;
  do {
    g = pool[Math.floor(Math.random() * pool.length)];
  } while (pool.length > 1 && g.id === last);
  last = g.id;
  return g;
}
