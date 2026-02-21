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

// 1. Added pending fields to the state to track win data for the effect
const INITIAL_STATE = () => ({
  board: buildInitialBoard(),
  movesX: [],
  movesO: [],
  currentPlayer: "X",
  phase: "playing",
  winningCombo: null,
  pendingWinner: null, // New
  pendingCarry: null,  // New
});

export default function GameScreen({ vsComputer, onExit }) {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const timerRef = useRef(null);

  const warningCoord = (() => {
    const q = gameState.currentPlayer === "X" ? gameState.movesX : gameState.movesO;
    return getWarningCoord(q);
  })();

  // 2. NEW EFFECT: Handles the reset/loop logic after a win
  useEffect(() => {
    if (gameState.phase !== "victory") return;

    const { pendingWinner, pendingCarry } = gameState;
    
    // Update scores
    setScores((s) => ({ ...s, [pendingWinner]: s[pendingWinner] + 1 }));

    // Schedule the board reset
    timerRef.current = setTimeout(() => {
      triggerCarryover(pendingCarry[0], pendingCarry[1], pendingWinner);
    }, 1500);

    return () => clearTimeout(timerRef.current);
  }, [gameState.phase]); // Only runs when phase changes to "victory"

  // AI trigger effect
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
        // Just update state here; let the useEffect handle the timer/score
        return {
          ...prev,
          board: newBoard,
          movesX: newMovesX,
          movesO: newMovesO,
          winningCombo: winCombo,
          phase: "victory",
          pendingWinner: prev.currentPlayer,
          pendingCarry: [r, c],
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
      pendingWinner: null,
      pendingCarry: null,
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