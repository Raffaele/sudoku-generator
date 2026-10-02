import { Text, View } from '@react-pdf/renderer'
import { FONT_BOLD, FONT_REGULAR } from '../fonts.ts'
import type { GridLayout, PageSpec } from '../layout.ts'
import type { Labels } from '../locales/index.ts'
import { GridPage } from './GridPage.tsx'
import type { NumberedSudoku } from './PuzzlePage.tsx'
import { SudokuGrid } from './SudokuGrid.tsx'

/** Le cifre della traccia sono grigio scuro, così si distinguono da quelle risolte (nere, a mano). */
const GIVEN_COLOR = '#555'

interface SolutionPageProps {
  solutions: NumberedSudoku[]
  page: PageSpec
  layout: GridLayout
  labels: Labels
}

export function SolutionPage({ solutions, page, layout, labels }: SolutionPageProps) {
  return (
    <GridPage
      items={solutions}
      page={page}
      layout={layout}
      renderItem={({ number, sudoku }) => (
        <>
          <View style={{ height: layout.titleHeight, justifyContent: 'center' }}>
            <Text style={{ fontFamily: FONT_BOLD, fontSize: 10 }}>{labels.solutionTitle} {number}</Text>
          </View>
          <SudokuGrid
            values={sudoku.solution}
            givens={sudoku.puzzle}
            size={layout.side}
            digitSize={layout.digitSize}
            solvedDigitSize={layout.solvedDigitSize}
            givenFont={FONT_REGULAR}
            givenColor={GIVEN_COLOR}
          />
        </>
      )}
    />
  )
}
