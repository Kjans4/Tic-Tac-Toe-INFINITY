function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createShuffleBag(pool) {
  let bag = shuffle([...pool]);
  return {
    pick() {
      if (bag.length === 0) bag = shuffle([...pool]);
      return bag.pop();
    },
  };
}

// --- Text Pools ---

// vs Computer only
export const POOLS = {
  xWin: [
    "FLAWLESS",
    "INFINITY ACHIEVED",
    "MARK SECURED",
    "ROUND CLAIMED",
    "LOCKED IN",
  ],
  aiWin: [
    "ELIMINATED",
    "OVERWRITTEN",
    "WIPED OUT",
    "ERASED",
    "SYSTEM WINS",
  ],

  // 2 Player — one shared pool, winner symbol prefixed dynamically
  sharedWin: [
    "FLAWLESS",
    "INFINITY ACHIEVED",
    "MARK SECURED",
    "ROUND CLAIMED",
    "LOCKED IN",
    "DOMINANT",
    "CALCULATED",
    "PRECISION PLAY",
    "UNSTOPPABLE",
    "ZERO DOUBT",
  ],

  // Flavor — win
  flavorWin: [
    "CARRY THE MARK",
    "THE BOARD RESETS",
    "ANOTHER ROUND BEGINS",
    "THE CYCLE CONTINUES",
    "INFINITY ROLLS ON",
  ],

  // Flavor — AI wins
  flavorLose: [
    "THE MACHINE ADVANCES",
    "RESISTANCE FAILED",
    "TRY AGAIN",
    "THE SYSTEM HOLDS",
    "NO ESCAPE",
  ],
};