# 🚚 Trucks & Unicorns 🦄

A very simple, elegant learning game for ages **3–5**. Tap a big friendly card —
that's the only thing a child ever has to do. Every prompt is **spoken aloud**, so
a pre-reader can play with little to no help.

## What kids learn
- **Colors & Shapes** — "Find the red one!", "Find the star!"
- **Counting** — "Tap three trucks!"

Two themes skin the identical game: **trucks** and **unicorns**.

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

## Design principles (ages 3–5)
- One repeatable action (tap), huge targets, high contrast.
- No reading required — prompts are spoken; tap the prompt to hear it again.
- **No punishment, no game-over** — a wrong tap gives a gentle bounce and "try
  again"; the board stays open. A subtle hint appears if a child hesitates.
- A sticker every round, and a confetti celebration every few stickers.

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
