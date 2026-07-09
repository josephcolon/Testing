# Trucks & Unicorns — Project Rules

## What this is
A pre-K learning game for two kids: a truck-loving son and a unicorn-loving daughter. Quality bar: Khan Academy Kids. Warm, alive, never punishing.

## Art direction
- Palette (use ONLY these): define 6 named tokens — sky, ground, sunshine, berry (unicorn accent), rust (truck accent), cloud (neutral light). Derive all colors from tokens in one tokens.css file.
- Shape language: rounded everything, 2.5px consistent stroke weight on SVG art, no sharp corners, chunky proportions (big heads, small bodies).
- Type: "Baloo 2" for display, system-ui for body. Minimum tap target 64px.
- Two mascots anchor everything: RUSTY (a friendly dump truck) and STELLA (a unicorn). They introduce games, react to answers, and celebrate.

## Interaction rules (the Juice Checklist — every interactive element must pass)
1. Press: scales to 0.92 with a soft "thock" sound.
2. Release/success: springs back with overshoot (scale 1.06 → 1.0).
3. Correct answer: element bounces, sparkle particles, cheerful SFX, mascot celebrates.
4. Wrong answer: element wiggles gently side-to-side (never red X, never sad sound), mascot encourages, and after 2 misses the correct answer pulses softly; after 3 misses, demonstrate the answer then re-ask.
5. Screen transitions: never hard cuts — use a 300ms iris or slide.
6. Nothing on screen is ever fully static: idle elements breathe, blink, or sway subtly.
7. Respect prefers-reduced-motion.

## Audio rules
- All voice lines come from pre-recorded audio files via the AudioManager (Phase 1). speechSynthesis is fallback ONLY.
- Music bed ducks to 30% volume when a voice line plays.
- Every tap makes a sound; correct/incorrect/reward each have distinct SFX families.

## Learning design rules
- Every question logs {skill, itemId, correct} to the active profile.
- Games read a difficulty level (1-3) from the mastery engine — never hardcode difficulty.
- Errors are scaffolded (see Juice Checklist #4), never punished. No timers, no lives, no failure states.

## Engineering rules
- No new frameworks. Vanilla + the approved libs: howler, gsap, @rive-app/canvas.
- All user-facing strings live in src/content/lines.js with stable IDs — never inline them.
- Keep modules small; one game per file. Update ARCHITECTURE.md when structure changes.
