import { Document } from '@react-pdf/renderer'
import type { BookConfig } from '../config.ts'
import { pageSpec, type BookLayout } from '../layout.ts'
import { LOCALES } from '../locales/index.ts'
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
  const labels = LOCALES[config.locale]
  const { startPageNumber } = layout
  // `index` = posizione nel PDF; il numero stampato parte da `startPageNumber`, la parità dei margini dalla pagina fisica.
  const page = (index: number) => pageSpec(layout, index, startPageNumber + index)
  const dividerIndex = layout.puzzlePages
  const firstSolutionIndex = dividerIndex + layout.dividerPages

  return (
    <Document title="Sudoku" language="en">
      {chunk(numbered, config.puzzlesPerPage).map((puzzles, p) => (
        <PuzzlePage
          key={`puzzle-${p}`}
          puzzles={puzzles}
          page={page(p)}
          layout={layout.puzzleGrid}
          showDateTime={config.showDateTime}
          labels={labels}
        />
      ))}
      {config.solutionsDivider && <DividerPage page={page(dividerIndex)} title={labels.solutionsDivider} />}
      {chunk(numbered, config.solutionsPerPage).map((solutions, p) => (
        <SolutionPage
          key={`solution-${p}`}
          solutions={solutions}
          page={page(firstSolutionIndex + p)}
          layout={layout.solutionGrid}
          labels={labels}
        />
      ))}
    </Document>
  )
}
