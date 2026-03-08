import { WIN_CONDITIONS, coordKey, appendMove } from "./gameLogic";

/**
 * Scans the board for a "threat" or "opportunity."
 * A winning move exists if a player has 2 marks in a row and the 3rd spot is empty.
 * @param {Object} board - The current state of the 3x3 grid.
 * @param {string} symbol - The player to check for ("X" or "O").
 * @returns {string|null} The coordinate key (e.g., "1,2") to complete the line, or null.
 */
function findWinningMove(board, symbol) {
  for (const combo of WIN_CONDITIONS) {
    // Convert coordinate pairs into board keys (e.g., [0,0] -> "0,0")
    const keys = combo.map(([r, c]) => coordKey(r, c));
    // Get the actual values at those positions ("", "X", or "O")
    const values = keys.map((k) => board[k]);

    // Check if the player has exactly 2 marks and 1 empty space in this combo
    if (values.filter((v) => v === symbol).length === 2 &&
        values.filter((v) => v === "").length === 1) {
      
      // Find the index of that empty space and return its coordinate key
      const emptyIndex = values.indexOf("");
      return keys[emptyIndex];
    }
  }
  return null;
}

/**
 * Determines the AI's next move based on a priority hierarchy.
 * Priority: 1. Win > 2. Block > 3. Center > 4. Random
 */
export function getAIMove(board, movesX, movesO) {
  // --- STRATEGY 1: WIN ---
  // If the AI ("O") can win in one move, take it.
  let move = findWinningMove(board, "O");
  if (move) return move;

  // --- STRATEGY 2: BLOCK ---
  // If the opponent ("X") is about to win, block that spot.
  move = findWinningMove(board, "X");
  if (move) return move;

  // --- STRATEGY 3: CENTER CONTROL ---
  // The center square (1,1) is statistically the strongest position.
  if (board[coordKey(1, 1)] === "") return coordKey(1, 1);

  // --- STRATEGY 4: RANDOM ---
  // If no immediate threats/wins/center, pick any available empty square.
  const empty = Object.entries(board).filter(([, v]) => v === "");
  if (empty.length === 0) return null; // Board is full (unlikely in "Infinite" mode)
  
  // Pick a random index from the list of empty cells
  return empty[Math.floor(Math.random() * empty.length)][0];
}