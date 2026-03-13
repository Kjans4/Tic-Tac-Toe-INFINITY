import { useState } from "react";
import "../styles/home.css";

export default function HomeScreen({ onStartGame }) {
  const [howToOpen, setHowToOpen] = useState(false);

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

      <div className="how-to-play">
        <button
          className={`how-to-toggle ${howToOpen ? "how-to-toggle--open" : ""}`}
          onClick={() => setHowToOpen((prev) => !prev)}
        >
          <span>HOW TO PLAY</span>
          <span className="how-to-arrow">{howToOpen ? "▲" : "▼"}</span>
        </button>

        <div className={`how-to-body ${howToOpen ? "how-to-body--open" : ""}`}>
          <div className="how-to-content">

            <div className="how-to-rule">
              <p className="how-to-rule-title">THE ROLLING RULE</p>
              <p className="how-to-rule-text">
                Each player can only have 3 marks on the board at a time. When
                you place a 4th mark, your oldest mark vanishes automatically.
              </p>
              <p className="how-to-rule-text">
                A <span className="how-to-highlight how-to-highlight--pink">pink glow</span> warns
                you which of your marks will disappear on your next turn.
              </p>
            </div>

            <div className="how-to-divider" />

            <div className="how-to-rule">
              <p className="how-to-rule-title">THE INFINITY RULE</p>
              <p className="how-to-rule-text">
                When you win, your winning mark carries over to the fresh board
                to start the next round. The game never stops — chase the high
                score.
              </p>
            </div>

            <div className="how-to-divider" />

            <div className="how-to-rule">
              <p className="how-to-rule-title">COLORS</p>
              <div className="how-to-colors">
                <span className="how-to-highlight how-to-highlight--x">X — Red</span>
                <span className="how-to-highlight how-to-highlight--o">O — Blue</span>
                <span className="how-to-highlight how-to-highlight--gold">Win — Gold</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}