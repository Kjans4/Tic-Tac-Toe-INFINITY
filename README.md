Tic-Tac-Toe Infinity
A persistent-state, rolling Tic-Tac-Toe game built with React and Vite. The game eliminates draws through a FIFO mechanics system and supports continuous play through an infinity loop between rounds.

How It Works
Rolling Logic
Each player is limited to 3 marks on the board at any time. When a 4th mark is placed, the oldest mark is automatically removed. A pink highlight warns the current player which of their marks will vanish on their next turn.
Infinity Loop
When a player wins, the board clears but the winning mark is carried over to the new board. The turn then passes to the opponent, and play continues without interruption.
Scoring
Scores persist across rounds until manually reset. Each win increments the winner's score by 1.


Game Modes:
vs Computer — Play against an AI opponent that prioritizes winning, then blocking, then center, then a random available cell.
2 Player — Two players share the same device and alternate turns.