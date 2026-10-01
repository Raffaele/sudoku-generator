import { Text, View } from '@react-pdf/renderer'
import { FONT_BOLD, FONT_REGULAR } from '../fonts.ts'
import type { GridLayout } from '../layout.ts'
import type { Sudoku } from '../lib/sudoku-generator.ts'
import { GridPage } from './GridPage.tsx'
import { PuzzlePanel } from './PuzzlePanel.tsx'
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
      renderItem={({ number, sudoku }, { odd }) => {
        const grid = (
          <SudokuGrid
            values={sudoku.puzzle}
            givens={sudoku.puzzle}
            size={layout.side}
            digitSize={layout.digitSize}
          />
        )

        if (layout.arrangement === 'side') {
          // Il pannello sta dal lato del margine interno; la griglia dal lato esterno, più comodo per scrivere.
          return (
            <View
              style={{
                flexDirection: odd ? 'row' : 'row-reverse',
                columnGap: layout.panelGap,
                width: layout.slotWidth,
              }}
            >
              <PuzzlePanel
                number={number}
                width={layout.panelWidth}
                height={layout.side}
                showDateTime={showDateTime}
              />
              {grid}
            </View>
          )
        }

        return (
          <>
            <View style={{ height: layout.titleHeight, justifyContent: 'center' }}>
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 16 }}>Sudoku {number}</Text>
            </View>
            {grid}
            {showDateTime && (
              <View style={{ height: layout.footerHeight, justifyContent: 'flex-end' }}>
                <Text style={{ fontFamily: FONT_REGULAR, fontSize: 11 }}>
                  Date: __________   Time to solve: __________
                </Text>
              </View>
            )}
          </>
        )
      }}
    />
  )
}
