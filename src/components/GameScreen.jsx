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
import { useAudio }                   from "../logic/useAudio";
import ScoreBoard                     from "./ScoreBoard";
import Board                          from "./Board";
import Controls                       from "./Controls";
import HeartsDisplay                  from "./HeartsDisplay";
import CelebrationOverlay             from "./CelebrationOverlay";
import "../styles/game.css";

const MAX_HEARTS      = 5;
const STARTING_HEARTS = 3;
const BEST_SCORE_KEY  = "ttt_infinity_best";

function nextSpawnRound() {
  return 3 + Math.floor(Math.random() * 3);
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
  phase:         "playing",
  winningCombo:  null,
  pendingWinner: null,
  pendingCarry:  null,
  vanishedCoord: null,
  newCoord:      null,
  heartCoord:    null,
});

export default function GameScreen({ vsComputer, onExit, onRunOver }) {
  const [game,         setGame]         = useState(INITIAL_GAME);
  const [scores,       setScores]       = useState({ X: 0, O: 0 });
  const [hearts,       setHearts]       = useState(STARTING_HEARTS);
  const [heartAnimate, setHeartAnimate] = useState(null);
  const [winStreak,    setWinStreak]    = useState(0);
  const [celebration,  setCelebration]  = useState({
    visible: false, mainText: "", flavorText: "", isLoss: false,
  });

  // ── Stable refs ───────────────────────────────────────────────────
  const heartsRef    = useRef(STARTING_HEARTS);
  const winStreakRef = useRef(0);
  const scoresRef    = useRef({ X: 0, O: 0 });
  const gameRef      = useRef(game);

  useEffect(() => { heartsRef.current    = hearts;    }, [hearts]);
  useEffect(() => { winStreakRef.current = winStreak; }, [winStreak]);
  useEffect(() => { scoresRef.current    = scores;    }, [scores]);
  useEffect(() => { gameRef.current      = game;      }, [game]);

  // ── Timer refs ────────────────────────────────────────────────────
  const mainTimerRef      = useRef(null);
  const vanishTimerRef    = useRef(null);
  const newCoordTimerRef  = useRef(null);
  const heartAnimTimerRef = useRef(null);

  // ── Heart spawn cycle ─────────────────────────────────────────────
  const roundInCycleRef = useRef(0);
  const spawnRoundRef   = useRef(nextSpawnRound());

  // ── Shuffle bags ──────────────────────────────────────────────────
  const bags = useRef({
    xWin:       createShuffleBag(POOLS.xWin),
    sharedWin:  createShuffleBag(POOLS.sharedWin),
    aiWin:      createShuffleBag(POOLS.aiWin),
    flavorWin:  createShuffleBag(POOLS.flavorWin),
    flavorLose: createShuffleBag(POOLS.flavorLose),
  });

  // ── Audio ─────────────────────────────────────────────────────────
  const { play, resume } = useAudio();

  const difficulty   = getDifficulty(scores.X);
  const warningCoord = (() => {
    const q = game.currentPlayer === "X" ? game.movesX : game.movesO;
    return getWarningCoord(q);
  })();

  // ── Helpers ───────────────────────────────────────────────────────
  function flashHeart(type) {
    clearTimeout(heartAnimTimerRef.current);
    setHeartAnimate(type);
    heartAnimTimerRef.current = setTimeout(() => setHeartAnimate(null), 600);
  }

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

  function clearAllTimers() {
    clearTimeout(mainTimerRef.current);
    clearTimeout(vanishTimerRef.current);
    clearTimeout(newCoordTimerRef.current);
    clearTimeout(heartAnimTimerRef.current);
  }

  // ── Victory effect ────────────────────────────────────────────────
  useEffect(() => {
    if (game.phase !== "victory") return;

    const { pendingWinner, pendingCarry } = game;
    const isAIWin     = vsComputer && pendingWinner === "O";
    const isPlayerWin = vsComputer && pendingWinner === "X";

    // 1. Scores
    const newScores = {
      X: scoresRef.current.X + (pendingWinner === "X" ? 1 : 0),
      O: scoresRef.current.O + (pendingWinner === "O" ? 1 : 0),
    };
    setScores(newScores);

    // 2. Hearts + SFX
    if (vsComputer) {
      if (isAIWin) {
        const next = Math.max(heartsRef.current - 1, 0);
        setHearts(next);
        flashHeart("lose");
        play("heartLose", 0.6);

        if (next === 0) {
          const finalScore  = scoresRef.current.X;
          const currentBest = parseInt(localStorage.getItem(BEST_SCORE_KEY) || "0", 10);
          const newBest     = Math.max(currentBest, finalScore);
          localStorage.setItem(BEST_SCORE_KEY, String(newBest));
          play("gameOver", 0.9);

          mainTimerRef.current = setTimeout(() => {
            onRunOver({
              playerScore: finalScore,
              bestScore:   newBest,
              onRestart:   handleRestart,
            });
          }, 1900);
        }
      } else if (isPlayerWin) {
        const newStreak = winStreakRef.current + 1;
        setWinStreak(newStreak);
        if (newStreak % 3 === 0 && heartsRef.current < 3) {
          setHearts(heartsRef.current + 1);
          flashHeart("gain");
          play("heartGain", 0.7);
        }
      }
    }

    // 3. Celebration text + SFX
    let mainText;
    if (isAIWin) {
      mainText = bags.current.aiWin.pick();
      play("lose", 0.7);
    } else if (isPlayerWin) {
      mainText = bags.current.xWin.pick();
      play("win", 0.8);
    } else {
      mainText = `${pendingWinner} — ${bags.current.sharedWin.pick()}`;
      play("win", 0.8);
    }

    const flavorText = isAIWin
      ? bags.current.flavorLose.pick()
      : bags.current.flavorWin.pick();

    setCelebration({ visible: true, mainText, flavorText, isLoss: isAIWin });

    // 4. Carryover
    mainTimerRef.current = setTimeout(() => {
      setCelebration({ visible: false, mainText: "", flavorText: "", isLoss: false });
      doCarryover(pendingCarry[0], pendingCarry[1], pendingWinner);
    }, 1800);

    return () => clearTimeout(mainTimerRef.current);
  }, [game.phase]);

  // ── AI trigger ────────────────────────────────────────────────────
  useEffect(() => {
    if (!vsComputer || game.currentPlayer !== "O" || game.phase !== "playing") return;

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
    resume(); // unblock browser autoplay on first user gesture
    if (game.phase !== "playing")                 return;
    if (vsComputer && game.currentPlayer === "O") return;
    if (game.board[coordKey(r, c)] !== "")        return;
    doMove(r, c);
  }

  // ── Core move ─────────────────────────────────────────────────────
  function doMove(r, c) {
    setGame((prev) => {
      if (prev.phase !== "playing") return prev;

      const placedKey = coordKey(r, c);
      const { newBoard, newMovesX, newMovesO, vanished } = recordMove(
        prev.board, prev.movesX, prev.movesO, prev.currentPlayer, r, c
      );

      // Vanish timer
      if (vanished) {
        clearTimeout(vanishTimerRef.current);
        vanishTimerRef.current = setTimeout(
          () => setGame((s) => ({ ...s, vanishedCoord: null })),
          260
        );
      }

      // Pop-in timer
      clearTimeout(newCoordTimerRef.current);
      newCoordTimerRef.current = setTimeout(
        () => setGame((s) => ({ ...s, newCoord: null })),
        320
      );

      // SFX — click on every placement
      play("click", 0.5);

      // SFX — warning when oldest mark is about to vanish
      const currentQueue = prev.currentPlayer === "X" ? prev.movesX : prev.movesO;
      if (currentQueue.length === 3) play("warning", 0.6);

      // Heart collection — player (X) only
      const isHeartCell = (
        vsComputer &&
        prev.currentPlayer === "X" &&
        prev.heartCoord === placedKey &&
        heartsRef.current < MAX_HEARTS
      );
      if (isHeartCell) {
        setHearts(heartsRef.current + 1);
        flashHeart("gain");
        play("heartGain", 0.7);
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
    play("whoosh", 0.5);

    const freshBoard = buildInitialBoard();
    const key        = coordKey(r, c);
    freshBoard[key]  = winner;
    const nextPlayer = winner === "X" ? "O" : "X";
    const heartCoord = maybeSpawnHeart(freshBoard, key);

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
  function handleRestart() {
    clearAllTimers();
    roundInCycleRef.current = 0;
    spawnRoundRef.current   = nextSpawnRound();
    setHearts(STARTING_HEARTS);
    setWinStreak(0);
    setScores({ X: 0, O: 0 });
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
    </div>
  );
}