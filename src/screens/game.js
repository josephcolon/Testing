/* ==========================================================================
   game.js — wires the chosen mode to one or two GameEngine instances.
   ========================================================================== */

import { GameEngine } from '../game/engine.js';
import { recordStopResult } from '../state.js';

export function renderGame({ root, show, params }) {
  const { mode, players, stop } = params;
  const engines = [];
  const exit = () => {
    engines.forEach((e) => e.destroy());
    show('home');
  };

  if (mode.kind === 'journey') {
    // A world-map stop: one child, a fixed number of rounds from the stop's
    // curated pool. On completion, save stars and return to the map.
    const profile = players[0];
    const panel = document.createElement('div');
    root.appendChild(panel);
    engines.push(new GameEngine({
      root: panel,
      profiles: [profile],
      onExit: () => { engines.forEach((e) => e.destroy()); show('map', { profileId: profile.id }); },
      level: {
        index: stop.n,
        rounds: stop.rounds,
        gamePool: stop.pool,
        last: stop.last,
        onComplete: ({ stars }) => {
          recordStopResult(profile.id, stop.n, stars);
          show('map', { profileId: profile.id, justFinished: stop.n });
        },
      },
    }));
    return;
  }

  if (mode.kind === 'split') {
    // Two independent panels, one child each, simultaneous play.
    root.classList.add('split-mode');
    players.slice(0, 2).forEach((p) => {
      const panel = document.createElement('div');
      root.appendChild(panel);
      engines.push(new GameEngine({ root: panel, profiles: [p], split: true, onExit: exit }));
    });
  } else if (mode.kind === 'turns') {
    // One panel, two children take turns at their own difficulty.
    const panel = document.createElement('div');
    root.appendChild(panel);
    engines.push(new GameEngine({ root: panel, profiles: players.slice(0, 2), turnBased: true, onExit: exit }));
  } else {
    // Solo.
    const panel = document.createElement('div');
    root.appendChild(panel);
    engines.push(new GameEngine({ root: panel, profiles: [players[0]], onExit: exit }));
  }
}
