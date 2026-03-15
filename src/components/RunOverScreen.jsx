import "../styles/runover.css";

export default function RunOverScreen({ visible, playerScore, bestScore, onRestart }) {
  if (!visible) return null;

  const isNewBest = playerScore > 0 && playerScore >= bestScore;

  return (
    <div className="runover-overlay">
      <div className="runover-card">
        <p className="runover-title">GAME OVER</p>

        <div className="runover-divider" />

        <div className="runover-scores">
          <div className="runover-row">
            <span className="runover-label">YOUR SCORE</span>
            <span className="runover-value">{playerScore}</span>
          </div>
          <div className="runover-row">
            <span className="runover-label">BEST RUN</span>
            <span className={`runover-value ${isNewBest ? "runover-value--gold" : ""}`}>
              {bestScore}
              {isNewBest && <span className="runover-new"> NEW</span>}
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