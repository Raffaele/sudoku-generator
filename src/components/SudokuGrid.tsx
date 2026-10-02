import { Line, Rect, Svg, Text } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import { FONT_BOLD, FONT_HANDWRITTEN } from '../fonts.ts'
import { lineWidths } from '../layout.ts'
import type { Grid } from '../lib/sudoku-generator.ts'

const CELL_COLOR = '#555'
/** Offset verticale per centrare le cifre Roboto (cap height ~0.711 em). */
const BASELINE_SHIFT = 0.355
/**
 * Patrick Hand ha un tratto sottile e a schermo appare grigio. react-pdf ignora `stroke` sul testo SVG,
 * quindi le cifre a mano si disegnano due volte con questo scarto (in punti), che ne ispessisce il tratto.
 */
const HANDWRITTEN_EMBOLDEN = 0.3

interface SudokuGridProps {
  /** Cifre da stampare. */
  values: Grid
  /** Cifre date (traccia). Le altre (soluzione): Patrick Hand, scritto a mano. */
  givens: Grid
  size: number
  /** Dimensione delle cifre date. */
  digitSize: number
  /** Dimensione delle cifre risolte (default: come `digitSize`). */
  solvedDigitSize?: number
  /** Font delle cifre date (default: Roboto Bold). */
  givenFont?: string
  /** Colore delle cifre date. Le cifre risolte sono sempre nere. */
  givenColor?: string
  /** Sfondo per indice di cella (0-80), disegnato sotto le linee. */
  fills?: Record<number, string>
  /** Elementi disegnati sopra la griglia; riceve le coordinate delle linee. */
  overlay?: (geometry: GridGeometry) => ReactNode
}

export interface GridGeometry {
  /** Coordinata della linea `i` (0-9), uguale per x e y. */
  at: (i: number) => number
  cell: number
  outerWidth: number
}

export function SudokuGrid({
  values,
  givens,
  size,
  digitSize,
  solvedDigitSize = digitSize,
  givenFont = FONT_BOLD,
  givenColor = '#000',
  fills,
  overlay,
}: SudokuGridProps) {
  const { outer: OUTER_WIDTH, block: BLOCK_WIDTH, cell: CELL_WIDTH } = lineWidths(size)
  const pad = OUTER_WIDTH / 2
  const inner = size - OUTER_WIDTH
  const cell = inner / 9
  const at = (i: number) => pad + i * cell

  return (
    <Svg width={size} height={size}>
      {fills &&
        Object.entries(fills).map(([i, color]) => (
          <Rect key={`f${i}`} x={at(Number(i) % 9)} y={at(Math.floor(Number(i) / 9))} width={cell} height={cell} fill={color} />
        ))}
      {[1, 2, 4, 5, 7, 8].map((i) => (
        <Line key={`h${i}`} x1={at(0)} y1={at(i)} x2={at(9)} y2={at(i)} stroke={CELL_COLOR} strokeWidth={CELL_WIDTH} />
      ))}
      {[1, 2, 4, 5, 7, 8].map((i) => (
        <Line key={`v${i}`} x1={at(i)} y1={at(0)} x2={at(i)} y2={at(9)} stroke={CELL_COLOR} strokeWidth={CELL_WIDTH} />
      ))}
      {[3, 6].map((i) => (
        <Line key={`bh${i}`} x1={at(0)} y1={at(i)} x2={at(9)} y2={at(i)} stroke="#000" strokeWidth={BLOCK_WIDTH} />
      ))}
      {[3, 6].map((i) => (
        <Line key={`bv${i}`} x1={at(i)} y1={at(0)} x2={at(i)} y2={at(9)} stroke="#000" strokeWidth={BLOCK_WIDTH} />
      ))}
      <Rect x={pad} y={pad} width={inner} height={inner} fill="none" stroke="#000" strokeWidth={OUTER_WIDTH} />
      {values.map((value, i) => {
        if (value === 0) return null
        const given = givens[i] !== 0
        const x = at(i % 9) + cell / 2
        const fontSize = given ? digitSize : solvedDigitSize
        const y = at(Math.floor(i / 9)) + cell / 2 + fontSize * BASELINE_SHIFT
        const digit = (key: string, dx: number, dy: number, color: string, fontFamily: string) => (
          <Text key={key} x={x + dx} y={y + dy} textAnchor="middle" fill={color} style={{ fontFamily, fontSize }}>
            {String(value)}
          </Text>
        )
        if (given) return digit(`${i}`, 0, 0, givenColor, givenFont)
        const d = HANDWRITTEN_EMBOLDEN / 2
        return [digit(`${i}a`, -d, -d, '#000', FONT_HANDWRITTEN), digit(`${i}b`, d, d, '#000', FONT_HANDWRITTEN)]
      })}
      {overlay?.({ at, cell, outerWidth: OUTER_WIDTH })}
    </Svg>
  )
}
