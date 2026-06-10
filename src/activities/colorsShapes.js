/* ==========================================================================
   colorsShapes.js — generates "Find the color" and "Find the shape" rounds.

   Colors round: the theme hero (truck/unicorn) shown in several colors; tap the
     named color. Color is the only thing that varies, so it's a clean color test.
   Shapes round: several shapes in one consistent color; tap the named shape, so
     shape is the only thing that varies.

   Content is gated by board size (which is gated by difficulty): small boards
   draw from primary-ish colors and the four canonical shapes only, so a
   3-year-old is never asked "find the diamond" or to split pink from purple.
   Each round carries a visual prompt cue (color swatch / shape icon) so the
   task stays clear even if the spoken prompt is missed.
   ========================================================================== */

import { COLORS, SHAPES, EASY_COLOR_IDS, EASY_SHAPES, shapeSVG } from '../themes.js';
import { sample, shuffle } from '../game/round.js';

export function makeColorsOrShapesRound(theme, choiceCount) {
  const shapePool = choiceCount <= 3 ? EASY_SHAPES : SHAPES;
  // Shapes need enough distinct options to fill the board; fall back to colors
  // when the board is larger than the available shape set.
  const canShapes = choiceCount <= shapePool.length;
  // Slightly favor colors for the very youngest (smallest boards).
  const doColors = !canShapes || Math.random() < (choiceCount <= 2 ? 0.65 : 0.5);
  return doColors ? colorsRound(theme, choiceCount) : shapesRound(theme, choiceCount, shapePool);
}

function colorsRound(theme, choiceCount) {
  const pool = choiceCount <= 3 ? COLORS.filter((c) => EASY_COLOR_IDS.includes(c.id)) : COLORS;
  const colors = sample(pool, choiceCount);
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
    promptIcon: `<span class="swatch" style="background:${target.hex}"></span>`,
    choices,
  };
}

function shapesRound(theme, choiceCount, pool) {
  const shapes = sample(pool, choiceCount);
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
    promptIcon: `<span class="prompt-shape">${shapeSVG(target, '#ffffff')}</span>`,
    choices,
  };
}
