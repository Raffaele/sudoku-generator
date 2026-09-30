import { Document } from '@react-pdf/renderer'
import type { BookConfig } from '../config.ts'
import type { BookLayout } from '../layout.ts'
import type { Sudoku } from '../lib/sudoku-generator.ts'
import { DividerPage } from './DividerPage.tsx'
import { PuzzlePage, type NumberedSudoku } from './PuzzlePage.tsx'
import { SolutionPage } from './SolutionPage.tsx'

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size),
  )
}

interface BookDocumentProps {
  book: Sudoku[]
  config: BookConfig
  layout: BookLayout
}

export function BookDocument({ book, config, layout }: BookDocumentProps) {
  const numbered: NumberedSudoku[] = book.map((sudoku, i) => ({ number: i + 1, sudoku }))
  const { startPageNumber } = config
  const { innerMargin } = layout
  const dividerPage = startPageNumber + layout.puzzlePages
  const firstSolutionPage = dividerPage + layout.dividerPages

  return (
    <Document title="Sudoku" language="en">
      {chunk(numbered, config.puzzlesPerPage).map((puzzles, p) => (
        <PuzzlePage
          key={`puzzle-${p}`}
          puzzles={puzzles}
          pageNumber={startPageNumber + p}
          innerMargin={innerMargin}
          layout={layout.puzzleGrid}
          showDateTime={config.showDateTime}
        />
      ))}
      {config.solutionsDivider && <DividerPage pageNumber={dividerPage} innerMargin={innerMargin} />}
      {chunk(numbered, config.solutionsPerPage).map((solutions, p) => (
        <SolutionPage
          key={`solution-${p}`}
          solutions={solutions}
          pageNumber={firstSolutionPage + p}
          innerMargin={innerMargin}
          layout={layout.solutionGrid}
        />
      ))}
    </Document>
  )
}
