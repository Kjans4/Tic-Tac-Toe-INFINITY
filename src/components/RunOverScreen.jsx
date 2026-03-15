import "../styles/game.css";

export default function RunOverScreen({ visible, playerScore, bestScore, onRestart }) {
  if (!visible) return null;

  const isNewBest = playerScore > 0 && playerScore >= bestScore;

  return (
    <div className="runover-overlay">
      <div className="runover-content">
        <p className="runover-title">GAME OVER</p>
        <div className="runover-divider" />
        <div className="runover-scores">
          <div className="runover-score-row">
            <span className="runover-score-label">YOUR SCORE</span>
            <span className="runover-score-value">{playerScore}</span>
          </div>
          <div className="runover-score-row">
            <span className="runover-score-label">BEST RUN</span>
            <span className={`runover-score-value ${isNewBest ? "runover-score-value--best" : ""}`}>
              {bestScore}
              {isNewBest && <span className="runover-new-best"> NEW</span>}
            </span>
          </div>
        </div>
        <div className="runover-divider" />
        <button className="runover-btn" onClick={onRestart}>
          START NEW RUN
        </button>
      </div>
    </div>
  );
}