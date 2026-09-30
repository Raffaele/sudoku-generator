import { Line, Rect, Svg, Text } from '@react-pdf/renderer'
import { FONT_BOLD, FONT_HANDWRITTEN } from '../fonts.ts'
import { OUTER_LINE_WIDTH as OUTER_WIDTH } from '../layout.ts'
import type { Grid } from '../lib/sudoku-generator.ts'

const BLOCK_WIDTH = 2
const CELL_WIDTH = 0.75
const CELL_COLOR = '#555'
/** Offset verticale per centrare le cifre Roboto (cap height ~0.711 em). */
const BASELINE_SHIFT = 0.355
/** Patrick Hand ha cifre visivamente più piccole di Roboto a parità di punti. */
const HANDWRITTEN_SCALE = 1.1

interface SudokuGridProps {
  /** Cifre da stampare. */
  values: Grid
  /** Cifre date: Roboto Bold. Le altre (soluzione): Patrick Hand, scritto a mano. */
  givens: Grid
  size: number
  digitSize: number
}

export function SudokuGrid({ values, givens, size, digitSize }: SudokuGridProps) {
  const pad = OUTER_WIDTH / 2
  const inner = size - OUTER_WIDTH
  const cell = inner / 9
  const at = (i: number) => pad + i * cell

  return (
    <Svg width={size} height={size}>
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
        const size = given ? digitSize : digitSize * HANDWRITTEN_SCALE
        return (
          <Text
            key={i}
            x={at(i % 9) + cell / 2}
            y={at(Math.floor(i / 9)) + cell / 2 + size * BASELINE_SHIFT}
            textAnchor="middle"
            fill="#000"
            style={{ fontFamily: given ? FONT_BOLD : FONT_HANDWRITTEN, fontSize: size }}
          >
            {String(value)}
          </Text>
        )
      })}
    </Svg>
  )
}
