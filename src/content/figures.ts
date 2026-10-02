import type { Grid } from '../lib/sudoku-generator.ts'

/** Dati scritti a mano delle due figure dell'introduzione. Controllati da `verifyFigures`. */

/** Figura 1: griglia di esempio con una riga, una colonna e un box evidenziati (indici 0-8). */
export const FIGURE_1 = {
  givens: [
    5, 3, 0, 0, 7, 0, 0, 0, 0,
    6, 0, 0, 1, 9, 5, 0, 0, 0,
    0, 9, 8, 0, 0, 0, 0, 6, 0,
    8, 0, 0, 0, 6, 0, 0, 0, 3,
    4, 0, 0, 8, 0, 3, 0, 0, 1,
    7, 0, 0, 0, 2, 0, 0, 0, 6,
    0, 6, 0, 0, 0, 0, 2, 8, 0,
    0, 0, 0, 4, 1, 9, 0, 0, 5,
    0, 0, 0, 0, 8, 0, 0, 7, 9,
  ] as Grid,
  highlight: { row: 1, col: 7, box: 3 },
}

/**
 * Figura 2: tecnica "The only possible place" con il numero 3.
 * Nel box di destinazione (box 0) il 3 può stare solo nella cella indicata: le righe 1 e 2 e le colonne 0 e 2
 * contengono già un 3 (fuori dal box) e bloccano tutte le altre celle.
 */
export const FIGURE_2 = {
  givens: [
    0, 0, 0, 6, 0, 0, 9, 0, 2,
    0, 0, 0, 0, 0, 0, 3, 0, 8,
    0, 0, 0, 3, 0, 2, 0, 6, 0,
    0, 0, 0, 7, 0, 0, 4, 0, 0,
    0, 2, 0, 0, 5, 0, 0, 9, 1,
    0, 0, 3, 0, 0, 4, 0, 5, 0,
    0, 0, 0, 5, 0, 7, 0, 8, 0,
    0, 0, 7, 0, 0, 9, 0, 0, 5,
    3, 0, 0, 2, 0, 0, 1, 0, 0,
  ] as Grid,
  box: 0,
  target: { row: 0, col: 1, digit: 3 as const },
}

const boxOf = (row: number, col: number) => Math.floor(row / 3) * 3 + Math.floor(col / 3)

function checkGivens(name: string, g: Grid): void {
  if (g.length !== 81) throw new Error(`${name}: la griglia deve avere 81 celle`)
  const units = new Map<string, number>()
  g.forEach((v, i) => {
    if (v === 0) return
    const row = Math.floor(i / 9)
    const col = i % 9
    for (const key of [`r${row}-${v}`, `c${col}-${v}`, `b${boxOf(row, col)}-${v}`]) {
      if (units.has(key)) throw new Error(`${name}: il ${v} è ripetuto (riga ${row + 1}, colonna ${col + 1})`)
      units.set(key, i)
    }
  })
}

/** Celle del box dove la cifra può andare, considerando righe, colonne e cifre già nel box. */
export function candidateCells(g: Grid, box: number, digit: number): number[] {
  const out: number[] = []
  g.forEach((v, i) => {
    const row = Math.floor(i / 9)
    const col = i % 9
    if (boxOf(row, col) !== box || v !== 0) return
    const blocked = g.some(
      (w, j) =>
        w === digit && (Math.floor(j / 9) === row || j % 9 === col || boxOf(Math.floor(j / 9), j % 9) === box),
    )
    if (!blocked) out.push(i)
  })
  return out
}

/** Lancia un errore se i dati delle figure non rispettano le regole o non mostrano ciò che dicono. */
export function verifyFigures(): void {
  checkGivens('Figura 1', FIGURE_1.givens)
  checkGivens('Figura 2', FIGURE_2.givens)
  const { box, target, givens } = FIGURE_2
  const cells = candidateCells(givens, box, target.digit)
  const targetIndex = target.row * 9 + target.col
  if (boxOf(target.row, target.col) !== box) throw new Error('Figura 2: la cella indicata non è nel box')
  if (cells.length !== 1 || cells[0] !== targetIndex) {
    throw new Error(
      `Figura 2: il ${target.digit} deve poter andare solo nella cella indicata, invece le celle possibili sono ${cells.length}`,
    )
  }
}
