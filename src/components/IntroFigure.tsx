import { Circle, Line, Rect, Text, View } from '@react-pdf/renderer'
import { Fragment } from 'react'
import { FIGURE_1, FIGURE_2 } from '../content/figures.ts'
import { FONT_BOLD } from '../fonts.ts'
import { lineWidths } from '../layout.ts'
import type { Grid } from '../lib/sudoku-generator.ts'
import { SudokuGrid } from './SudokuGrid.tsx'

const HIGHLIGHT = '#E6E6E6'
const GUIDE = '#555'

/** Lato massimo delle griglie della Figura 1, perché titolo, due righe di griglie e regole stiano in una pagina. */
const MAX_FIGURE_1_SIZE = 200

type ZoneLabels = { row: string; column: string; box: string }

function zoneFills(zone: keyof ZoneLabels): Record<number, string> {
  const { row, col, box } = FIGURE_1.highlight
  const fills: Record<number, string> = {}
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9)
    const c = i % 9
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3)
    if ((zone === 'row' && r === row) || (zone === 'column' && c === col) || (zone === 'box' && b === box)) {
      fills[i] = HIGHLIGHT
    }
  }
  return fills
}

/**
 * Figura 1: tre griglie risolte affiancate, ciascuna con una sola zona (riga, colonna, box 3×3) in grigio chiaro
 * e col contorno spesso, nominata sotto. Ogni zona contiene i numeri da 1 a 9 senza ripetizioni.
 */
export function Figure1({ width, labels }: { width: number; labels: ZoneLabels }) {
  const gap = 28
  // Due griglie sulla prima riga, la terza a capo al centro. Il lato è limitato dall'altezza: la pagina deve restare di 4.
  const size = Math.min(MAX_FIGURE_1_SIZE, Math.floor((width - gap) / 2))
  const { row, col, box } = FIGURE_1.highlight
  const cell = (size - lineWidths(size).outer) / 9
  const outlineStroke = { fill: 'none', stroke: '#000', strokeWidth: 3 } as const
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: gap, rowGap: 16, justifyContent: 'center' }}>
      {(['row', 'column', 'box'] as const).map((zone) => (
        <View key={zone} style={{ alignItems: 'center', rowGap: 8 }}>
          <SudokuGrid
            values={FIGURE_1.solution}
            givens={FIGURE_1.puzzle}
            size={size}
            digitSize={cell * 0.6}
            solvedDigitSize={cell * 0.85}
            fills={zoneFills(zone)}
            overlay={({ at, cell: c }) => (
              <>
                {zone === 'row' && <Rect x={at(0)} y={at(row)} width={9 * c} height={c} {...outlineStroke} />}
                {zone === 'column' && <Rect x={at(col)} y={at(0)} width={c} height={9 * c} {...outlineStroke} />}
                {zone === 'box' && (
                  <Rect
                    x={at((box % 3) * 3)}
                    y={at(Math.floor(box / 3) * 3)}
                    width={3 * c}
                    height={3 * c}
                    {...outlineStroke}
                  />
                )}
              </>
            )}
          />
          <Text style={{ fontFamily: FONT_BOLD, fontSize: 16 }}>{labels[zone]}</Text>
        </View>
      ))}
    </View>
  )
}

/** Figura 2: "The only possible place". Il box di destinazione ha il bordo spesso, i 3 che bloccano le righe e le colonne sono cerchiati e uniti al box da una linea. */
export function Figure2({ size }: { size: number }) {
  const { givens, box, target } = FIGURE_2
  const boxRow = Math.floor(box / 3) * 3
  const boxCol = (box % 3) * 3
  const targetIndex = target.row * 9 + target.col
  const values = givens.map((v, i) => (i === targetIndex ? target.digit : v)) as Grid
  const cellSize = (size - lineWidths(size).outer) / 9
  const digitSize = cellSize * 0.6
  /** Il 3 scritto a mano è più grande, come nelle soluzioni. */
  const solvedDigitSize = cellSize * 0.85

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
      solvedDigitSize={solvedDigitSize}
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
