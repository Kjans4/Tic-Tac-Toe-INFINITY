import { WIN_CONDITIONS, coordKey, appendMove } from "./gameLogic";

// --- Difficulty Thresholds ---
export function getDifficulty(totalScore) {
  if (totalScore >= 12) return "hard";
  if (totalScore >= 6)  return "medium";
  return "easy";
}

// --- Shared Helpers ---
function getEmptyCells(board) {
  return Object.entries(board)
    .filter(([, v]) => v === "")
    .map(([k]) => k);
}

function findWinningMove(board, symbol) {
  for (const combo of WIN_CONDITIONS) {
    const keys  = combo.map(([r, c]) => coordKey(r, c));
    const vals  = keys.map((k) => board[k]);
    if (vals.filter((v) => v === symbol).length === 2 &&
        vals.filter((v) => v === "").length === 1) {
      return keys[vals.indexOf("")];
    }
  }
  return null;
}

// Simulate placing a move including the rolling vanish side effect.
// Returns the resulting board without mutating the original.
function simulateMove(board, queue, symbol, targetKey) {
  const newBoard = { ...board };
  const newQueue = [...queue, targetKey];

  if (newQueue.length > 3) {
    newBoard[newQueue[0]] = ""; // oldest mark vanishes
    newQueue.shift();
  }

  newBoard[targetKey] = symbol;
  return { newBoard, newQueue };
}

// --- Easy AI: pure random ---
function easyMove(board) {
  const empty = getEmptyCells(board);
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}

// --- Medium AI: win → block → center → random (current behavior) ---
function mediumMove(board) {
  return (
    findWinningMove(board, "O") ||
    findWinningMove(board, "X") ||
    (board[coordKey(1, 1)] === "" ? coordKey(1, 1) : null) ||
    easyMove(board)
  );
}

// --- Hard AI: rolling-aware ---
function hardMove(board, movesO, movesX) {
  const empty = getEmptyCells(board);

  // 1. Can AI win this move? (simulate the vanish first)
  for (const key of empty) {
    const { newBoard } = simulateMove(board, movesO, "O", key);
    if (findWinningMove(newBoard, "O") !== null ||
        checkImmediateWin(newBoard, "O")) {
      return key;
    }
  }

  // 2. Can opponent win on their next move? Block it.
  for (const key of empty) {
    const { newBoard, newQueue } = simulateMove(board, movesX, "X", key);
    if (checkImmediateWin(newBoard, "X")) {
      return key;
    }
  }

  // 3. Can AI set up a guaranteed win next turn?
  for (const key of empty) {
    const { newBoard } = simulateMove(board, movesO, "O", key);
    if (findWinningMove(newBoard, "O")) {
      return key;
    }
  }

  // 4. Center → strategic corners → random
  if (board[coordKey(1, 1)] === "") return coordKey(1, 1);

  const corners = ["0,0", "0,2", "2,0", "2,2"].filter((k) => board[k] === "");
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  return easyMove(board);
}

// Check if a player already has 3 in a row on the given board
function checkImmediateWin(board, symbol) {
  return WIN_CONDITIONS.some((combo) =>
    combo.every(([r, c]) => board[coordKey(r, c)] === symbol)
  );
}

// --- Main Export ---
export function getAIMove(board, movesX, movesO, totalScore) {
  const difficulty = getDifficulty(totalScore);

  if (difficulty === "easy")   return easyMove(board);
  if (difficulty === "medium") return mediumMove(board);
  return hardMove(board, movesO, movesX);
}