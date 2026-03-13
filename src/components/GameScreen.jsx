import { useState, useRef, useEffect, useCallback } from "react";
import {
  buildInitialBoard,
  recordMove,
  checkWinner,
  getWarningCoord,
  coordKey,
} from "../logic/gameLogic";
import { getAIMove, getDifficulty } from "../logic/aiEngine";
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
  pendingWinner: null,
  pendingCarry: null,
});

export default function GameScreen({ vsComputer, onExit }) {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [scores, setScores] = useState({ X: 0, O: 0 });

  const totalScore = scores.X + scores.O;
  const difficulty = getDifficulty(scores.X);

  const timerRef = useRef(null);

  // Keep a ref to latest gameState so setTimeout callbacks
  // never read stale closures
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const warningCoord = (() => {
    const q = gameState.currentPlayer === "X" ? gameState.movesX : gameState.movesO;
    return getWarningCoord(q);
  })();

  // Victory effect — score + carryover
  useEffect(() => {
    if (gameState.phase !== "victory") return;

    const { pendingWinner, pendingCarry } = gameState;

    setScores((s) => ({ ...s, [pendingWinner]: s[pendingWinner] + 1 }));

    timerRef.current = setTimeout(() => {
      triggerCarryover(pendingCarry[0], pendingCarry[1], pendingWinner);
    }, 1500);

    return () => clearTimeout(timerRef.current);
  }, [gameState.phase]);

  // AI trigger effect — removed totalScore from deps to prevent
  // re-firing when score updates mid-round
  useEffect(() => {
    if (!vsComputer) return;
    if (gameState.currentPlayer !== "O") return;
    if (gameState.phase !== "playing") return;

    timerRef.current = setTimeout(() => {
      // Read from ref so we always get the latest state
      const current = gameStateRef.current;
      if (current.phase !== "playing" || current.currentPlayer !== "O") return;

      const currentTotal = current.pendingWinner
        ? scores.X + scores.O
        : totalScore;

      const moveKey = getAIMove(
        current.board,
        current.movesX,
        current.movesO,
        scores.X
      );

      if (moveKey) {
        const [r, c] = moveKey.split(",").map(Number);
        processMove(r, c);
      }
    }, 400);

    return () => clearTimeout(timerRef.current);
  // totalScore deliberately excluded — we don't want AI re-triggering
  // just because the score changed
  }, [gameState.currentPlayer, gameState.phase, vsComputer]);

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

      {vsComputer && (
        <span className={`difficulty-badge difficulty--${difficulty}`}>
          {difficulty.toUpperCase()}
        </span>
      )}

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