import { useState, useRef, useEffect } from "react";
import {
  buildInitialBoard,
  recordMove,
  checkWinner,
  getWarningCoord,
  coordKey,
} from "../logic/gameLogic";
import { getAIMove, getDifficulty }   from "../logic/aiEngine";
import { createShuffleBag, POOLS }    from "../logic/shuffleBag";
import ScoreBoard                     from "./ScoreBoard";
import Board                          from "./Board";
import Controls                       from "./Controls";
import HeartsDisplay                  from "./HeartsDisplay";
import CelebrationOverlay             from "./CelebrationOverlay";
import RunOverScreen                  from "./RunOverScreen";
import "../styles/game.css";

const MAX_HEARTS      = 5;
const STARTING_HEARTS = 3;
const BEST_SCORE_KEY  = "ttt_infinity_best";

// Round 3, 4, or 5 — lower spawn rate than before
function nextSpawnRound() {
  return 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
}

function getRandomHeartCoord(board, carryCoord) {
  const forbidden  = new Set(["1,1", carryCoord].filter(Boolean));
  const candidates = Object.keys(board).filter(
    (k) => board[k] === "" && !forbidden.has(k)
  );
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

const INITIAL_GAME = () => ({
  board:         buildInitialBoard(),
  movesX:        [],
  movesO:        [],
  currentPlayer: "X",
  phase:         "playing",  // "playing" | "victory"
  winningCombo:  null,
  pendingWinner: null,
  pendingCarry:  null,
  vanishedCoord: null,
  newCoord:      null,
  heartCoord:    null,
});

export default function GameScreen({ vsComputer, onExit }) {
  // ── Core game state ──────────────────────────────────────────────
  const [game,        setGame]        = useState(INITIAL_GAME);
  const [scores,      setScores]      = useState({ X: 0, O: 0 });

  // ── Heart system state ───────────────────────────────────────────
  const [hearts,       setHearts]      = useState(STARTING_HEARTS);
  const [heartAnimate, setHeartAnimate]= useState(null); // "gain"|"lose"|null
  const [winStreak,    setWinStreak]   = useState(0);
  const [runOver,      setRunOver]     = useState(false);
  const [bestScore,    setBestScore]   = useState(
    () => parseInt(localStorage.getItem(BEST_SCORE_KEY) || "0", 10)
  );

  // ── Celebration state ────────────────────────────────────────────
  const [celebration, setCelebration] = useState({
    visible: false, mainText: "", flavorText: "", isLoss: false,
  });

  // ── Refs ─────────────────────────────────────────────────────────
  // Stable value refs — always current, safe to read inside callbacks
  const heartsRef    = useRef(STARTING_HEARTS);
  const winStreakRef = useRef(0);
  const scoresRef    = useRef({ X: 0, O: 0 });
  const gameRef      = useRef(game);

  // Keep refs in sync
  useEffect(() => { heartsRef.current    = hearts;  }, [hearts]);
  useEffect(() => { winStreakRef.current = winStreak; }, [winStreak]);
  useEffect(() => { scoresRef.current    = scores;  }, [scores]);
  useEffect(() => { gameRef.current      = game;    }, [game]);

  // Timer refs
  const mainTimerRef      = useRef(null);
  const vanishTimerRef    = useRef(null);
  const newCoordTimerRef  = useRef(null);
  const heartAnimTimerRef = useRef(null);

  // Heart spawn cycle
  const roundInCycleRef = useRef(0);
  const spawnRoundRef   = useRef(nextSpawnRound());

  // Shuffle bags
  const bags = useRef({
    xWin:       createShuffleBag(POOLS.xWin),
    sharedWin:  createShuffleBag(POOLS.sharedWin),
    aiWin:      createShuffleBag(POOLS.aiWin),
    flavorWin:  createShuffleBag(POOLS.flavorWin),
    flavorLose: createShuffleBag(POOLS.flavorLose),
  });

  const difficulty = getDifficulty(scores.X);

  const warningCoord = (() => {
    const q = game.currentPlayer === "X" ? game.movesX : game.movesO;
    return getWarningCoord(q);
  })();

  // ── Heart animation helper ────────────────────────────────────────
  function flashHeart(type) {
    clearTimeout(heartAnimTimerRef.current);
    setHeartAnimate(type);
    heartAnimTimerRef.current = setTimeout(() => setHeartAnimate(null), 600);
  }

  // ── Heart spawn helper ────────────────────────────────────────────
  function maybeSpawnHeart(board, carryCoord) {
    if (!vsComputer) return null;
    roundInCycleRef.current += 1;
    if (roundInCycleRef.current >= spawnRoundRef.current) {
      roundInCycleRef.current = 0;
      spawnRoundRef.current   = nextSpawnRound();
      return getRandomHeartCoord(board, carryCoord);
    }
    return null;
  }

  // ── Victory effect ────────────────────────────────────────────────
  // Fires once when phase flips to "victory".
  // ALL heart changes happen here — no nested setState.
  useEffect(() => {
    if (game.phase !== "victory") return;

    const { pendingWinner, pendingCarry } = game;
    const isAIWin     = vsComputer && pendingWinner === "O";
    const isPlayerWin = vsComputer && pendingWinner === "X";

    // ── 1. Score update ──
    const newScores = {
      X: scoresRef.current.X + (pendingWinner === "X" ? 1 : 0),
      O: scoresRef.current.O + (pendingWinner === "O" ? 1 : 0),
    };
    setScores(newScores);

    // ── 2. Heart update — one block, no nesting ──
    if (vsComputer) {
      if (isAIWin) {
        // Lose exactly 1
        const next = Math.max(heartsRef.current - 1, 0);
        setHearts(next);
        flashHeart("lose");

        if (next === 0) {
          // Save best score using the score BEFORE this round incremented O
          const finalScore = scoresRef.current.X;
          const newBest    = Math.max(parseInt(localStorage.getItem(BEST_SCORE_KEY) || "0", 10), finalScore);
          localStorage.setItem(BEST_SCORE_KEY, String(newBest));
          setBestScore(newBest);
          // Show run over after celebration finishes
          mainTimerRef.current = setTimeout(() => setRunOver(true), 1900);
        }
      } else if (isPlayerWin) {
        // Passive gain: every 3 wins, only if below 3
        const newStreak = winStreakRef.current + 1;
        setWinStreak(newStreak);
        if (newStreak % 3 === 0 && heartsRef.current < 3) {
          const next = heartsRef.current + 1;
          setHearts(next);
          flashHeart("gain");
        }
      }
    }

    // ── 3. Celebration ──
    let mainText;
    if (isAIWin) {
      mainText = bags.current.aiWin.pick();
    } else if (isPlayerWin) {
      mainText = bags.current.xWin.pick();
    } else {
      mainText = `${pendingWinner}  —  ${bags.current.sharedWin.pick()}`;
    }
    const flavorText = isAIWin
      ? bags.current.flavorLose.pick()
      : bags.current.flavorWin.pick();

    setCelebration({ visible: true, mainText, flavorText, isLoss: isAIWin });

    // ── 4. Next round after delay ──
    mainTimerRef.current = setTimeout(() => {
      setCelebration({ visible: false, mainText: "", flavorText: "", isLoss: false });
      doCarryover(pendingCarry[0], pendingCarry[1], pendingWinner);
    }, 1800);

    return () => clearTimeout(mainTimerRef.current);
  }, [game.phase]);

  // ── AI trigger ────────────────────────────────────────────────────
  useEffect(() => {
    if (!vsComputer)                    return;
    if (game.currentPlayer !== "O")     return;
    if (game.phase !== "playing")       return;

    mainTimerRef.current = setTimeout(() => {
      const g = gameRef.current;
      if (g.phase !== "playing" || g.currentPlayer !== "O") return;

      const moveKey = getAIMove(g.board, g.movesX, g.movesO, scoresRef.current.X);
      if (moveKey) {
        const [r, c] = moveKey.split(",").map(Number);
        doMove(r, c);
      }
    }, 400);

    return () => clearTimeout(mainTimerRef.current);
  }, [game.currentPlayer, game.phase, vsComputer]);

  // ── Click handler ─────────────────────────────────────────────────
  function handleCellClick(r, c) {
    if (game.phase !== "playing")                 return;
    if (vsComputer && game.currentPlayer === "O") return;
    if (game.board[coordKey(r, c)] !== "")        return;
    doMove(r, c);
  }

  // ── Core move processor ───────────────────────────────────────────
  function doMove(r, c) {
    setGame((prev) => {
      if (prev.phase !== "playing") return prev;

      const placedKey = coordKey(r, c);
      const { newBoard, newMovesX, newMovesO, vanished } = recordMove(
        prev.board, prev.movesX, prev.movesO, prev.currentPlayer, r, c
      );

      // Vanish animation timer
      if (vanished) {
        clearTimeout(vanishTimerRef.current);
        vanishTimerRef.current = setTimeout(
          () => setGame((s) => ({ ...s, vanishedCoord: null })),
          260
        );
      }

      // Pop-in animation timer
      clearTimeout(newCoordTimerRef.current);
      newCoordTimerRef.current = setTimeout(
        () => setGame((s) => ({ ...s, newCoord: null })),
        320
      );

      // Heart cell collection — only player (X), only active cell
      // Exactly one setHearts call, zero nesting
      const isHeartCell = (
        vsComputer &&
        prev.currentPlayer === "X" &&
        prev.heartCoord === placedKey
      );
      if (isHeartCell && heartsRef.current < MAX_HEARTS) {
        setHearts(heartsRef.current + 1);
        flashHeart("gain");
      }

      const newHeartCoord = prev.heartCoord === placedKey ? null : prev.heartCoord;
      const winCombo      = checkWinner(newBoard, prev.currentPlayer);

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

  // ── Carryover ─────────────────────────────────────────────────────
  function doCarryover(r, c, winner) {
    const freshBoard    = buildInitialBoard();
    const key           = coordKey(r, c);
    freshBoard[key]     = winner;
    const nextPlayer    = winner === "X" ? "O" : "X";
    const heartCoord    = maybeSpawnHeart(freshBoard, key);

    setGame({
      board:         freshBoard,
      movesX:        winner === "X" ? [key] : [],
      movesO:        winner === "O" ? [key] : [],
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

  // ── Control handlers ──────────────────────────────────────────────
  function clearAllTimers() {
    clearTimeout(mainTimerRef.current);
    clearTimeout(vanishTimerRef.current);
    clearTimeout(newCoordTimerRef.current);
    clearTimeout(heartAnimTimerRef.current);
  }

  function handleRestart() {
    clearAllTimers();
    roundInCycleRef.current = 0;
    spawnRoundRef.current   = nextSpawnRound();
    setHearts(STARTING_HEARTS);
    setWinStreak(0);
    setScores({ X: 0, O: 0 });
    setRunOver(false);
    setCelebration({ visible: false, mainText: "", flavorText: "", isLoss: false });
    setGame(INITIAL_GAME());
  }

  function handleAgain() {
    clearAllTimers();
    setCelebration({ visible: false, mainText: "", flavorText: "", isLoss: false });
    setGame(INITIAL_GAME());
  }

  function handleResetScore() {
    setScores({ X: 0, O: 0 });
    setWinStreak(0);
  }

  function handleExit() {
    clearAllTimers();
    setCelebration({ visible: false, mainText: "", flavorText: "", isLoss: false });
    onExit();
  }

  // ── Render ────────────────────────────────────────────────────────
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

      <ScoreBoard scores={scores} currentPlayer={game.currentPlayer} />

      <Board
        board={game.board}
        winningCombo={game.winningCombo}
        warningCoord={warningCoord}
        vanishedCoord={game.vanishedCoord}
        newCoord={game.newCoord}
        heartCoord={vsComputer ? game.heartCoord : null}
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