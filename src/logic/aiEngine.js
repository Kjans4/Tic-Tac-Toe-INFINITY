import { WIN_CONDITIONS, coordKey } from "./gameLogic";

// --- Difficulty Thresholds ---
// Based on total rounds played (scores.X + scores.O)
export function getDifficulty(totalScore) {
  if (totalScore >= 8) return "hard";
  if (totalScore >= 3) return "medium";
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
    const keys = combo.map(([r, c]) => coordKey(r, c));
    const vals = keys.map((k) => board[k]);
    if (
      vals.filter((v) => v === symbol).length === 2 &&
      vals.filter((v) => v === "").length === 1
    ) {
      return keys[vals.indexOf("")];
    }
  }
  return null;
}

// Simulate placing a move with rolling vanish — never mutates originals
function simulateMove(board, queue, symbol, targetKey) {
  const newBoard = { ...board };
  // Spread into a NEW array then slice — never mutate the original
  const next = [...queue, targetKey];
  const newQueue = next.length > 3 ? next.slice(1) : next.slice();

  if (next.length > 3) {
    newBoard[next[0]] = ""; // remove oldest
  }

  newBoard[targetKey] = symbol;
  return { newBoard, newQueue };
}

function checkImmediateWin(board, symbol) {
  return WIN_CONDITIONS.some((combo) =>
    combo.every(([r, c]) => board[coordKey(r, c)] === symbol)
  );
}

// --- Easy AI: pure random ---
function easyMove(board) {
  const empty = getEmptyCells(board);
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}

// --- Medium AI: win → block → center → random ---
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

  // 1. Can AI win this move accounting for vanish?
  for (const key of empty) {
    const { newBoard } = simulateMove(board, movesO, "O", key);
    if (checkImmediateWin(newBoard, "O")) return key;
  }

  // 2. Can opponent win next move accounting for their vanish? Block it.
  for (const key of empty) {
    const { newBoard } = simulateMove(board, movesX, "X", key);
    if (checkImmediateWin(newBoard, "X")) return key;
  }

  // 3. Can AI set up a guaranteed win next turn?
  for (const key of empty) {
    const { newBoard, newQueue } = simulateMove(board, movesO, "O", key);
    if (findWinningMove(newBoard, "O")) return key;
  }

  // 4. Center → corners → random
  if (board[coordKey(1, 1)] === "") return coordKey(1, 1);

  const corners = ["0,0", "0,2", "2,0", "2,2"].filter((k) => board[k] === "");
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  return easyMove(board);
}

// --- Main Export ---
export function getAIMove(board, movesX, movesO, totalScore) {
  const difficulty = getDifficulty(totalScore);
  if (difficulty === "easy")   return easyMove(board);
  if (difficulty === "medium") return mediumMove(board);
  return hardMove(board, movesO, movesX);
}