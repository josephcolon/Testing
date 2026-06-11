# 🚚 Trucks & Unicorns 🦄

A very simple, elegant learning game for ages **3–5**. Tap a big friendly card —
that's the only thing a child ever has to do. Every prompt is **spoken aloud**, so
a pre-reader can play with little to no help.

## What kids learn
The engine is a **mini-game host** — each round it picks a different game (no
immediate repeats), all sharing the scene, mascots, voice, and rewards:

- **Find It** — "Find the red one!" / "Find the star!" (colors & shapes)
- **Count the Group** — "Tap three trucks!" (tap the group of N)
- **Count Out** — "Tap three trucks!" (tap N of them, one at a time)
- **Tap All** — "Tap all the red ones!" (find every target among distractors)
- **Odd One Out** — "Which one is different?"
- **Sizes** — "Tap the biggest / smallest one!"
- **Pattern** — "What comes next?" (A-B-A-B… ; difficulty 2+)
- **Memory Match** — "Find the matching pairs!" (flip & match)

Adding another game is just one module exporting `create(theme, count)` plus a
line in `src/game/minigames.js`. Two themes (**trucks**, **unicorns**) skin them all.

## Play modes
- **1 Player**
- **2 Players · Take Turns** — each child plays at their own difficulty
- **2 Players · Side by Side** — split screen, simultaneous, multi-touch

## For grown-ups
Tap the ⚙️ gear (a quick math gate keeps little fingers out) to set, **per child**:
- **Name** and **theme** (trucks/unicorns)
- **Difficulty 1–5** — controls how many choices appear on screen (2 → 6)
- Global **sound** and **voice** toggles

Profiles and settings are saved on the device (localStorage).

## Pizazz (v2)
- **Talking mascots** — **Rumble** the truck and **Stella** the unicorn greet on the
  home screen, give the prompts from a speech bubble, blink and bob, and react
  (happy on a correct tap, gently encouraging on a wrong one).
- **Illustrated animated scenes** (Sago Mini-ish) behind every screen: drifting
  clouds, a pulsing sun, rolling hills / a flowery rainbow meadow.
- **Record the voice in your own voice** — under the parent gear, a 🎙️ screen lets
  you record a small vocabulary (~40 short clips: "Find the…", colors, shapes,
  numbers, "truck/trucks", cheers). The game stitches them into every prompt and
  speaks them in your voice; anything not yet recorded falls back to device speech.
  Clips are stored on the device (IndexedDB) and work offline.
- Juicier choice cards (chunky shadow + squish), bigger first-try celebrations.

## Roadmap (next)
- **World map** with unlockable levels (a journey instead of endless rounds).
- **More mini-games** beyond find-the-answer (matching pairs, tracing, peekaboo).
- **Character creator** — original archetypes (caped hero, crown-and-gown princess,
  knight, fairy) with color/accessory choices so each kid makes "their" character.
  Note: we ship original characters only — no trademarked/licensed characters.

## Design principles (ages 3–5)
- One repeatable action (tap), huge targets, high contrast.
- Choice cards respond to `pointerdown`, not `click` — a toddler's slipping
  finger still counts as a tap.
- No reading required — prompts are spoken (with a 🔊 repeat button) and carry a
  visual cue: a color swatch, a shape icon, or a big numeral.
- **No punishment, no game-over** — a wrong tap gives a gentle bounce and
  repeats the question; the board stays open. A subtle hint appears if a child
  hesitates. First-try answers earn extra sparkle.
- Easy levels draw from primary colors and the four basic shapes only; trickier
  content (ovals, diamonds, pink-vs-purple) appears at higher difficulty.
- **Persistent sticker book** 📖 — every celebration earns a themed collectible
  sticker that lives in the child's book between sessions.
- Themed sound personalities: trucks honk and rumble, unicorns chime and sparkle.

## Run it
```bash
npm install
npm run dev      # open the printed local URL on a tablet or computer
```

Build a self-contained static site (hostable anywhere, plays offline):
```bash
npm run build    # output in dist/
npm run preview  # preview the production build
```

## Tech
Vanilla JS (ES modules) + Vite. No UI framework, **no runtime dependencies**. All
art is original inline SVG and all sound is synthesized (see
`public/assets/CREDITS.md`).
