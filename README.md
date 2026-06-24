# 🚚 Trucks & Unicorns 🦄

A very simple, elegant learning game for ages **3–5**. Tap a big friendly card —
that's the only thing a child ever has to do. Every prompt is **spoken aloud**, so
a pre-reader can play with little to no help.

## What kids learn
The engine is a **mini-game host** — each round it picks a different game (no
immediate repeats), all sharing the scene, mascots, voice, and rewards:

**Learning-leaning** (each targets a documented preschool skill):
- **Find It** — colors & shapes recognition
- **Count the Group** — tap the group of N
- **Count Out** — tap N, one at a time (one-to-one correspondence)
- **How Many?** — see a set, tap the number (subitizing)
- **Which Has More?** — compare quantities (magnitude)
- **Tap All** — find every target among distractors
- **Odd One Out** — spot the different one
- **Sizes** — biggest / smallest
- **In Order** — tap smallest→biggest (seriation; difficulty 2+)
- **Sorting** — drop each into the matching basket (classification; difficulty 2+)
- **Pattern** — what comes next, A-B-A-B (difficulty 2+)
- **Memory Match** — flip & match pairs
- **Shadow Match** — match a shape to its silhouette (visual discrimination)
- **Connect the Dots** — tap numbers 1→N in order (number sequence; difficulty 2+)
- **Same or Different?** — compare two heroes (the same/different concept)
- **I Spy** — find the one target in a crowded field (visual search; difficulty 2+)
- **Echo** — repeat the mascot's color sequence (working memory; difficulty 3+)

**Fun-leaning** (cause-and-effect & surprise — the Toca/Sago ethos):
- **Pop!** — pop every floating bubble
- **Peekaboo** — find the hero hiding behind a cover
- **Tickle** — poke the giggling mascot N times (counting in disguise)
- **Feed Me** — feed the hungry mascot N treats (counting + caring story)

**Physics-based** (real 2D physics + "game feel" — `src/game/physics.js`):
- **Bubble Pop** — bubbles float up, sway and jostle; tap to pop with a splatter
- **Balloon Pop** — balloons rise on strings; pop every one of the named color
- **Apple Catch** — treats tumble and bounce under gravity; tap N of them
- **Ball Pit** — bouncy balls ricochet around; pop them all

**Literacy & numeracy** (ABCmouse-style — letters, phonics, tracing):
- **Letter Find** — "Find the letter B!" (letter recognition)
- **Find the Number** — "Find the number 5!" (numeral recognition)
- **Letter Match** — match uppercase to lowercase ("Find the little b!")
- **ABC Order** — tap consecutive letters in order (difficulty 2+)
- **Starting Sound** — "Which starts with B?" picture phonics (difficulty 2+)
- **Letter Pop** — pop the floating bubbles showing the named letter (physics)
- **Trace Letters / Trace Numbers** — drag along the dotted glyph to form the
  shape (`src/game/tracing.js` + `glyphs.js`); the signature ABCmouse mechanic,
  building letter/number formation and fine-motor control. No fail state.
- **Line Match** — draw a big line from each item to its match across two
  columns (letter→picture, upper→lower, number→dots). Forgiving, big swipes —
  ideal for the youngest.

### Visual polish
A polish pass pushes toward a chunky, glossy "sticker" look (RV-AppStudios
style): rainbow sticker-outlined letters, glossy gradient cards with deep
shadows, grounded mascots, and thick colorful connector lines.

### Game feel (juice)
A small custom 2D physics integrator (gravity, buoyancy, drag, bouncy walls,
soft repulsion) moves real DOM bodies, and a juice layer (`src/game/juice.js`)
adds screen shake, squash-and-stretch, and splatter on every meaningful action.
Grounded in the "Juice It or Lose It" / "Art of Screenshake" playbook. The game
picker also avoids recently-played games so the variety actually feels big.

Adding another game is just one module exporting `create(theme, count)` plus a
line in `src/game/minigames.js`. Two themes (**trucks**, **unicorns**) skin them all.

### Design basis
The mix is grounded in the **Four Pillars of learning apps** (active, engaged,
meaningful, socially interactive; Hirsh-Pasek et al., 2015) and core preschool
math (subitizing, one-to-one correspondence, seriation, classification,
comparison), balanced against the open-ended, no-fail, surprise-and-delight
philosophy of Toca Boca / Sago Mini.

## Play modes
- **Free Drive** — an open, no-fail driving sandbox with a living world. The car
  rides over **rolling hills** (a live terrain curve) and tilts to the slope,
  drives into **coins/balloons** to collect them (which feed the Prize Machine,
  with a coin HUD), and passes **animals and landmarks** that **react when you
  honk**. Endless in both directions, no obstacles — a 3-year-old can never get
  stuck. Two giant hold-to-drive arrows (◀ ▶), a honk button, and a garage (🔧)
  to change car type (car/truck/bus/race/unicorn) and color — saved per child.
- **Adventure Map** — a themed 12-stop journey per child. Each stop is a short
  level (3–5 rounds) drawn from a curated, growing pool of the mini-games. Clear
  a stop to earn 1–3 stars (by first-try accuracy) and unlock the next; the
  child's mascot rides along the path. Progress is saved per child. Gentle and
  no-fail — you always finish a stop, stars just reward doing it cleanly.
- **1 Player** — quick endless play
- **2 Players · Take Turns** — each child plays at their own difficulty
- **2 Players · Side by Side** — split screen, simultaneous, multi-touch

## Prize Machine (the reward economy)
Every correct answer earns a **coin**, and finishing a world-map stop pays a
bonus. Tap **🎁** on the home screen to open the **Prize Machine**: spend coins to
open surprise prizes and fill a **collection** (per child). It's the meta goal
that makes the rounds add up — a reason to keep playing, plus a reveal moment.

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
  you record a small vocabulary (short clips: "Find the…", colors, shapes,
  numbers, "truck/trucks", cheers, game prompts). The game stitches them into
  every prompt. **Per-word mixing:** record a few or all — each word you record
  plays in your voice in *every* prompt that uses it, anywhere in the game; words
  you haven't recorded fall back to device speech for that word only. Once every
  word in a prompt is recorded, it's fully your voice. Clips are stored on the
  device (IndexedDB), kept with persistent-storage so they survive across
  sessions, and work offline.
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
