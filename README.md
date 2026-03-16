# Tic-Tac-Toe Infinity

A persistent-state, rolling Tic-Tac-Toe game built with React and Vite. The game eliminates draws through a FIFO mechanics system and supports continuous play through an infinity loop between rounds. Features a Balatro-inspired visual theme with CRT scanlines, neon glows, and a full run-based progression system.

---

## How It Works

### Rolling Logic

Each player is limited to 3 marks on the board at any time. When a 4th mark is placed, the oldest mark is automatically removed. A pink glow warns the current player which of their marks will vanish on their next turn.

### Infinity Loop

When a player wins, the board clears but the winning mark carries over to the new board to start the next round. The turn passes to the opponent and play continues without interruption.

### Scoring

Scores persist across rounds until manually reset. Each win increments the winner's score by 1.

---

## Game Modes

**vs Computer** — Play against an AI opponent with three difficulty levels that escalate automatically as your score increases. The run ends when you run out of hearts.

**2 Player** — Two players share the same device and alternate turns. No hearts or difficulty system — pure head to head.

---

## Heart System (vs Computer only)

The heart system turns the infinity loop into a run. You start each run with 3 hearts and a maximum of 5.

| Event | Effect |
|---|---|
| AI wins a round | Lose 1 heart |
| Player lands on a heart cell | Gain 1 heart (up to 5) |
| Player wins 3 rounds in a row | Gain 1 heart (only if below 3) |
| Hearts reach 0 | Run Over |

### Heart Cell

A heart icon occasionally appears on a random board cell. Landing your mark on it collects the heart. If the AI lands on it first the heart disappears and nobody gains it. Heart cells never spawn on the center square or the carryover cell.

### Run Over

When hearts reach zero the run ends. A Game Over screen shows your final score and your all-time best run, saved to local storage. From there you can start a new run or exit to the home screen.

---

## AI Difficulty

Difficulty scales automatically based on the player's score. The AI never gets harder just because it is winning.

| Player Score | Difficulty |
|---|---|
| 0 – 2 | Easy — random moves |
| 3 – 7 | Medium — win, block, center, random |
| 8+ | Hard — rolling-aware, simulates vanish side effects before deciding |
