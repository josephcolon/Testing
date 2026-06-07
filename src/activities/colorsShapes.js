/* ==========================================================================
   colorsShapes.js — generates "Find the color" and "Find the shape" rounds.

   Colors round: the theme hero (truck/unicorn) shown in several colors; tap the
     named color. Color is the only thing that varies, so it's a clean color test.
   Shapes round: several shapes in one consistent color; tap the named shape, so
     shape is the only thing that varies.
   ========================================================================== */

import { COLORS, SHAPES, shapeSVG } from '../themes.js';
import { sample, shuffle } from '../game/round.js';

export function makeColorsOrShapesRound(theme, choiceCount) {
  // Shapes need enough distinct options to fill the board; fall back to colors
  // when the board is larger than the shape set.
  const canShapes = choiceCount <= SHAPES.length;
  // Slightly favor colors for the very youngest (smallest boards).
  const doColors = !canShapes || Math.random() < (choiceCount <= 2 ? 0.65 : 0.5);
  return doColors ? colorsRound(theme, choiceCount) : shapesRound(theme, choiceCount);
}

function colorsRound(theme, choiceCount) {
  const colors = sample(COLORS, choiceCount);
  const target = colors[Math.floor(Math.random() * colors.length)];
  const choices = shuffle(
    colors.map((c) => ({
      html: theme.hero(c.hex),
      correct: c.id === target.id,
    }))
  );
  return {
    kind: 'colors',
    promptText: `Find the ${target.name} one!`,
    promptSpeech: `Find the ${target.name} ${theme.nounSingular}!`,
    swatch: target.hex,
    choices,
  };
}

function shapesRound(theme, choiceCount) {
  const shapes = sample(SHAPES, choiceCount);
  const target = shapes[Math.floor(Math.random() * shapes.length)];
  // One consistent, cheerful color so the child focuses purely on shape.
  const fill = '#6c7be0'; // calm blue-violet
  const choices = shuffle(
    shapes.map((s) => ({
      html: shapeSVG(s, fill),
      correct: s === target,
    }))
  );
  return {
    kind: 'shapes',
    promptText: `Find the ${target}!`,
    promptSpeech: `Find the ${target}!`,
    swatch: null,
    choices,
  };
}
