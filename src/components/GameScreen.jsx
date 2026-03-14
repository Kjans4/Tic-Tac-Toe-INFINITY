import { useState, useRef, useEffect } from "react";
import {
  buildInitialBoard,
  recordMove,
  checkWinner,
  getWarningCoord,
  coordKey,
} from "../logic/gameLogic";
import { getAIMove, getDifficulty } from "../logic/aiEngine";
import { createShuffleBag, POOLS } from "../logic/shuffleBag";
import ScoreBoard from "./ScoreBoard";
import Board from "./Board";
import Controls from "./Controls";
import CelebrationOverlay from "./CelebrationOverlay";
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
  vanishedCoord: null,
  newCoord: null,
});

export default function GameScreen({ vsComputer, onExit }) {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [celebration, setCelebration] = useState({
    visible: false,
    mainText: "",
    flavorText: "",
    isLoss: false,
  });

  const difficulty = getDifficulty(scores.X);

  const timerRef = useRef(null);
  const vanishTimerRef = useRef(null);
  const newCoordTimerRef = useRef(null);
  const gameStateRef = useRef(gameState);

  // Shuffle bags — one per pool, persist across rounds
  const bags = useRef({
    xWin:      createShuffleBag(POOLS.xWin),
    oWin:      createShuffleBag(POOLS.oWin),
    aiWin:     createShuffleBag(POOLS.aiWin),
    flavorWin:  createShuffleBag(POOLS.flavorWin),
    flavorLose: createShuffleBag(POOLS.flavorLose),
  });

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

    // Update scores
    setScores((s) => {
      const newScores = { ...s, [pendingWinner]: s[pendingWinner] + 1 };

      // Pick celebration texts based on who won and game mode
      const isAIWin = vsComputer && pendingWinner === "O";
      const is2PlayerOWin = !vsComputer && pendingWinner === "O";

      let mainText;
      if (isAIWin) {
        mainText = bags.current.aiWin.pick();
      } else if (pendingWinner === "X") {
        mainText = bags.current.xWin.pick();
      } else {
        mainText = bags.current.oWin.pick();
      }

      const flavorText = isAIWin
        ? bags.current.flavorLose.pick()
        : bags.current.flavorWin.pick();

      setCelebration({
        visible: true,
        mainText,
        scores: newScores,  // use updated scores for display
        flavorText,
        isLoss: isAIWin,
      });

      return newScores;
    });

    timerRef.current = setTimeout(() => {
      setCelebration((prev) => ({ ...prev, visible: false }));
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

      if (vanished) {
        clearTimeout(vanishTimerRef.current);
        vanishTimerRef.current = setTimeout(() => {
          setGameState((s) => ({ ...s, vanishedCoord: null }));
        }, 250);
      }

      clearTimeout(newCoordTimerRef.current);
      newCoordTimerRef.current = setTimeout(() => {
        setGameState((s) => ({ ...s, newCoord: null }));
      }, 300);

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
      newCoord: key,
    });
  }

  function handleAgain() {
    clearTimeout(timerRef.current);
    clearTimeout(vanishTimerRef.current);
    clearTimeout(newCoordTimerRef.current);
    setCelebration({ visible: false, mainText: "", flavorText: "", isLoss: false });
    setGameState(INITIAL_STATE());
  }

  function handleResetScore() {
    setScores({ X: 0, O: 0 });
  }

  function handleExit() {
    clearTimeout(timerRef.current);
    clearTimeout(vanishTimerRef.current);
    clearTimeout(newCoordTimerRef.current);
    setCelebration({ visible: false, mainText: "", flavorText: "", isLoss: false });
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

      <CelebrationOverlay
        visible={celebration.visible}
        mainText={celebration.mainText}
        scores={celebration.scores || scores}
        flavorText={celebration.flavorText}
        isLoss={celebration.isLoss}
      />
    </div>
  );
}