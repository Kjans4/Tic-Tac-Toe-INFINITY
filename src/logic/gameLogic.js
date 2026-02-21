export const WIN_CONDITIONS = [
  [[0,0], [0,1], [0,2]],
  [[1,0], [1,1], [1,2]],
  [[2,0], [2,1], [2,2]],
  [[0,0], [1,0], [2,0]],
  [[0,1], [1,1], [2,1]],
  [[0,2], [1,2], [2,2]],
  [[0,0], [1,1], [2,2]],
  [[0,2], [1,1], [2,0]],
];

export function coordKey(r, c) {
  return `${r},${c}`;
}

export function appendMove(queue, coord) {
  const next = [...queue, coord];
  const vanished = next.length > 3 ? next[0] : null;
  return { newQueue: next.slice(-3), vanished };
}

export function buildInitialBoard() {
  const board = {};
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      board[coordKey(r, c)] = "";
  return board;
}

export function recordMove(board, movesX, movesO, currentPlayer, r, c) {
  const key = coordKey(r, c);
  const queue = currentPlayer === "X" ? movesX : movesO;
  const { newQueue, vanished } = appendMove(queue, key);

  const newBoard = { ...board };
  if (vanished) newBoard[vanished] = "";
  newBoard[key] = currentPlayer;

  return {
    newBoard,
    newMovesX: currentPlayer === "X" ? newQueue : movesX,
    newMovesO: currentPlayer === "O" ? newQueue : movesO,
    vanished,
  };
}

export function checkWinner(board, player) {
  for (const combo of WIN_CONDITIONS) {
    if (combo.every(([r, c]) => board[coordKey(r, c)] === player)) {
      return combo.map(([r, c]) => coordKey(r, c));
    }
  }
  return null;
}

export function getWarningCoord(queue) {
  return queue.length === 3 ? queue[0] : null;
}