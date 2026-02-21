import { useState } from "react";
import HomeScreen from "./components/HomeScreen";
import GameScreen from "./components/GameScreen";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [vsComputer, setVsComputer] = useState(false);

  function handleStartGame(vsComp) {
    setVsComputer(vsComp);
    setScreen("game");
  }

  function handleGoHome() {
    setScreen("home");
  }

  return (
    <div className="app-wrapper">
      {screen === "home" ? (
        <HomeScreen onStartGame={handleStartGame} />
      ) : (
        <GameScreen vsComputer={vsComputer} onExit={handleGoHome} />
      )}
    </div>
  );
}