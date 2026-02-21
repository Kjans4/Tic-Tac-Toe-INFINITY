export default function Controls({ onAgain, onResetScore, onExit }) {
  return (
    <div className="controls">
      <button className="ctrl-btn" onClick={onAgain}>Again</button>
      <button className="ctrl-btn" onClick={onResetScore}>Reset Score</button>
      <button className="ctrl-btn ctrl-btn--exit" onClick={onExit}>Exit</button>
    </div>
  );
}