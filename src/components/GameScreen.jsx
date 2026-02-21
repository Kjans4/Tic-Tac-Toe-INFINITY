import { useState, useRef, useEffect } from "react";
import {
  buildInitialBoard,
  recordMove,
  checkWinner,
  getWarningCoord,
  coordKey,
} from "../logic/gameLogic";
import { getAIMove } from "../logic/aiEngine";
import ScoreBoard from "./ScoreBoard";
import Board from "./Board";
import Controls from "./Controls";
import "../styles/game.css";

const INITIAL_STATE = () => ({
  board: buildInitialBoard(),
  movesX: [],
  movesO: [],
  currentPlayer: "X",
  phase: "playing",
  winningCombo: null,
});

export default function GameScreen({ vsComputer, onExit }) {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const timerRef = useRef(null);

  // Derived warning coord
  const warningCoord = (() => {
    const q = gameState.currentPlayer === "X" ? gameState.movesX : gameState.movesO;
    return getWarningCoord(q);
  })();

  // AI trigger
  useEffect(() => {
    if (
      vsComputer &&
      gameState.currentPlayer === "O" &&
      gameState.phase === "playing"
    ) {
      timerRef.current = setTimeout(() => {
        const moveKey = getAIMove(gameState.board, gameState.movesX, gameState.movesO);
        if (moveKey) {
          const [r, c] = moveKey.split(",").map(Number);
          processMove(r, c);
        }
      }, 400);
    }
    return () => clearTimeout(timerRef.current);
  }, [gameState.currentPlayer, gameState.phase]);

  function handleCellClick(r, c) {
    if (gameState.phase !== "playing") return;
    if (vsComputer && gameState.currentPlayer === "O") return;
    if (gameState.board[coordKey(r, c)] !== "") return;
    processMove(r, c);
  }

  function processMove(r, c) {
  setGameState((prev) => {
    if (prev.phase !== "playing") return prev;

    const { newBoard, newMovesX, newMovesO } = recordMove(
      prev.board, prev.movesX, prev.movesO, prev.currentPlayer, r, c
    );

    const winCombo = checkWinner(newBoard, prev.currentPlayer);

    if (winCombo) {
      const winner = prev.currentPlayer;

      timerRef.current = setTimeout(() => {
        setScores((s) => ({ ...s, [winner]: s[winner] + 1 })); // ← moved here
        triggerCarryover(r, c, winner);
      }, 1500);

      return {
        ...prev,
        board: newBoard,
        movesX: newMovesX,
        movesO: newMovesO,
        winningCombo: winCombo,
        phase: "victory",
      };
    }

    return {
      ...prev,
      board: newBoard,
      movesX: newMovesX,
      movesO: newMovesO,
      winningCombo: null,
      phase: "playing",
      currentPlayer: prev.currentPlayer === "X" ? "O" : "X",
    };
  });
}

  function triggerCarryover(r, c, winner) {
    const freshBoard = buildInitialBoard();
    const key = coordKey(r, c);
    freshBoard[key] = winner;

    const newMovesX = winner === "X" ? [key] : [];
    const newMovesO = winner === "O" ? [key] : [];
    const nextPlayer = winner === "X" ? "O" : "X";

    setGameState({
      board: freshBoard,
      movesX: newMovesX,
      movesO: newMovesO,
      currentPlayer: nextPlayer,
      phase: "playing",
      winningCombo: null,
    });
  }

  function handleAgain() {
    clearTimeout(timerRef.current);
    setGameState(INITIAL_STATE());
  }

  function handleResetScore() {
    setScores({ X: 0, O: 0 });
  }

  function handleExit() {
    clearTimeout(timerRef.current);
    onExit();
  }

  return (
    <div className="game-container">
      <p className="game-mode-label">INFINITY MODE</p>
      <ScoreBoard scores={scores} currentPlayer={gameState.currentPlayer} />
      <Board
        board={gameState.board}
        winningCombo={gameState.winningCombo}
        warningCoord={warningCoord}
        onCellClick={handleCellClick}
      />
      <Controls
        onAgain={handleAgain}
        onResetScore={handleResetScore}
        onExit={handleExit}
      />
    </div>
  );
}