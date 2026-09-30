/**
 * Generatore di sudoku a soluzione unica.
 *
 * Metodo:
 * 1. Crea una griglia completa valida (backtracking con cifre in ordine casuale).
 * 2. Svuota le celle in ordine casuale. Ogni rimozione viene annullata se il
 *    puzzle non ha più una soluzione unica (o, con singlesOnly, se non è più
 *    risolvibile con le sole tecniche base).
 * 3. Si ferma quando raggiunge il numero di celle occupate richiesto.
 *    Se non ci riesce, riprova con una nuova griglia.
 */

export type FilledCell = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type EmptyCell = 0;
export type Cell = FilledCell | EmptyCell;
/** 81 celle, riga per riga. La lunghezza è verificata a runtime (assertGrid). */
export type Grid = Cell[];

const DIGITS: readonly FilledCell[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function assertGrid(g: Grid): void {
  if (g.length !== 81) throw new Error(`La griglia deve avere 81 celle, ne ha ${g.length}`);
}

function emptyGrid(): Grid {
  return new Array<Cell>(81).fill(0);
}

export interface Sudoku {
  puzzle: Grid;
  solution: Grid;
  clues: number;
}

export interface GenerateOptions {
  /** Seed per risultati riproducibili (stesso seed = stessi puzzle). */
  seed?: number;
  /** Tentativi massimi prima di arrendersi. Default 200. */
  maxAttempts?: number;
  /**
   * Se true, il puzzle deve essere risolvibile solo con naked/hidden singles
   * (tecniche base). Consigliato per libri "easy". Garantisce anche l'unicità.
   */
  singlesOnly?: boolean;
}

// ---------- Tabelle precalcolate ----------

const ROW = Array.from({ length: 81 }, (_, i) => Math.floor(i / 9));
const COL = Array.from({ length: 81 }, (_, i) => i % 9);
const BOX = Array.from({ length: 81 }, (_, i) => Math.floor(ROW[i] / 3) * 3 + Math.floor(COL[i] / 3));

const UNITS: number[][] = [];
for (let k = 0; k < 9; k++) {
  UNITS.push(Array.from({ length: 9 }, (_, j) => k * 9 + j)); // righe
  UNITS.push(Array.from({ length: 9 }, (_, j) => j * 9 + k)); // colonne
  UNITS.push(Array.from({ length: 81 }, (_, i) => i).filter((i) => BOX[i] === k)); // box
}

const ALL = 0b1111111110; // bit 1..9

function popcount(m: number): number {
  let c = 0;
  while (m) {
    m &= m - 1;
    c++;
  }
  return c;
}

// ---------- RNG riproducibile ----------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- Solver con bitmask ----------

/**
 * Conta le soluzioni fino a `limit` (con limit = 2 basta sapere se è unica).
 * Se `rng` è fornito, prova le cifre in ordine casuale (serve per generare).
 * Se `out` è fornito, ci scrive la prima soluzione trovata.
 */
function solve(grid: Grid, limit: number, rng?: () => number, out?: Grid): number {
  assertGrid(grid);
  const g = grid.slice();
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);

  for (let i = 0; i < 81; i++) {
    if (g[i]) {
      const b = 1 << g[i];
      if (rows[ROW[i]] & b || cols[COL[i]] & b || boxes[BOX[i]] & b) return 0; // dati in conflitto
      rows[ROW[i]] |= b;
      cols[COL[i]] |= b;
      boxes[BOX[i]] |= b;
    }
  }

  let count = 0;

  const rec = (): void => {
    // Sceglie la cella vuota con meno candidati (MRV)
    let best = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const m = ALL & ~(rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]);
      const c = popcount(m);
      if (c < bestCount) {
        best = i;
        bestMask = m;
        bestCount = c;
        if (c <= 1) break;
      }
    }
    if (best === -1) {
      if (count === 0 && out) out.splice(0, 81, ...g);
      count++;
      return;
    }
    if (bestCount === 0) return;

    const order = rng ? shuffle(DIGITS.slice(), rng) : DIGITS;
    for (const d of order) {
      const b = 1 << d;
      if (!(bestMask & b)) continue;
      g[best] = d;
      rows[ROW[best]] |= b;
      cols[COL[best]] |= b;
      boxes[BOX[best]] |= b;
      rec();
      g[best] = 0;
      rows[ROW[best]] &= ~b;
      cols[COL[best]] &= ~b;
      boxes[BOX[best]] &= ~b;
      if (count >= limit) return;
    }
  };

  rec();
  return count;
}

