import "../styles/home.css";

export default function HomeScreen({ onStartGame }) {
  return (
    <div className="home-container">
      <div className="home-title-group">
        <span className="home-subtitle">Tic-Tac-Toe</span>
        <span className="home-title">INFINITY</span>
      </div>
      <div className="home-buttons">
        <button className="home-btn" onClick={() => onStartGame(true)}>
          Play Against Computer
        </button>
        <button className="home-btn" onClick={() => onStartGame(false)}>
          2 Player Mode
        </button>
      </div>
    </div>
  );
}