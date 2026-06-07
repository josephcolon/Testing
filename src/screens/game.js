/* ==========================================================================
   game.js — wires the chosen mode to one or two GameEngine instances.
   ========================================================================== */

import { GameEngine } from '../game/engine.js';

export function renderGame({ root, show, params }) {
  const { mode, players } = params;
  const engines = [];
  const exit = () => {
    engines.forEach((e) => e.destroy());
    show('home');
  };

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
