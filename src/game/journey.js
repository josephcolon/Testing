/* ==========================================================================
   journey.js — the world-map stop list.

   12 stops. Each stop is a short "level" of a few rounds drawn from a curated
   pool of mini-games. The pool grows as the journey goes on so new games are
   introduced gradually (the engine still filters by the child's difficulty and
   avoids immediate repeats). The child's parent-set difficulty controls how hard
   each round is; the journey controls variety, pacing, and the sense of a trip.
   ========================================================================== */

import { JOURNEY_STOPS } from '../state.js';

// Games unlocked by the time you reach each tier (cumulative).
const TIERS = [
  ['pop', 'bubblepop', 'ballpit', 'findit', 'peekaboo', 'tickle', 'countgroup', 'letterfind', 'numberfind', 'traceletters', 'linematch'], // stops 1-3
  ['tapall', 'howmany', 'feedme', 'balloonpop', 'applecatch', 'sizes', 'letterpop', 'tracenumbers', 'lettermatch'],          // stops 4-6
  ['whichmore', 'memory', 'shadowmatch', 'sameordifferent', 'countout', 'oddoneout', 'startingsound', 'abcorder'],           // stops 7-9
  ['sorting', 'pattern', 'inorder', 'connectdots', 'ispy', 'echo'],                                                          // stops 10-12
];

function poolForStop(n) {
  const tier = Math.min(TIERS.length, Math.ceil(n / 3)); // 1..4
  const pool = [];
  for (let t = 0; t < tier; t++) pool.push(...TIERS[t]);
  return pool;
}

/** Build the ordered list of stops. */
export function buildStops() {
  const stops = [];
  for (let n = 1; n <= JOURNEY_STOPS; n++) {
    stops.push({
      n,
      rounds: n <= 3 ? 3 : n <= 9 ? 4 : 5,
      pool: poolForStop(n),
      last: n === JOURNEY_STOPS,
    });
  }
  return stops;
}

export const STOPS = buildStops();
export const getStop = (n) => STOPS.find((s) => s.n === n);
