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
import * as shadowmatch from '../activities/shadowmatch.js';
import * as connectdots from '../activities/connectdots.js';
import * as sameordifferent from '../activities/sameordifferent.js';
import * as feedme from '../activities/feedme.js';
import * as echo from '../activities/echo.js';
import * as ispy from '../activities/ispy.js';
import * as bubblepop from '../activities/bubblepop.js';
import * as balloonpop from '../activities/balloonpop.js';
import * as applecatch from '../activities/applecatch.js';
import * as ballpit from '../activities/ballpit.js';
import * as letterfind from '../activities/letterfind.js';
import * as numberfind from '../activities/numberfind.js';
import * as lettermatch from '../activities/lettermatch.js';
import * as abcorder from '../activities/abcorder.js';
import * as startingsound from '../activities/startingsound.js';
import * as letterpop from '../activities/letterpop.js';
import * as traceletters from '../activities/traceletters.js';
import * as tracenumbers from '../activities/tracenumbers.js';
import * as linematch from '../activities/linematch.js';

export const GAMES = [
  findit, countgroup, countout, tapall, oddoneout, sizes, pattern, memory,
  pop, peekaboo, tickle, howmany, whichmore, inorder, sorting,
  shadowmatch, connectdots, sameordifferent, feedme, echo, ispy,
  bubblepop, balloonpop, applecatch, ballpit,
  letterfind, numberfind, lettermatch, abcorder, startingsound, letterpop,
  traceletters, tracenumbers, linematch,
];

// Remember the last few picks so the same game doesn't keep coming back —
// this is what makes the variety actually *feel* big.
const recent = [];

/**
 * Pick a random mini-game appropriate for the difficulty, avoiding recent repeats.
 * @param {number} difficulty
 * @param {string[]} [poolIds] optional whitelist of game ids (e.g. a map stop)
 */
export function pickGame(difficulty = 1, poolIds = null) {
  let eligible = GAMES.filter((g) => (g.minDifficulty || 1) <= difficulty);
  if (poolIds && poolIds.length) {
    const scoped = eligible.filter((g) => poolIds.includes(g.id));
    if (scoped.length) eligible = scoped; // fall back to all-eligible if pool empties out
  }
  const pool = eligible.length ? eligible : GAMES;
  // Avoid the last few games, but never the whole pool.
  const memory = Math.min(recent.length, Math.max(0, Math.min(4, pool.length - 1)));
  const avoid = new Set(recent.slice(-memory));
  let fresh = pool.filter((g) => !avoid.has(g.id));
  if (!fresh.length) fresh = pool;
  const g = fresh[Math.floor(Math.random() * fresh.length)];
  recent.push(g.id);
  if (recent.length > 6) recent.shift();
  return g;
}
