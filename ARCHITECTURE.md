# ARCHITECTURE.md

Context file for AI coding sessions. Factual reference for the "Trucks & Unicorns" kids game (ages 3–5). Vanilla JS ES modules + Vite, no runtime deps, no backend, fully offline after load. Deployed via GitHub Pages workflow (`.github/workflows/deploy.yml`) on push to `claude/kids-game-trucks-unicorns-xqGub` (the default branch).

## 1. Screen router

`src/main.js`. No library. Screens are functions registered in a literal:

```js
const screens = { home, pick, gate, settings, game, stickers, record, map, prizes, drive };
app.show(name, params) // clears #app (className + innerHTML + body background), calls screens[name]({ root, show, params })
```

- `root` = `document.getElementById('app')`. Every screen renders by setting `root.innerHTML` and attaching listeners. No history/back-stack; back buttons call `show('home')` explicitly. No transition animations between screens (rounds inside the game fade via `.entering`).
- Navigation flows: home → `pick` (profile select) → `game` (modes solo/turns/split), or `pick` → `map` (mode journey) → `game` (kind `journey`), or `pick` → `drive`. Gear → `gate` (parent gate: solve `a+b`) → `settings`. Home 📖 → `stickers`, 🎁 → `prizes`.
- `main.js` boot side effects: `refreshRecorded()` + `requestPersistence()` (voice), one-time `pointerdown` listener → `unlockAudio()`.
- Kid-facing controls use `pointerdown` (toddler finger-slip suppresses `click`); parent-facing (gate, settings) use `click`.

## 2. Game engine + mini-games

`src/game/engine.js` — `GameEngine({root, profiles, turnBased, split, onExit, level})`. One engine per panel; modes are configs (`src/screens/game.js`): solo = 1 engine/1 profile, turns = 1 engine/2 profiles alternating, split = 2 engines side-by-side, journey = 1 engine with `level: {index, rounds, gamePool, last, onComplete}`.

Engine owns: scene background (`ui/scene.js`), mascot (`mascots.js`, moods idle/happy/oops/wave), speech bubble + prompt, scoring, coins (+1/solve via `addCoins`), stickers (every `REWARD_EVERY=5` solves), hints (wiggle correct target after `HINT_AFTER_MS=7000`), juice (`game/juice.js`: `screenShake`, `squish`), confetti (`ui/confetti.js`), voice (`say(tokens, fallback, urgent)` → `voice.speakTokens`; split panels never interrupt each other).

Pacing (engine): same mini-game repeats 2–3 rounds before switching (`gameRoundsLeft`); each new round mounts with `.entering` class + `pointerEvents:'none'` + `locked=true` for `ENTER_PAUSE_MS=650` (anti-mistap). Board fully reset between rounds (innerHTML, style, class, `data-*`), `game.teardown?.()` called (stops physics RAF loops).

Mini-game contract (`src/game/minigames.js` registry, 34 games):

```js
export const id = '...'; export const minDifficulty = N; // optional, 1..5
export function create(theme, choiceCount) => {
  prompt: { text, speechTokens[], icon },   // icon = emoji or HTML snippet
  mount(boardEl, api),                       // api.progress() | api.wrong(el, {dim}) | api.solved(el)
  teardown()?,                               // optional (physics/timers)
  hintTarget()?                              // element to wiggle as hint
}
```

`pickGame(difficulty, poolIds?)` filters by `minDifficulty`, optional whitelist (journey stop pools), avoids last ≤4 picked ids (`recent` ring, max 6).

Shared helpers: `game/round.js` (`layoutGrid` → centered square cards via `.grid-cards` + `--card`/`--cols`/`--rows` CSS vars; `choiceButton` → `.choice` button, `data-target` marks correct, pointerdown handler; shuffle/sample/distinctInts/NUMBER_WORDS), `game/single.js` `makeSingle(prompt, items)` for one-correct-card games, `game/physics.js` (custom 2D: gravity/buoyancy/drag/sway/wall+floor bounce/repel; speed clamp 1500, spin opt-in per body + damped/clamped ±5; `createWorld(container,cfg)`, `world.step(dt)` headless-testable, `makeBody`), `game/tracing.js` `makeTrace(glyph, prompt)` (fat polyline track, free-drag fill, tolerance `max(34, S*0.17)` px, lookahead 14 samples, per-stroke; `surface._waypoints` test hook), `game/glyphs.js` (stroke skeletons A–Z, 0–9), `game/letters.js` (LETTERS, PHONICS emoji map, `letterToken(L)`='l_a'…).

