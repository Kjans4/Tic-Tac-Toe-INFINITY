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
import HeartsDisplay from "./HeartsDisplay";
import CelebrationOverlay from "./CelebrationOverlay";
import RunOverScreen from "./RunOverScreen";
import "../styles/game.css";

const MAX_HEARTS    = 5;
const STARTING_HEARTS = 3;
const BEST_SCORE_KEY  = "ttt_infinity_best";

function getRandomHeartCoord(board, carryCoord) {
  const forbidden  = new Set(["1,1", carryCoord].filter(Boolean));
  const candidates = Object.keys(board).filter(
    (k) => board[k] === "" && !forbidden.has(k)
  );
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

const INITIAL_STATE = () => ({
  board:         buildInitialBoard(),
  movesX:        [],
  movesO:        [],
  currentPlayer: "X",
  phase:         "playing",
  winningCombo:  null,
  pendingWinner: null,
  pendingCarry:  null,
  vanishedCoord: null,
  newCoord:      null,
  heartCoord:    null,
});

export default function GameScreen({ vsComputer, onExit }) {
  const [gameState,    setGameState]    = useState(INITIAL_STATE);
  const [scores,       setScores]       = useState({ X: 0, O: 0 });
  const [hearts,       setHearts]       = useState(STARTING_HEARTS);
  const [heartAnimate, setHeartAnimate] = useState(null);
  const [winStreak,    setWinStreak]    = useState(0);
  const [runOver,      setRunOver]      = useState(false);
  const [bestScore,    setBestScore]    = useState(
    () => parseInt(localStorage.getItem(BEST_SCORE_KEY) || "0", 10)
  );
  const [celebration, setCelebration] = useState({
    visible:    false,
    mainText:   "",
    flavorText: "",
    isLoss:     false,
  });

  const roundInCycleRef    = useRef(0);
  const heartSpawnRoundRef = useRef(Math.random() < 0.5 ? 2 : 3);
  const difficulty         = getDifficulty(scores.X);

  const timerRef        = useRef(null);
  const vanishTimerRef  = useRef(null);
  const newCoordTimerRef = useRef(null);
  const heartAnimTimerRef = useRef(null);
  const gameStateRef    = useRef(gameState);

  const bags = useRef({
    xWin:       createShuffleBag(POOLS.xWin),
    sharedWin:  createShuffleBag(POOLS.sharedWin),
    aiWin:      createShuffleBag(POOLS.aiWin),
    flavorWin:  createShuffleBag(POOLS.flavorWin),
    flavorLose: createShuffleBag(POOLS.flavorLose),
  });

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const warningCoord = (() => {
    const q = gameState.currentPlayer === "X"
      ? gameState.movesX
      : gameState.movesO;
    return getWarningCoord(q);
  })();

  function triggerHeartAnimate(type) {
    setHeartAnimate(type);
    clearTimeout(heartAnimTimerRef.current);
    heartAnimTimerRef.current = setTimeout(() => setHeartAnimate(null), 500);
  }

  function spawnHeartIfNeeded(board, carryCoord) {
    roundInCycleRef.current += 1;

    if (roundInCycleRef.current === heartSpawnRoundRef.current) {
      const coord = getRandomHeartCoord(board, carryCoord);
      roundInCycleRef.current    = 0;
      heartSpawnRoundRef.current = Math.random() < 0.5 ? 2 : 3;
      return coord;
    }
    return null;
  }

  // Victory effect
  useEffect(() => {
    if (gameState.phase !== "victory") return;

    const { pendingWinner, pendingCarry } = gameState;
    const isAIWin     = vsComputer && pendingWinner === "O";
    const isPlayerWin = pendingWinner === "X";

    setScores((s) => {
      const newScores = { ...s, [pendingWinner]: s[pendingWinner] + 1 };

      if (vsComputer) {
        if (isPlayerWin) {
          // Passive heart gain — every 3 wins if below 3
          setWinStreak((prev) => {
            const newStreak = prev + 1;
            if (newStreak % 3 === 0) {
              setHearts((h) => {
                if (h < 3) {
                  triggerHeartAnimate("gain");
                  return h + 1;
                }
                return h;
              });
            }
            return newStreak;
          });
        } else {
          // AI won — lose 1 heart
          setHearts((h) => {
            const newH = h - 1;
            triggerHeartAnimate("lose");
            if (newH <= 0) {
              const finalScore = s.X;
              setBestScore((prev) => {
                const newBest = Math.max(prev, finalScore);
                localStorage.setItem(BEST_SCORE_KEY, String(newBest));
                return newBest;
              });
              timerRef.current = setTimeout(() => setRunOver(true), 1800);
            }
            return Math.max(newH, 0);
          });
        }
      }

      // Celebration text
      let mainText;
      if (isAIWin) {
        mainText = bags.current.aiWin.pick();
      } else if (vsComputer && isPlayerWin) {
        mainText = bags.current.xWin.pick();
      } else {
        mainText = `${pendingWinner}  —  ${bags.current.sharedWin.pick()}`;
      }

      const flavorText = isAIWin
        ? bags.current.flavorLose.pick()
        : bags.current.flavorWin.pick();

      setCelebration({
        visible:    true,
        mainText,
        flavorText,
        isLoss:     isAIWin,
      });

      return newScores;
    });

    // Carryover after celebration
    timerRef.current = setTimeout(() => {
      setCelebration({ visible: false, mainText: "", flavorText: "", isLoss: false });
      triggerCarryover(pendingCarry[0], pendingCarry[1], pendingWinner);
    }, 1800);

    return () => clearTimeout(timerRef.current);
  }, [gameState.phase]);

  // AI trigger
  useEffect(() => {
    if (!vsComputer)                      return;
    if (gameState.currentPlayer !== "O")  return;
    if (gameState.phase !== "playing")    return;

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
    if (gameState.phase !== "playing")                    return;
    if (vsComputer && gameState.currentPlayer === "O")    return;
    if (gameState.board[coordKey(r, c)] !== "")           return;
    processMove(r, c);
  }

  function processMove(r, c) {
    setGameState((prev) => {
      if (prev.phase !== "playing") return prev;

      const { newBoard, newMovesX, newMovesO, vanished } = recordMove(
        prev.board, prev.movesX, prev.movesO, prev.currentPlayer, r, c
      );

      const placedKey = coordKey(r, c);
      const winCombo  = checkWinner(newBoard, prev.currentPlayer);

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

      // Collect heart if player lands on it
      if (
        vsComputer &&
        prev.currentPlayer === "X" &&
        prev.heartCoord === placedKey
      ) {
        setHearts((h) => {
          if (h < MAX_HEARTS) {
            triggerHeartAnimate("gain");
            return h + 1;
          }
          return h;
        });
      }

      const newHeartCoord = prev.heartCoord === placedKey
        ? null
        : prev.heartCoord;

      if (winCombo) {
        return {
          ...prev,
          board:         newBoard,
          movesX:        newMovesX,
          movesO:        newMovesO,
          winningCombo:  winCombo,
          phase:         "victory",
          pendingWinner: prev.currentPlayer,
          pendingCarry:  [r, c],
          vanishedCoord: vanished || null,
          newCoord:      placedKey,
          heartCoord:    null,
        };
      }

      return {
        ...prev,
        board:         newBoard,
        movesX:        newMovesX,
        movesO:        newMovesO,
        winningCombo:  null,
        phase:         "playing",
        currentPlayer: prev.currentPlayer === "X" ? "O" : "X",
        vanishedCoord: vanished || null,
        newCoord:      placedKey,
        heartCoord:    newHeartCoord,
      };
    });
  }

  function triggerCarryover(r, c, winner) {
    const freshBoard = buildInitialBoard();
    const key        = coordKey(r, c);
    freshBoard[key]  = winner;

    const newMovesX  = winner === "X" ? [key] : [];
    const newMovesO  = winner === "O" ? [key] : [];
    const nextPlayer = winner === "X" ? "O" : "X";

    const heartCoord = vsComputer
      ? spawnHeartIfNeeded(freshBoard, key)
      : null;

    setGameState({
      board:         freshBoard,
      movesX:        newMovesX,
      movesO:        newMovesO,
      currentPlayer: nextPlayer,
      phase:         "playing",
      winningCombo:  null,
      pendingWinner: null,
      pendingCarry:  null,
      vanishedCoord: null,
      newCoord:      key,
      heartCoord:    heartCoord || null,
    });
  }

  function handleRestart() {
    clearTimeout(timerRef.current);
    clearTimeout(vanishTimerRef.current);
    clearTimeout(newCoordTimerRef.current);
    clearTimeout(heartAnimTimerRef.current);
    roundInCycleRef.current    = 0;
    heartSpawnRoundRef.current = Math.random() < 0.5 ? 2 : 3;
    setHearts(STARTING_HEARTS);
    setWinStreak(0);
    setScores({ X: 0, O: 0 });
    setRunOver(false);
    setCelebration({ visible: false, mainText: "", flavorText: "", isLoss: false });
    setGameState(INITIAL_STATE());
  }

  function handleAgain() {
    clearTimeout(timerRef.current);
    clearTimeout(vanishTimerRef.current);
    clearTimeout(newCoordTimerRef.current);
    clearTimeout(heartAnimTimerRef.current);
    setCelebration({ visible: false, mainText: "", flavorText: "", isLoss: false });
    setGameState(INITIAL_STATE());
  }

  function handleResetScore() {
    setScores({ X: 0, O: 0 });
    setWinStreak(0);
  }

  function handleExit() {
    clearTimeout(timerRef.current);
    clearTimeout(vanishTimerRef.current);
    clearTimeout(newCoordTimerRef.current);
    clearTimeout(heartAnimTimerRef.current);
    setCelebration({ visible: false, mainText: "", flavorText: "", isLoss: false });
    onExit();
  }

  return (
    <div className="game-container">
      <p className="game-mode-label">INFINITY MODE</p>

      {vsComputer && (
        <div className="game-meta-row">
          <HeartsDisplay
            hearts={hearts}
            maxHearts={MAX_HEARTS}
            animate={heartAnimate}
          />
          <span className={`difficulty-badge difficulty--${difficulty}`}>
            {difficulty.toUpperCase()}
          </span>
        </div>
      )}

      <ScoreBoard scores={scores} currentPlayer={gameState.currentPlayer} />
      <Board
        board={gameState.board}
        winningCombo={gameState.winningCombo}
        warningCoord={warningCoord}
        vanishedCoord={gameState.vanishedCoord}
        newCoord={gameState.newCoord}
        heartCoord={vsComputer ? gameState.heartCoord : null}
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
        flavorText={celebration.flavorText}
        isLoss={celebration.isLoss}
      />

      <RunOverScreen
        visible={runOver}
        playerScore={scores.X}
        bestScore={bestScore}
        onRestart={handleRestart}
      />
    </div>
  );
}