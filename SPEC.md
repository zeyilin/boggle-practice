# Boggle Practice — Product Spec v1

## Overview

A solo Boggle practice PWA that works on touchscreens and desktop. Fully client-side, offline-first, built with Next.js + React + TypeScript + Tailwind CSS. Data persisted in IndexedDB. CPU-intensive work (dictionary loading, board solving) runs in Web Workers to keep the UI responsive.

---

## Grid Variants

| Variant | Grid | Min Word Length | Dice Set |
|---------|------|-----------------|----------|
| Classic | 4×4 (16 dice) | 3 letters | Standard Boggle dice |
| Big Boggle | 5×5 (25 dice) | 4 letters | Standard Big Boggle dice |

Dice use the official Hasbro letter distributions. The `Qu` tile displays as "Qu" and counts as two letters toward word length.

### Board Generation

- Dice are shuffled randomly, then each die is rolled to select a face
- After generation, the board is solved in a Web Worker to compute `wordsAvailable`
- **Minimum word threshold:** If a generated board has fewer than 20 valid words (4×4) or 40 valid words (5×5), it is silently re-rolled. This prevents dead or near-dead boards that aren't fun to play
- Re-roll cap: max 10 attempts, then accept whatever board was generated (to avoid infinite loops on edge cases)

---

## Game Modes

### 1. Classic Mode
Standard timed Boggle. Find as many words as possible before the timer runs out.

- **Default timer:** 3 minutes
- **Configurable:** 1–10 minutes in 30-second increments
- Timer displays prominently with color changes (green → yellow → red) in final 30s
- Audio cue at 30s, 10s, and 0s (can be muted)
- Score shown live during play

### 2. Zen Mode
Untimed practice. Same rules, no clock pressure.

- No timer — play until you hit "Done"
- Elapsed time shown (for personal reference, not scoring)
- Otherwise identical to Classic Mode

### 3. Solver Mode
Study tool. View all possible words on any board.

- Generate a board or input a custom board (tap dice to cycle letters)
- No input phase — immediately shows all valid words
- Words grouped by length, alphabetized within groups
- Tap any word to highlight its path on the grid
- Can toggle between showing all words or hiding them for self-testing
- Solver mode does not produce a `GameRecord`

### 4. Review Mode (Spaced Repetition)
Replay boards you struggled on to build vocabulary.

- Surfaces past boards where you found < 40% of available words
- Boards scheduled using a simplified SM-2 algorithm:
  - **Score < 30% of possible words:** Review again in 1 day
  - **Score 30–50%:** Review in 3 days
  - **Score 50–70%:** Review in 7 days
  - **Score > 70%:** Graduate (remove from review queue)
- Shows your previous score and word count as a target to beat
- After completion, shows improvement delta
- Queue displayed as "X boards to review" on the home screen
- If no boards to review, prompts to play Classic/Zen to generate material

### Mid-Game Recovery

All game modes (except Solver) auto-save state to IndexedDB:
- On every word submission
- On timer tick (every 5 seconds in Classic mode)
- On `visibilitychange` (user switches tab or locks phone)

If the app is reopened with an interrupted game in IDB, the home screen shows a "Resume game?" prompt. The user can resume or discard.

---

## Dictionaries

| Dictionary | Description | Default? |
|------------|-------------|----------|
| TWL06 | Tournament Word List (North American Boggle standard) | Yes |
| SOWPODS | International Scrabble dictionary (broader) | No |

- User can switch dictionaries in Settings
- **Pre-compiled DAWG:** Dictionaries are compiled into a Directed Acyclic Word Graph (DAWG) at build time and shipped as compressed binary assets (~300–500 KB each). No Trie construction at runtime.
- The DAWG supports both full-word lookup and prefix checking (needed for DFS pruning during board solving)
- Only the active dictionary is loaded into memory. The second is downloaded only if the user switches.
- Dictionary is cached in the service worker cache (not IndexedDB) for offline use
- When switching dictionaries, past game stats remain tagged with the dictionary used

### Dictionary Loading

- Dictionary loads asynchronously in a **Web Worker** on app startup
- Home screen renders immediately; game mode buttons show a subtle loading state until the dictionary is ready
- If the dictionary fails to load (corrupt cache, missing file), show an error with a "Retry" button. Game modes are disabled until the dictionary is available.

---

## Web Worker Architecture

Two dedicated Web Workers handle CPU-intensive operations off the main thread:

### DictionaryWorker
- Loads and deserializes the DAWG binary
- Exposes methods:
  - `isWord(word: string): boolean`
  - `isPrefix(prefix: string): boolean`
  - `solve(board: string[][], minLength: number): WordWithPath[]`

