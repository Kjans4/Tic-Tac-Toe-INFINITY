import Cell from "./Cell";
import "../styles/board.css";

export default function Board({ board, winningCombo, warningCoord, onCellClick }) {
  function getHighlight(key) {
    if (winningCombo && winningCombo.includes(key)) return "winner";
    if (warningCoord === key) return "warning";
    return null;
  }

  return (
    <div className="board-grid">
      {Array.from({ length: 3 }, (_, r) =>
        Array.from({ length: 3 }, (_, c) => {
          const key = `${r},${c}`;
          return (
            <Cell
              key={key}
              value={board[key]}
              highlight={getHighlight(key)}
              onClick={() => onCellClick(r, c)}
            />
          );
        })
      )}
    </div>
  );
}