| file (src/activities/) | type | skill | completion |
|---|---|---|---|
| findit.js | single-choice | color/shape recognition | tap correct → solved |
| countgroup.js | single-choice | cardinality (pick group of N) | tap correct group |
| countout.js | multi-tap | 1:1 counting (tap N of many) | Nth tap → solved; each tap progress |
| tapall.js | multi-tap | visual scan, find all targets | last target → solved |
| oddoneout.js | single-choice | same/different discrimination | tap odd one |
| sizes.js | single-choice | size comparison (big/small) | tap extreme |
| pattern.js (d2+) | single-choice | A-B pattern completion | tap next color |
| memory.js | flip-pairs | working memory | all pairs matched (`.mcard`, `data-pair`) |
| pop.js | multi-tap | cause/effect fun | all popped |
| peekaboo.js | reveal | object permanence | open cover with hider |
| tickle.js | repeat-tap | 1:1 counting (fun) | N taps on mascot |
| howmany.js | single-choice | subitizing | tap numeral matching set |
| whichmore.js | single-choice | magnitude comparison | tap larger group |
| inorder.js (d2+) | ordered-tap | seriation | tap smallest→largest (`data-order`) |
| sorting.js (d2+) | per-item route | classification by color | route each item to `.basket[data-color]` |
| shadowmatch.js | single-choice | silhouette matching | tap shape matching shadow |
| connectdots.js (d2+) | ordered-tap | number sequence 1..N | tap in order (`data-order`) |
| sameordifferent.js | binary choice | same/different concept | tap Same or Different |
| feedme.js | multi-tap | counting + nurture narrative | feed N treats |
| echo.js (d3+) | sequence recall | working memory (Simon) | repeat pad sequence (`board.dataset.seq`; 🔁 replay button; wrong = restart+replay) |
| ispy.js (d2+) | single-choice in crowd | visual search | tap the one target |
| bubblepop.js | physics multi-tap | fun (buoyancy) | pop all bubbles |
| balloonpop.js | physics selective | color + inhibition | pop all target-color balloons; wrong color = wrong() |
| applecatch.js | physics multi-tap | counting (falling) | tap N treats |
| ballpit.js | physics multi-tap | fun (bounce) | pop all balls |
| letterfind.js | single-choice | letter recognition | tap named letter |
| numberfind.js | single-choice | numeral recognition | tap named number |
| lettermatch.js | single-choice | upper↔lowercase | tap lowercase of shown uppercase |
| abcorder.js (d2+) | ordered-tap | alphabet sequence | tap consecutive letters in order |
| startingsound.js (d2+) | single-choice | phonics first-sound | tap picture starting with letter |
| letterpop.js | physics selective | letter recognition | pop all bubbles with target letter |
| traceletters.js / tracenumbers.js | trace | letter/number formation, fine motor | fill all strokes of glyph |
| linematch.js | drag-connect | matching (letter→pic, upper→lower, number→dots) | drag line from each left node to matching right (`data-left-key`/`data-right-key`); drop hit-test on window pointerup |

Reward chain on solved: sfx.correct (+bonus if firstTry), mascot happy bounce, screenShake, confetti burst at element, +1 score, +1 coin, every 5th → sticker + reward overlay; journey mode counts `roundsDone` and at `level.rounds` shows 1–3 star overlay (stars by first-try count), `addSticker` + `addCoins(stars*5)`, calls `level.onComplete({stars})` → back to map with next stop unlocked.

Journey config: `src/game/journey.js` — 12 stops, `rounds` 3/4/5 by stop, cumulative game-pool tiers per 3 stops.

## 3. State layer

`src/state.js`. Single localStorage key **`trucks-unicorns/v1`**, JSON:

```js
{
  profiles: [{
    id: string,               // Math.random().toString(36).slice(2,9)
    name: string, theme: 'trucks'|'unicorns', difficulty: 1..5,
    stickers: string[],       // emoji, appended per reward, capped 500
    coins: number,            // +1 per solve, +stars*5 per stop, +1 per drive pickup; -5 per prize
    prizes: { [emoji]: count },
    car: { type: 'car'|'truck'|'bus'|'race'|'unicorn', color: number /* index into COLORS */ },
    journey: { unlocked: number /*1..12*/, stars: { [stopN]: 0..3 /* best */ } }
  }],
  settings: { soundOn: bool, voiceOn: bool }
}
```

