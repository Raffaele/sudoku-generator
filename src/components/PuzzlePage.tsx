import { Text, View } from '@react-pdf/renderer'
import { FONT_BOLD, FONT_REGULAR } from '../fonts.ts'
import type { GridLayout } from '../layout.ts'
import type { Sudoku } from '../lib/sudoku-generator.ts'
import { GridPage } from './GridPage.tsx'
import { SudokuGrid } from './SudokuGrid.tsx'

export interface NumberedSudoku {
  number: number
  sudoku: Sudoku
}

interface PuzzlePageProps {
  puzzles: NumberedSudoku[]
  pageNumber: number
  innerMargin: number
  layout: GridLayout
  showDateTime: boolean
}

export function PuzzlePage({ puzzles, pageNumber, innerMargin, layout, showDateTime }: PuzzlePageProps) {
  return (
    <GridPage
      items={puzzles}
      pageNumber={pageNumber}
      innerMargin={innerMargin}
      layout={layout}
      renderItem={({ number, sudoku }) => (
        <>
          <View style={{ height: layout.titleHeight, justifyContent: 'center' }}>
            <Text style={{ fontFamily: FONT_BOLD, fontSize: 16 }}>Puzzle {number}</Text>
          </View>
          <SudokuGrid
            values={sudoku.puzzle}
            givens={sudoku.puzzle}
            size={layout.side}
            digitSize={layout.digitSize}
          />
          {showDateTime && (
            <View style={{ height: layout.footerHeight, justifyContent: 'flex-end' }}>
              <Text style={{ fontFamily: FONT_REGULAR, fontSize: 11 }}>
                Date: ____________   Time: ____________
              </Text>
            </View>
          )}
        </>
      )}
    />
  )
}
