import { useState } from "react";
import HomeScreen from "./components/HomeScreen";
import GameScreen from "./components/GameScreen";
import RunOverScreen from "./components/RunOverScreen";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [vsComputer, setVsComputer] = useState(false);
  const [runOverData, setRunOverData] = useState(null);

  // --- Handlers ---

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

      {/* RunOverScreen is rendered at the top level to avoid CSS 
          transform/stacking context issues within the app-wrapper.
      */}
      {runOverData && (
        <RunOverScreen
          visible={true}
          playerScore={runOverData.playerScore}
          bestScore={runOverData.bestScore}
          onRestart={() => {
            handleRestart();         // Clears the overlay
            runOverData.onRestart(); // Resets the GameScreen state
          }}
          onExit={() => {
            handleRestart();         // Clears the overlay
            handleGoHome();          // Returns to Home Screen
          }}
        />
      )}
    </>
  );
}