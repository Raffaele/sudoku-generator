import { Text, View } from '@react-pdf/renderer'
import { FONT_BOLD, FONT_REGULAR } from '../fonts.ts'
import type { GridLayout, PageSpec } from '../layout.ts'
import type { Sudoku } from '../lib/sudoku-generator.ts'
import { GridPage } from './GridPage.tsx'
import type { Labels } from '../locales/index.ts'
import { PuzzlePanel } from './PuzzlePanel.tsx'
import { SudokuGrid } from './SudokuGrid.tsx'

export interface NumberedSudoku {
  number: number
  sudoku: Sudoku
}

interface PuzzlePageProps {
  puzzles: NumberedSudoku[]
  page: PageSpec
  layout: GridLayout
  showDateTime: boolean
  labels: Labels
}

export function PuzzlePage({ puzzles, page, layout, showDateTime, labels }: PuzzlePageProps) {
  return (
    <GridPage
      items={puzzles}
      page={page}
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
                labels={labels}
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
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 16 }}>{labels.puzzleTitle} {number}</Text>
            </View>
            {grid}
            {showDateTime && (
              <View style={{ height: layout.footerHeight, justifyContent: 'flex-end' }}>
                <Text style={{ fontFamily: FONT_REGULAR, fontSize: 11 }}>
                  {labels.date}: __________   {labels.timeToSolve}: __________
                </Text>
              </View>
            )}
          </>
        )
      }}
    />
  )
}
