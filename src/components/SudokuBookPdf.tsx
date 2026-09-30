import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Sudoku } from '../lib/sudoku-generator'
import { SudokuGrid } from './SudokuGrid'

const styles = StyleSheet.create({
  page: { padding: 40, alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 24 },
  solutionsPage: {
    padding: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
  },
  solutionsTitle: { width: '100%', fontSize: 20, marginBottom: 16, textAlign: 'center' },
  solution: { marginBottom: 24, alignItems: 'center' },
  solutionLabel: { fontSize: 10, marginBottom: 4 },
})

const SOLUTIONS_PER_PAGE = 6

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size),
  )
}

export function SudokuBookPdf({ book }: { book: Sudoku[] }) {
  return (
    <Document title="Sudoku">
      {book.map((sudoku, i) => (
        <Page key={i} size="A4" style={styles.page}>
          <Text style={styles.title}>Sudoku {i + 1}</Text>
          <SudokuGrid grid={sudoku.puzzle} cellSize={50} />
        </Page>
      ))}
      {chunk(book, SOLUTIONS_PER_PAGE).map((group, p) => (
        <Page key={`sol-${p}`} size="A4" style={styles.solutionsPage}>
          {p === 0 && <Text style={styles.solutionsTitle}>Soluzioni</Text>}
          {group.map((sudoku, i) => (
            <View key={i} style={styles.solution}>
              <Text style={styles.solutionLabel}>
                Sudoku {p * SOLUTIONS_PER_PAGE + i + 1}
              </Text>
              <SudokuGrid grid={sudoku.solution} cellSize={22} />
            </View>
          ))}
        </Page>
      ))}
    </Document>
  )
}
