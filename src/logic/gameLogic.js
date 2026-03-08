/**
 * All possible winning combinations on a 3x3 grid.
 * Each entry represents three [row, column] coordinates.
 */
export const WIN_CONDITIONS = [
  [[0,0], [0,1], [0,2]], // Horizontal rows
  [[1,0], [1,1], [1,2]],
  [[2,0], [2,1], [2,2]],
  [[0,0], [1,0], [2,0]], // Vertical columns
  [[0,1], [1,1], [2,1]],
  [[0,2], [1,2], [2,2]],
  [[0,0], [1,1], [2,2]], // Diagonals
  [[0,2], [1,1], [2,0]],
];

/**
 * Converts row and column indices into a consistent string key.
 * Used for indexing the board object (e.g., 0,1 -> "0,1").
 */
export function coordKey(r, c) {
  return `${r},${c}`;
}

/**
 * Manages the "first-in, first-out" movement logic.
 * Ensures a player only has a maximum of 3 marks on the board.
 * @returns {Object} The updated move history (limited to 3) and the coordinate that should disappear.
 */
export function appendMove(queue, coord) {
  const next = [...queue, coord];
  // If player makes a 4th move, the 1st move (index 0) must vanish
  const vanished = next.length > 3 ? next[0] : null;
  // Slice to ensure we only track the most recent 3 moves
  return { newQueue: next.slice(-3), vanished };
}

/**
 * Generates a fresh 3x3 game board.
 * Initializes all coordinates as empty strings.
 */
export function buildInitialBoard() {
  const board = {};
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      board[coordKey(r, c)] = "";
  return board;
}

/**
 * Processes a player's move, updates the board, and handles vanishing marks.
 * @returns {Object} The new board state, updated move queues for both players, and the vanished coordinate.
 */
export function recordMove(board, movesX, movesO, currentPlayer, r, c) {
  const key = coordKey(r, c);
  const queue = currentPlayer === "X" ? movesX : movesO;
  
  // Calculate which move disappears if this is the player's 4th move
  const { newQueue, vanished } = appendMove(queue, key);

  const newBoard = { ...board };
  // If a move reached its "expiration," clear it from the board
  if (vanished) newBoard[vanished] = "";
  // Place the player's new mark
  newBoard[key] = currentPlayer;

  return {
    newBoard,
    newMovesX: currentPlayer === "X" ? newQueue : movesX,
    newMovesO: currentPlayer === "O" ? newQueue : movesO,
    vanished,
  };
}

/**
 * Scans the board to see if the current player has completed a winning line.
 * @returns {Array|null} The coordinates of the winning line, or null if no winner.
 */
export function checkWinner(board, player) {
  for (const combo of WIN_CONDITIONS) {
    // Check if every coordinate in a win condition belongs to the current player
    if (combo.every(([r, c]) => board[coordKey(r, c)] === player)) {
      return combo.map(([r, c]) => coordKey(r, c));
    }
  }
  return null;
}

/**
 * Identifies the piece that will disappear on the player's next turn.
 * Useful for UI hints (e.g., making the oldest piece fade out).
 */
export function getWarningCoord(queue) {
  return queue.length === 3 ? queue[0] : null;
}