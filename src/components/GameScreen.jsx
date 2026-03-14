import { useState, useRef, useEffect } from "react";
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
  vanishedCoord: null,  // coord currently playing vanish animation
  newCoord: null,       // coord currently playing pop-in animation
});

export default function GameScreen({ vsComputer, onExit }) {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [scores, setScores] = useState({ X: 0, O: 0 });

  const totalScore = scores.X + scores.O;
  const difficulty = getDifficulty(scores.X);

  const timerRef = useRef(null);
  const vanishTimerRef = useRef(null);
  const newCoordTimerRef = useRef(null);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const warningCoord = (() => {
    const q = gameState.currentPlayer === "X" ? gameState.movesX : gameState.movesO;
    return getWarningCoord(q);
  })();

  // Victory effect
  useEffect(() => {
    if (gameState.phase !== "victory") return;

    const { pendingWinner, pendingCarry } = gameState;

    setScores((s) => ({ ...s, [pendingWinner]: s[pendingWinner] + 1 }));

    timerRef.current = setTimeout(() => {
      triggerCarryover(pendingCarry[0], pendingCarry[1], pendingWinner);
    }, 1500);

    return () => clearTimeout(timerRef.current);
  }, [gameState.phase]);

  // AI trigger effect
  useEffect(() => {
    if (!vsComputer) return;
    if (gameState.currentPlayer !== "O") return;
    if (gameState.phase !== "playing") return;

    timerRef.current = setTimeout(() => {
      const current = gameStateRef.current;
      if (current.phase !== "playing" || current.currentPlayer !== "O") return;

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

      const { newBoard, newMovesX, newMovesO, vanished } = recordMove(
        prev.board, prev.movesX, prev.movesO, prev.currentPlayer, r, c
      );

      const placedKey = coordKey(r, c);
      const winCombo = checkWinner(newBoard, prev.currentPlayer);

      // If a mark vanished, show vanish animation briefly then clear it
      if (vanished) {
        // Clear any previous vanish timer
        clearTimeout(vanishTimerRef.current);
        vanishTimerRef.current = setTimeout(() => {
          setGameState((s) => ({ ...s, vanishedCoord: null }));
        }, 250); // matches vanish-out animation duration
      }

      // Clear pop-in after animation completes
      clearTimeout(newCoordTimerRef.current);
      newCoordTimerRef.current = setTimeout(() => {
        setGameState((s) => ({ ...s, newCoord: null }));
      }, 300); // matches pop-in animation duration

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
          vanishedCoord: vanished || null,
          newCoord: placedKey,
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
        vanishedCoord: vanished || null,
        newCoord: placedKey,
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
      vanishedCoord: null,
      newCoord: key, // carryover mark also pops in
    });
  }

  function handleAgain() {
    clearTimeout(timerRef.current);
    clearTimeout(vanishTimerRef.current);
    clearTimeout(newCoordTimerRef.current);
    setGameState(INITIAL_STATE());
  }

  function handleResetScore() {
    setScores({ X: 0, O: 0 });
  }

  function handleExit() {
    clearTimeout(timerRef.current);
    clearTimeout(vanishTimerRef.current);
    clearTimeout(newCoordTimerRef.current);
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
        vanishedCoord={gameState.vanishedCoord}
        newCoord={gameState.newCoord}
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