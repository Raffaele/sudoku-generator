import { Circle, Line, Rect } from '@react-pdf/renderer'
import { Fragment } from 'react'
import { FIGURE_1, FIGURE_2 } from '../content/figures.ts'
import type { Grid } from '../lib/sudoku-generator.ts'
import { SudokuGrid } from './SudokuGrid.tsx'

const HIGHLIGHT = '#E6E6E6'
const GUIDE = '#555'

/** Figura 1: una riga, una colonna e un box 3×3 evidenziati in grigio chiaro. */
export function Figure1({ size }: { size: number }) {
  const { givens, highlight } = FIGURE_1
  const fills: Record<number, string> = {}
  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9)
    const col = i % 9
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3)
    if (row === highlight.row || col === highlight.col || box === highlight.box) fills[i] = HIGHLIGHT
  }
  return <SudokuGrid values={givens} givens={givens} size={size} digitSize={(size / 9) * 0.6} fills={fills} />
}

/** Figura 2: "The only possible place". Il box di destinazione ha il bordo spesso, i 3 che bloccano le righe e le colonne sono cerchiati e uniti al box da una linea. */
export function Figure2({ size }: { size: number }) {
  const { givens, box, target } = FIGURE_2
  const boxRow = Math.floor(box / 3) * 3
  const boxCol = (box % 3) * 3
  const targetIndex = target.row * 9 + target.col
  const values = givens.map((v, i) => (i === targetIndex ? target.digit : v)) as Grid
  const digitSize = (size / 9) * 0.6

  // 3 già presenti (fuori dal box) nelle righe e nelle colonne che attraversano il box.
  const blockers: { row: number; col: number }[] = []
  givens.forEach((v, i) => {
    const row = Math.floor(i / 9)
    const col = i % 9
    const inBox = row >= boxRow && row < boxRow + 3 && col >= boxCol && col < boxCol + 3
    const crosses = (row >= boxRow && row < boxRow + 3) || (col >= boxCol && col < boxCol + 3)
    if (v === target.digit && !inBox && crosses) blockers.push({ row, col })
  })

  return (
    <SudokuGrid
      values={values}
      givens={givens}
      size={size}
      digitSize={digitSize}
      fills={{ [targetIndex]: HIGHLIGHT }}
      overlay={({ at, cell, outerWidth }) => (
        <>
          {blockers.map(({ row, col }) => {
            const cx = at(col) + cell / 2
            const cy = at(row) + cell / 2
            const inRow = row >= boxRow && row < boxRow + 3
            // La linea va dal bordo della cella verso il box, lungo la riga o la colonna.
            const line = inRow
              ? {
                  x1: col > boxCol ? at(col) : at(col + 1),
                  x2: col > boxCol ? at(boxCol) : at(boxCol + 3),
                  y1: cy,
                  y2: cy,
                }
              : {
                  x1: cx,
                  x2: cx,
                  y1: row > boxRow ? at(row) : at(row + 1),
                  y2: row > boxRow ? at(boxRow) : at(boxRow + 3),
                }
            return (
              <Fragment key={`${row}-${col}`}>
                <Circle cx={cx} cy={cy} r={cell * 0.42} fill="none" stroke={GUIDE} strokeWidth={1.5} />
                <Line {...line} stroke={GUIDE} strokeWidth={1.5} strokeDasharray="4 3" />
              </Fragment>
            )
          })}
          <Rect
            x={at(boxCol)}
            y={at(boxRow)}
            width={cell * 3}
            height={cell * 3}
            fill="none"
            stroke="#000"
            strokeWidth={outerWidth * 1.4}
          />
        </>
      )}
    />
  )
}
