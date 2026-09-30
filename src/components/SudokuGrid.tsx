import { StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Grid } from '../lib/sudoku-generator'

const THIN = 0.5
const THICK = 1.5

interface SudokuGridProps {
  grid: Grid
  cellSize: number
}

export function SudokuGrid({ grid, cellSize }: SudokuGridProps) {
  const styles = StyleSheet.create({
    grid: {
      borderTopWidth: THICK,
      borderLeftWidth: THICK,
      borderColor: '#000',
    },
    row: { flexDirection: 'row' },
    cell: {
      width: cellSize,
      height: cellSize,
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: '#000',
    },
    text: { fontSize: cellSize * 0.55 },
  })

  return (
    <View style={styles.grid}>
      {Array.from({ length: 9 }, (_, r) => (
        <View key={r} style={styles.row}>
          {Array.from({ length: 9 }, (_, c) => {
            const value = grid[r * 9 + c]
            return (
              <View
                key={c}
                style={[
                  styles.cell,
                  {
                    borderRightWidth: c % 3 === 2 ? THICK : THIN,
                    borderBottomWidth: r % 3 === 2 ? THICK : THIN,
                  },
                ]}
              >
                {value !== 0 && <Text style={styles.text}>{value}</Text>}
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}
