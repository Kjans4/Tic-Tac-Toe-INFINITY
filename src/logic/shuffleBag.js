// Shuffle an array in place using Fisher-Yates
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Creates a shuffle bag from a pool of texts.
// Picks randomly without repeating until all have shown,
// then refills and reshuffles automatically.
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

export const POOLS = {
  xWin: [
    "FLAWLESS",
    "INFINITY ACHIEVED",
    "MARK SECURED",
    "ROUND CLAIMED",
    "LOCKED IN",
  ],
  oWin: [
    "DOMINANT",
    "CALCULATED",
    "PRECISION PLAY",
    "UNSTOPPABLE",
    "ZERO DOUBT",
  ],
  aiWin: [
    "ELIMINATED",
    "OVERWRITTEN",
    "WIPED OUT",
    "ERASED",
    "SYSTEM WINS",
  ],
  flavorWin: [
    "CARRY THE MARK",
    "THE BOARD RESETS",
    "ANOTHER ROUND BEGINS",
    "THE CYCLE CONTINUES",
    "INFINITY ROLLS ON",
  ],
  flavorLose: [
    "THE MACHINE ADVANCES",
    "RESISTANCE FAILED",
    "TRY AGAIN",
    "THE SYSTEM HOLDS",
    "NO ESCAPE",
  ],
};