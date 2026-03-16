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

            {/* Rolling Rule */}
            <div className="how-to-rule">
              <p className="how-to-rule-title">THE ROLLING RULE</p>
              <p className="how-to-rule-text">
                Each player can only have 3 marks on the board at a time. When
                you place a 4th mark, your oldest mark vanishes automatically.
              </p>
              <p className="how-to-rule-text">
                A{" "}
                <span className="how-to-highlight how-to-highlight--pink">
                  faint glow
                </span>{" "}
                warns you which of your marks will disappear on your next turn.
                The glow color matches your symbol — red for X, blue for O.
              </p>
            </div>

            <div className="how-to-divider" />

            {/* Infinity Rule */}
            <div className="how-to-rule">
              <p className="how-to-rule-title">THE INFINITY RULE</p>
              <p className="how-to-rule-text">
                When you win, your winning mark carries over to the fresh board
                to start the next round. The game never stops — chase the high
                score.
              </p>
            </div>

            <div className="how-to-divider" />

            {/* Heart System */}
            <div className="how-to-rule">
              <p className="how-to-rule-title">HEARTS (VS COMPUTER)</p>
              <p className="how-to-rule-text">
                You start each run with 3 hearts. Lose 1 heart every time the
                AI wins a round. When all hearts are gone the run is over.
              </p>
              <p className="how-to-rule-text">
                Gain hearts two ways: land your mark on a{" "}
                <span className="how-to-highlight how-to-highlight--heart">
                  ♥ heart cell
                </span>{" "}
                that randomly appears on the board, or win 3 rounds in a row to
                earn 1 back passively. Hearts cap at 5.
              </p>
              <p className="how-to-rule-text">
                If the AI lands on the heart cell first it disappears — nobody
                gets it.
              </p>
            </div>

            <div className="how-to-divider" />

            {/* Difficulty */}
            <div className="how-to-rule">
              <p className="how-to-rule-title">DIFFICULTY (VS COMPUTER)</p>
              <p className="how-to-rule-text">
                The AI gets harder as your score grows. Only your wins count —
                the AI winning more does not change the difficulty.
              </p>
              <div className="how-to-difficulty">
                <div className="how-to-diff-row">
                  <span className="how-to-highlight how-to-highlight--easy">EASY</span>
                  <span className="how-to-rule-text">Score 0 – 2. Random moves.</span>
                </div>
                <div className="how-to-diff-row">
                  <span className="how-to-highlight how-to-highlight--medium">MEDIUM</span>
                  <span className="how-to-rule-text">Score 3 – 7. Win, block, center.</span>
                </div>
                <div className="how-to-diff-row">
                  <span className="how-to-highlight how-to-highlight--hard">HARD</span>
                  <span className="how-to-rule-text">Score 8+. Simulates the rolling mechanic.</span>
                </div>
              </div>
            </div>

            <div className="how-to-divider" />

            {/* Colors */}
            <div className="how-to-rule">
              <p className="how-to-rule-title">COLORS</p>
              <div className="how-to-colors">
                <span className="how-to-highlight how-to-highlight--x">X — Red</span>
                <span className="how-to-highlight how-to-highlight--o">O — Blue</span>
                <span className="how-to-highlight how-to-highlight--gold">Win — Gold</span>
                <span className="how-to-highlight how-to-highlight--heart">♥ — Heart</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}