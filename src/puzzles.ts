import type { BookConfig } from './config.ts'
import {
  countSolutions,
  generateSudoku,
  solvableWithSingles,
  type Sudoku,
} from './lib/sudoku-generator.ts'

/** Celle occupate del puzzle `index` (0-based), interpolate linearmente. */
export function cluesFor(index: number, config: BookConfig): number {
  const { totalPuzzles, cluesStart, cluesEnd } = config
  if (totalPuzzles === 1) return cluesStart
  return Math.round(cluesStart + ((cluesEnd - cluesStart) * index) / (totalPuzzles - 1))
}

/** Seed deterministico derivato da seed principale, indice del puzzle e tentativo. */
function deriveSeed(seed: number, index: number, attempt: number): number {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b)
  h = Math.imul(h ^ (index + 1), 0xc2b2ae35)
  h = Math.imul(h ^ (attempt + 1), 0x27d4eb2f)
  return (h ^ (h >>> 15)) >>> 0
}

/** Genera il libro con progressione di difficoltà, scartando i duplicati. */
export function generatePuzzles(config: BookConfig): Sudoku[] {
  const seen = new Set<string>()
  const book: Sudoku[] = []
  for (let i = 0; i < config.totalPuzzles; i++) {
    for (let attempt = 0; ; attempt++) {
      const sudoku = generateSudoku(cluesFor(i, config), {
        seed: deriveSeed(config.seed, i, attempt),
        singlesOnly: config.singlesOnly,
      })
      const key = sudoku.puzzle.join('')
      if (!seen.has(key)) {
        seen.add(key)
        book.push(sudoku)
        break
      }
    }
  }
  return book
}

/** Controlli sul contenuto, da eseguire prima del rendering. Lancia un errore alla prima anomalia. */
export function verifyBook(book: Sudoku[], config: BookConfig): void {
  if (book.length !== config.totalPuzzles) {
    throw new Error(`Attesi ${config.totalPuzzles} puzzle, generati ${book.length}`)
  }
  const seen = new Set<string>()
  book.forEach(({ puzzle, solution }, i) => {
    const label = `Puzzle ${i + 1}`
    if (countSolutions(puzzle, 2) !== 1) throw new Error(`${label}: la soluzione non è unica`)
    if (config.singlesOnly && !solvableWithSingles(puzzle)) {
      throw new Error(`${label}: non risolvibile con le sole tecniche base`)
    }
    if (puzzle.some((v, j) => v !== 0 && v !== solution[j])) {
      throw new Error(`${label}: una cifra data non coincide con la soluzione`)
    }
    const clues = puzzle.filter((v) => v !== 0).length
    if (clues !== cluesFor(i, config)) {
      throw new Error(`${label}: ${clues} celle occupate, attese ${cluesFor(i, config)}`)
    }
    const key = puzzle.join('')
    if (seen.has(key)) throw new Error(`${label}: duplicato`)
    seen.add(key)
  })
}