### SolverWorker (optional — can be merged with DictionaryWorker)
- Runs board solving (DFS with prefix pruning across all starting positions)
- Returns all valid words with their paths
- For a 5×5 board, solving typically takes 50–200ms

Communication via `postMessage` / structured clone. Use [Comlink](https://github.com/GoogleChromeLabs/comlink) to wrap workers with a promise-based API for ergonomic usage from React.

---

## Input Methods

### Touch (Mobile / Tablet)

**Swipe-to-trace:**
- Press and hold a tile to start
- Drag finger across adjacent tiles to trace a path
- Path visualized with connecting lines and highlighted tiles
- Lift finger to submit the word
- Invalid adjacency (non-neighboring tile) cancels the trace from that point

**Tap-to-spell:**
- Tap tiles sequentially to build a word
- Each tapped tile highlights and appends its letter to the current word
- Only adjacent tiles to the last-selected tile are valid (others dimmed)
- Tap the last selected tile to undo, or tap a "Clear" button to reset
- "Submit" button to confirm the word

**Touch conflict resolution (when "Both" mode is active):**
- A touch that moves > 10px from its start point within 150ms is classified as a **swipe**
- A touch that is released within 150ms without significant movement is classified as a **tap**
- Visual feedback: tile scales down slightly on press to acknowledge the touch before the mode is determined

**Shared touch behaviors:**
- Current word displays above the grid as it's being built
- Haptic feedback on tile selection (where supported)
- Visual feedback: valid word (green flash), duplicate (yellow), invalid (red shake)

### Keyboard (Desktop)

- Type the word using the keyboard
- Input field always focused during play (no need to click)
- Press **Enter** to submit
- Press **Escape** to clear current input
- **"Qu" handling:** Typing "Q" auto-expands to "QU" in the input display, since the Qu tile always represents both letters. Backspace over "QU" deletes both characters at once.
- Autocomplete disabled — no hints from the input field
- Submitted words appear in a scrollable list beside the grid
- Visual feedback on the grid: typed letters highlight their positions in real-time (if an unambiguous path exists)

### Responsive Layout

| Viewport | Layout |
|----------|--------|
| Mobile (< 640px) | Grid centered top, word list below, input at bottom (thumb-friendly) |
| Tablet (640–1024px) | Grid left-center, word list right |
| Desktop (> 1024px) | Grid center-left, word list right, stats panel far right |

---

## Scoring

Standard Boggle scoring:

| Word Length | Points |
|-------------|--------|
| 3 letters | 1 |
| 4 letters | 1 |
| 5 letters | 2 |
| 6 letters | 3 |
| 7 letters | 5 |
| 8+ letters | 11 |

*Big Boggle: 3-letter words are not valid (min 4 letters), so scoring starts at 4.*

---

## Hints System

Off by default. Toggle in Settings or per-game.

When enabled, the player can request hints (limited to **3 per game** in Classic, **unlimited** in Zen):

| Hint Type | What It Shows |
|-----------|--------------|
| **Count by length** | "There are 4 more 5-letter words" |
| **First letter** | "You're missing words starting with: B, G, T" |
| **Reveal one word** | Shows one unfound word (lowest point value first) |

Hints are tracked in stats (games with hints flagged separately).

---

## Post-Round Review

After every Classic/Zen/Review game, show a results screen:

### Summary
- Your score vs. maximum possible score (percentage)
- Words found: X / Y total
- Time taken (Zen) or time remaining when last word submitted (Classic)
- Personal best comparison for this grid size

### Missed Words List
Sortable by (user chooses):
- **Length** (default) — grouped by word length, longest first
- **Points** — highest value words first
- **Alphabetical** — flat A-Z list
- **Path complexity** — words with harder-to-spot paths first (longer paths, more direction changes)

Each missed word is tappable to:
- Show its path highlighted on the grid
- Show its definition (if available — use a free dictionary API, cached locally)

### Found Words List
- All words you found, with points earned per word
- Tappable to show path on grid

---

## Stats (v1)

Persisted in IndexedDB. Tracked per grid size (4×4 / 5×5) and per dictionary.

### Dashboard Metrics

| Stat | Description |
|------|-------------|
| **Games Played** | Total count |
| **Average Score** | Mean points per game |
| **Best Score** | All-time high score |
| **Total Words Found** | Cumulative across all games |
| **Unique Words Found** | De-duplicated — your personal vocabulary |
| **Discovery Rate** | Avg % of available words found per game |
| **Avg Words/Round** | Mean words found per game |
| **Longest Word** | Longest word you've ever found |
| **Current Streak** | Consecutive days with at least 1 game |
| **Best Streak** | All-time longest daily streak |

### Charts (v1)

- **Score over time** — line chart, last 30 games
- **Discovery rate over time** — line chart showing improvement trend
- **Word length distribution** — bar chart of found words by length

### History

- Scrollable game history list
- Each entry shows: date, grid size, score, word count, discovery rate
- Tap to view the full board + found/missed words

### Data Export / Import

- **Export:** Download all stats, game history, and review queue as a single JSON file
- **Import:** Upload a JSON file to restore data (with confirmation dialog warning it will overwrite current data)
- Accessible from Settings
- Protects user investment against browser storage eviction (especially Safari)

---

## Accessibility

### Keyboard Navigation
- All game modes and menus navigable via keyboard (Tab, Enter, Escape, arrow keys)
- Grid tiles are focusable in Solver and review screens for keyboard-based path exploration
- Skip-to-content link on all pages

### Screen Reader Support
- Grid tiles have `aria-label` with letter and position (e.g., "Tile row 2, column 3: letter S")
- Submitted words list is an ARIA live region — new words are announced
- Timer announces at 30s, 10s, and game over via `aria-live="assertive"`
- Game results screen uses semantic headings and labeled data

### Visual
- All color feedback (green/yellow/red) is paired with a non-color indicator (icon or shape change)
- Touch targets are minimum 44×44px
- Respects `prefers-reduced-motion` — disables path-tracing animations, tile transitions
- Sufficient contrast ratios in both light and dark themes (WCAG AA minimum)

### Motor
- Tap-to-spell mode provides an alternative for users who cannot perform swipe gestures
- Submit and Clear buttons are large and well-separated to prevent mis-taps

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| **Dictionary fails to load** | Show error banner with "Retry" button. Game modes disabled. Offer "Check connection" guidance if offline. |
| **IndexedDB unavailable** | Fall back to in-memory state. Show warning: "Your progress won't be saved in this browser." Game still playable. |
| **IndexedDB storage evicted** | On next load, detect missing data. Show prompt: "Your saved data was cleared by the browser. Consider exporting your data regularly." Link to storage persistence request. |
| **Web Worker crashes** | Restart the worker automatically (max 3 retries). If persistent, fall back to main-thread dictionary/solver with a warning about potential jank. |
| **Mid-game crash / tab close** | Auto-saved state in IDB. Resume prompt on next visit (see Mid-Game Recovery). |
| **Board generation fails** | After 10 re-roll attempts, accept the board regardless of word count. Extremely unlikely with standard dice. |

On first visit, request `navigator.storage.persist()` to reduce the chance of storage eviction.

---

## PWA & Offline

- Full offline support after first load
- Service worker caches:
  - App shell (HTML, JS, CSS) — **stale-while-revalidate** with update prompt
  - Dictionary DAWG files — **cache-first** (immutable between deploys, versioned by filename hash)
  - All game logic runs client-side
- **Update flow:** When a new version is detected, show a non-intrusive banner: "Update available — tap to refresh." Never auto-reload during a game.
- IndexedDB stores:
  - Game history & records
  - Stats
  - Review queue (spaced repetition)
  - User settings
  - In-progress game state (for mid-game recovery)
- Install prompt on supported browsers
- App manifest with icons, theme color, standalone display mode
- **Cache budget:** ~5–10 MB total (app shell + one dictionary). Acceptable for all modern devices.
- Request `navigator.storage.persist()` on first visit for durable storage

---

## Settings

| Setting | Options | Default |
|---------|---------|---------|
| Grid Size | 4×4 / 5×5 | 4×4 |
| Dictionary | TWL06 / SOWPODS | TWL06 |
| Timer Duration | 1:00 – 10:00 (30s steps) | 3:00 |
| Hints | On / Off | Off |
| Sound Effects | On / Off | On |
| Haptic Feedback | On / Off | On |
| Theme | Light / Dark / System | System |
| Touch Input Mode | Swipe / Tap / Both | Both |
| Data Export | Button | — |
| Data Import | Button | — |

Settings persisted in IndexedDB.

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 14+ (App Router, static export) | SSG, scalable if backend needed later |
| Language | TypeScript | Type safety for game logic |
| Styling | Tailwind CSS | Responsive, utility-first |
| Components | shadcn/ui | Accessible, composable primitives |
| Charts | Recharts | Lightweight, React-native charting |
| Data | IndexedDB (via idb) | Structured offline storage with migration support |
| Dictionary | DAWG (pre-compiled at build time) | Compact binary, fast prefix + word lookup, no runtime construction |
| Workers | Web Workers + Comlink | Off-main-thread dictionary loading and board solving |
| PWA | next-pwa / Serwist | Service worker + manifest |
| Animations | CSS transitions + Framer Motion (path tracing only) | CSS for simple feedback, Framer Motion only where needed to minimize bundle |
| State | Zustand | Lightweight reactive cache over IndexedDB |
| Testing | Vitest + Playwright | Unit + E2E |

### Build-Time Tooling

- **DAWG compiler:** A Node.js build script that reads the raw word list text files and outputs a compressed binary DAWG. Runs as a pre-build step. Output is placed in `public/dictionaries/`.

---

## State Architecture

Zustand stores act as a **reactive cache over IndexedDB**. IDB is the source of truth for all persistent data.

### Store Slices

```
gameStore       — board, timer, current word, found words, game phase
                  (idle | loading | playing | paused | review)
                  Hydrated from IDB on resume; written to IDB on mutations.

dictionaryStore — loaded dictionary reference, loading state, active
                  dictionary name. Communicates with DictionaryWorker.

settingsStore   — user settings. Synced bidirectionally with IDB.

statsStore      — derived stats, game history. Lazy-loaded from IDB
                  on Stats Dashboard mount. Not kept in memory otherwise.

reviewStore     — review queue, scheduling logic. Loaded on app start
                  to show queue count on home screen.
```

### Data Flow

```
User Action → Zustand Store (optimistic update) → IndexedDB (persist)
App Load    → IndexedDB (read) → Zustand Store (hydrate)
Game Start  → DictionaryWorker.solve(board) → gameStore.wordsAvailable
```

---

## Data Model (IndexedDB)

**Schema version: 1** — use `idb`'s `upgrade` callback for future migrations.

```ts
interface WordWithPath {
  word: string
  path: [row: number, col: number][]  // ordered tile coordinates
}

interface GameRecord {
  id: string                          // uuid
  timestamp: number
  gridSize: 4 | 5
  dictionary: 'twl06' | 'sowpods'
  board: string[][]                   // the grid
  gameMode: 'classic' | 'zen' | 'review'
  timerDuration: number | null        // seconds, null for zen
  wordsFound: string[]
  wordsAvailable: WordWithPath[]      // all valid words with paths
  score: number
  maxScore: number
  hintsUsed: number
  elapsedTime: number                 // seconds
}

interface ReviewCard {
  id: string                          // uuid
  gameId: string                      // ref to GameRecord
  board: string[][]
  gridSize: 4 | 5
  dictionary: 'twl06' | 'sowpods'
  easeFactor: number
  interval: number                    // days
  nextReviewDate: number              // timestamp
  reviewCount: number
  bestDiscoveryRate: number
}

interface InProgressGame {
  id: 'current'                       // singleton
  gameMode: 'classic' | 'zen' | 'review'
  board: string[][]
  gridSize: 4 | 5
  dictionary: 'twl06' | 'sowpods'
  wordsFound: string[]
  wordsAvailable: WordWithPath[]
  timerDuration: number | null
  elapsedTime: number
  hintsUsed: number
  reviewCardId: string | null         // if review mode
  savedAt: number                     // timestamp
}

interface UserSettings {
  gridSize: 4 | 5
  dictionary: 'twl06' | 'sowpods'
  timerDuration: number
  hintsEnabled: boolean
  soundEnabled: boolean
  hapticEnabled: boolean
  theme: 'light' | 'dark' | 'system'
  touchInputMode: 'swipe' | 'tap' | 'both'
}
```

### IndexedDB Indexes

| Object Store | Index | Purpose |
|-------------|-------|---------|
| `gameRecords` | `timestamp` | History pagination, chart queries |
| `gameRecords` | `gridSize` | Filter stats by variant |
| `gameRecords` | `dictionary` | Filter stats by dictionary |
| `reviewCards` | `nextReviewDate` | Efficient "due today" query |
| `reviewCards` | `dictionary` | Filter review queue by active dictionary |

---

## Screen Map

```
Home
├── Classic Mode → Game → Post-Round Review
├── Zen Mode → Game → Post-Round Review
├── Solver Mode → Board Setup → Solution View
├── Review Mode → Game → Post-Round Review (with improvement delta)
├── Stats Dashboard
│   ├── Overview
│   ├── Charts
│   └── Game History → Game Detail
└── Settings
    ├── Data Export
    └── Data Import
```

---

## Future Considerations (not v1)

- Multiplayer (real-time or async)
- Leaderboards (global / friends)
- Daily challenge (everyone gets the same board)
- Word of the day / vocabulary builder
- Custom word lists
- Board sharing (share a board via URL/QR)
- Achievements / badges
- Export stats to CSV
