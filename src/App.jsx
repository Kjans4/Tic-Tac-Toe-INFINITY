import { useState } from "react";
import HomeScreen from "./components/HomeScreen";
import GameScreen from "./components/GameScreen";
import RunOverScreen from "./components/RunOverScreen";

export default function App() {
  const [screen,     setScreen]     = useState("home");
  const [vsComputer, setVsComputer] = useState(false);
  const [runOverData, setRunOverData] = useState(null);
  // runOverData: { playerScore, bestScore, onRestart } | null

  function handleStartGame(vsComp) {
    setVsComputer(vsComp);
    setScreen("game");
  }

  function handleGoHome() {
    setScreen("home");
  }

  function handleRunOver(data) {
    setRunOverData(data);
  }

  function handleRestart() {
    setRunOverData(null);
  }

  return (
    <>
      <div className="app-wrapper">
        {screen === "home" ? (
          <HomeScreen onStartGame={handleStartGame} />
        ) : (
          <GameScreen
            vsComputer={vsComputer}
            onExit={handleGoHome}
            onRunOver={handleRunOver}
          />
        )}
      </div>

      {/* Rendered outside app-wrapper so fixed positioning
          is never trapped by the float transform */}
      {runOverData && (
        <RunOverScreen
          visible={true}
          playerScore={runOverData.playerScore}
          bestScore={runOverData.bestScore}
          onRestart={() => {
            handleRestart();
            runOverData.onRestart();
          }}
        />
      )}
    </>
  );
}