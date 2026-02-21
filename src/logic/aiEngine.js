import { WIN_CONDITIONS, coordKey, appendMove } from "./gameLogic";

function findWinningMove(board, symbol) {
  for (const combo of WIN_CONDITIONS) {
    const keys = combo.map(([r, c]) => coordKey(r, c));
    const values = keys.map((k) => board[k]);
    if (values.filter((v) => v === symbol).length === 2 &&
        values.filter((v) => v === "").length === 1) {
      const emptyIndex = values.indexOf("");
      return keys[emptyIndex];
    }
  }
  return null;
}

export function getAIMove(board, movesX, movesO) {
  // 1. Win if possible
  let move = findWinningMove(board, "O");
  if (move) return move;

  // 2. Block opponent
  move = findWinningMove(board, "X");
  if (move) return move;

  // 3. Take center
  if (board[coordKey(1, 1)] === "") return coordKey(1, 1);

  // 4. Random empty cell
  const empty = Object.entries(board).filter(([, v]) => v === "");
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)][0];
}