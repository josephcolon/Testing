# Asset Credits & Licensing

This game is fully self-contained and works offline. We deliberately avoided
external image/audio downloads so it loads instantly and has zero licensing
ambiguity.

## Art
- **All sprites (trucks, unicorns, shapes) are original inline SVG** authored for
  this project in `src/themes.js`. They are released under **CC0 / public domain** —
  free to use, modify, and redistribute.

## Sound
- **All sound effects are synthesized at runtime** with the Web Audio API
  (`src/audio.js`) — no audio files, no licensing required.
- **Spoken prompts** use the browser's built-in SpeechSynthesis voices (provided
  by the operating system).

## Confetti
- **Celebration confetti** is an original, dependency-free canvas effect in
  `src/ui/confetti.js`.

> Note: the build environment blocked common CC0 asset hosts (kenney.nl,
> opengameart.org, freesound.org). The original-SVG + synthesized-audio approach
> keeps the game high quality, offline-capable, and unambiguously licensed. Custom
> illustrations or recorded audio can be dropped into `public/assets/` and wired in
> later without changing the game logic.