Load merges defaults per-profile (`{stickers:[], coins:0, prizes:{}, car:{...}, journey:{...}, ...p}`) so old saves never crash. Save on every mutation; try/catch swallow (private mode OK). API: `getProfiles/getProfile/updateProfile/addProfile/removeProfile` (min 1 profile), `addSticker`, `getCoins/addCoins/spendCoins` (returns false if insufficient), `addPrize`, `getCar/setCar`, `getJourney/recordStopResult(profileId, stopN, stars)` (keeps max stars, unlocks stopN+1 if stars≥1), `getSettings/updateSettings`, `CHOICE_COUNT={1:2,2:3,3:4,4:5,5:6}`, `choiceCountFor(profile)`, `JOURNEY_STOPS=12`, `DIFFICULTY_LEVELS=[1..5]`.

Separate store: parent voice clips in **IndexedDB db `tu-voice`, objectStore `clips`** — key = vocab token, value = audio Blob (MediaRecorder webm). `navigator.storage.persist()` requested at boot and on record screen. Prize catalog `PRIZES` (48 emoji) is a constant in `src/screens/prizes.js`, cost 5 coins.

## 4. Audio layer

Two modules:

- `src/audio.js` — **WebAudio SFX**: lazy `AudioContext`, `tone()` oscillator+gain envelopes, `themeSounds(themeId)` returns `{tap, correct, wrong, win, bonus}` per theme (trucks: sawtooth engine blip / square honks / horn fanfare; unicorns: triangle chime / sine arpeggios / glissando; `softWrong` shared). Gated by `settings.soundOn`. Also `speak(text, {interrupt})` — **speechSynthesis** direct: cancels if interrupt, rate 0.92, pitch 1.15, voice preference en-US female-ish via `getVoices()`. Gated by `settings.voiceOn`. `unlockAudio()` resumes context on first gesture.
- `src/voice.js` — **recorded-voice layer over TTS**. `VOCAB_GROUPS` (~70 tokens incl. A–Z) each `{token, label, say}`. `speakTokens(tokens, fallback, {interrupt})`: none recorded → `audio.speak(fallback)`; some recorded → per-token mix (recorded Blob via `new Audio(objectURL)`, missing tokens spoken by TTS with the token's `say` text), sequential, `playId` guard for interruption. `stopVoice()` kills both. Record screen (`screens/record.js`) uses `getUserMedia` + `MediaRecorder`.

speechSynthesis call sites: `audio.js speak()` (the only direct caller) — used by engine `say()` fallback path via voice.js, plus literal screen prompts below. WebAudio generated only in `audio.js`.

User-facing strings:
- Screen speech: "Let's play!", "Hi! I'm Rumble/Stella!" (home); "Who is playing?" / "Pick two players!" (pick); "Look at all your stickers!" (stickers); "Open a prize!", "A new prize!", "You got a prize!" (prizes); "Let's go, {mascot}!", "Great job! On to the next stop!" (map); "Drive your car!", "Beep beep!" + animal SOUND map (Moo!/Baa!/Woof!/Meow!/Ribbit!/Tweet!/Quack!/Grunt!/Squawk!/Snort!/Boing!/Snip!/Bloop!/Blub!/Hello!/Hiss!/Squeak!/Rawr!) (drive); "{name}, your turn!", "Try again! {prompt}", "You earned a sticker!" (engine).
- Praise (themes.js): trucks `['Honk honk! Great job!','Beep beep! You got it!','Great driving!','Vroom! Amazing!','Awesome, driver!']`; unicorns `['Magical!','Sparkly! Great job!','Unicorn magic!','Amazing! So sparkly!','You got it!']`.
- Game prompts (`prompt.text`): "Find the {color} one!", "Find the {shape}!", "Tap {N} {trucks|unicorns}!", "Tap all the {color} ones!"/"Tap all the {shape}s!", "Which one is different?", "Tap the biggest/smallest one!", "What comes next?", "Find the matching pairs!", "Pop them all!", "Find the hiding {noun}!", "Tickle {N} times!", "How many?", "Which has more?", "Tap them, smallest first!", "Put each one in the matching basket!", "Which one fits the shadow?", "Tap the numbers in order!", "Are they the same?", "Feed {N} treats!", "Watch, then copy!", "Can you find the {color} one?", "Pop all the bubbles!", "Pop all the {color} ones!", "Tap {N} treats!", "Pop all the balls!", "Find the letter {L}!", "Find the number {N}!", "Find the little {l}!", "Tap the letters in order, from {L}!", "Which starts with {L}?", "Pop the letter {L}!", "Trace the {L|N}!", "Match them up!".
- Vocab `say` strings (recordable; TTS fallback per word): 'Find the','Tap','Try again!','Yay!','Great job!','Woohoo!','You did it!','You earned a sticker!','Tap all the','Which one is different?','Find the matching pairs!','Tap the biggest one!','Tap the smallest one!','What comes next?','Pop them all!','Peekaboo! Find the hiding one!','Tickle them','times!','How many?','Which has more?','Tap them in order, smallest first!','Put each one in the matching basket!','Which one fits the shadow?','Tap the numbers in order!','Are they the same?','Feed them','treats!','Watch, then copy!','Find the letter','Find the number','Pop the letter','Which one starts with','Tap the letters in order!','Trace the', color/shape/number words, 'truck(s)','unicorn(s)', letters A–Z.

## 5. Rendering per screen

Everything is DOM (`innerHTML` templates + listeners) with inline SVG art; one canvas.

| screen | rendering |
|---|---|
| home | DOM; inline-SVG mascots (`mascots.js`) + scene (`ui/scene.js` inline SVG w/ CSS-animated clouds/sun) |
| pick / settings / gate / stickers / prizes / record | DOM; inline-SVG avatars (theme heroes) |
| game (engine) | DOM panel; scene inline SVG; choice cards DOM+inline SVG (heroes/shapes from `themes.js` string generators with per-color `linearGradient`); tracing = SVG polylines; linematch = SVG `<line>` overlay; physics games = absolutely-positioned DOM buttons transformed per RAF frame |
| map | DOM serpentine stop list; scene SVG behind; scrollable |
| drive | layered DOM: sky div, parallax `background-image` data-URI SVG layers (clouds/hills), live terrain = SVG `<path>` rebuilt per frame from `terrainFrac(wx)` (sum of sines), entities = absolutely-positioned emoji divs keyed by deterministic slot (`entityFor`, `rng(slot)`), car = DOM + inline SVG + separately rotated wheel divs, RAF loop; biomes recolor layers every `ZONE=4200`px; night = CSS overlay opacity from `nightAmount(wx)` |
| confetti | the single `<canvas id="confetti">`, fixed overlay, self-contained particle loop (`ui/confetti.js`), no-ops if 2D ctx unavailable |

All art is generated inline SVG strings (CC0/original, `public/assets/CREDITS.md`); no image/audio asset files. Styles: single `styles/main.css`, appended in versioned sections (v1…v17), later sections intentionally override earlier ones. Layout is vmin/vw clamp-based; `.grid-cards` sizes square cards via `--card = min(46vmin, 86vw/cols, 56vh/rows)`.

## 6. Dependencies + build

- Runtime deps: **none**. devDependencies: `vite ^5.4.0` only. (`jsdom`, `fake-indexeddb` were used ad hoc in tests via `npm install --no-save`; not in package.json. Test scripts are written to temp files and deleted, none committed except stray `_dbg.mjs` at repo root.)
- `package.json`: `"type":"module"`; scripts `dev`/`build`/`preview` = vite. `vite.config.js`: `base:'./'`, `server:{host:true}`.
- Build: `npm run build` → static `dist/` (~1 HTML + 1 CSS + 1 JS ≈ 25 kB gz). Deploy: GitHub Actions (`deploy.yml`): checkout → setup-node 20 + npm cache → `npm ci` → `npm run build` → configure-pages → upload `dist` → deploy-pages. Pages source must be "GitHub Actions". Live: https://josephcolon.github.io/Testing/.
- `index.html`: `#app` + `#confetti` canvas + `src/main.js` module script; viewport locked (`user-scalable=no`).

## Gotchas for future sessions

- Gradient IDs in generated SVG are derived from color hex (e.g. `tg3d8bff`) — duplicates across instances are same-content, safe; keep unique per color.
- `speechSynthesis` is a shared queue: engine `say(..., urgent)` interrupts only when `!split`; split panels always queue.
- Physics bodies: spin must stay opt-in (`spin:true`, ballpit only) — unconditional spin kicks previously caused runaway rotation.
- Honk in drive clears animals AND landmarks (not coins/ramps) — `flee` class on any `.dentity`.
- Engine board reset must clear `data-*` (stale `echo` `data-seq` bug) and call `teardown()` (physics RAF leak).
- linematch must hit-test drops on window pointerup (implicit pointer capture on touch breaks per-element `pointerup`).
- Tests: mini-games are driven headless by tapping `[data-target]`/`data-order`/`data-pair`/`.echo-pad`+`dataset.seq`/`.sort-item`+`.basket[data-color]`/`surface._waypoints` (tracing)/`data-left-key`→`data-right-key` (linematch); drive exposes `root.__drive = {state, tick, setDir, honk, collected, entities}`.
