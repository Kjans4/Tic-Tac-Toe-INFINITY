export default function ScoreBoard({ scores, currentPlayer }) {
  const xActive = currentPlayer === "X";

  return (
    <div className="scoreboard">
      <span className={`score-side score--x ${xActive ? "score--active" : ""}`}>
        {xActive ? "▶ " : ""}X: {scores.X}
      </span>
      <span className="score-divider">|</span>
      <span className={`score-side score--o ${!xActive ? "score--active" : ""}`}>
        O: {scores.O}{!xActive ? " ◀" : ""}
      </span>
    </div>
  );
}