export function countSolutions(grid: Grid, limit = 2): number {
  return solve(grid, limit);
}

/** true se il puzzle si risolve con sole tecniche base (naked + hidden singles). */
export function solvableWithSingles(grid: Grid): boolean {
  const g = grid.slice();
  const cand = (i: number): number => {
    let used = 0;
    for (let j = 0; j < 81; j++) {
      if (g[j] && (ROW[j] === ROW[i] || COL[j] === COL[i] || BOX[j] === BOX[i])) used |= 1 << g[j];
    }
    return ALL & ~used;
  };

  let progress = true;
  while (progress) {
    progress = false;
    // Naked singles
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const m = cand(i);
      if (m === 0) return false;
      if (popcount(m) === 1) {
        g[i] = Math.log2(m) as FilledCell; // unico cast: m ha un solo bit acceso (1..9)
        progress = true;
      }
    }
    // Hidden singles
    for (const unit of UNITS) {
      for (const d of DIGITS) {
        const b = 1 << d;
        if (unit.some((i) => g[i] === d)) continue;
        const spots = unit.filter((i) => !g[i] && cand(i) & b);
        if (spots.length === 1) {
          g[spots[0]] = d;
          progress = true;
        }
      }
    }
  }
  return g.every((v) => v !== 0);
}

// ---------- Generatore ----------

export function generateSudoku(clues: number, options: GenerateOptions = {}): Sudoku {
  if (!Number.isInteger(clues) || clues < 17 || clues > 81) {
    throw new Error("clues deve essere un intero tra 17 e 81 (17 è il minimo teorico per l'unicità)");
  }
  const rng = mulberry32(options.seed ?? Math.floor(Math.random() * 2 ** 32));
  const maxAttempts = options.maxAttempts ?? 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = emptyGrid();
    solve(emptyGrid(), 1, rng, solution);

    const puzzle = solution.slice();
    let filled = 81;

    for (const idx of shuffle(Array.from({ length: 81 }, (_, i) => i), rng)) {
      if (filled === clues) break;
      const saved = puzzle[idx];
      puzzle[idx] = 0;
      // singlesOnly implica già l'unicità, quindi basta un controllo
      const ok = options.singlesOnly ? solvableWithSingles(puzzle) : countSolutions(puzzle) === 1;
      if (ok) filled--;
      else puzzle[idx] = saved;
    }

    if (filled === clues) return { puzzle, solution, clues };
  }

  throw new Error(
    `Impossibile generare un puzzle con ${clues} celle occupate in ${maxAttempts} tentativi. ` +
    `Sotto ~22 (o ~30 con singlesOnly) aumenta maxAttempts o alza clues.`,
  );
}

/** Genera un libro intero, scartando eventuali duplicati. */
export function generateBook(count: number, clues: number, options: GenerateOptions = {}): Sudoku[] {
  const rng = mulberry32(options.seed ?? Math.floor(Math.random() * 2 ** 32));
  const seen = new Set<string>();
  const book: Sudoku[] = [];
  while (book.length < count) {
    const s = generateSudoku(clues, { ...options, seed: Math.floor(rng() * 2 ** 32) });
    const key = s.puzzle.join("");
    if (!seen.has(key)) {
      seen.add(key);
      book.push(s);
    }
  }
  return book;
}
