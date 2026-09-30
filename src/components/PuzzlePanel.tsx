import { Text, View } from '@react-pdf/renderer'
import { FONT_BOLD, FONT_REGULAR } from '../fonts.ts'
import { PANEL_ROW_HEIGHT, PANEL_TITLE_HEIGHT } from '../layout.ts'

interface PuzzlePanelProps {
  number: number
  width: number
  /** Altezza del pannello: uguale al lato della griglia. */
  height: number
  showDateTime: boolean
}

/** Titolo e Date/Time accanto alla griglia. Il resto del pannello resta bianco. */
export function PuzzlePanel({ number, width, height, showDateTime }: PuzzlePanelProps) {
  return (
    <View style={{ width, height }}>
      <View style={{ height: PANEL_TITLE_HEIGHT }}>
        <Text style={{ fontFamily: FONT_BOLD, fontSize: 18 }}>Sudoku {number}</Text>
      </View>
      {showDateTime &&
        ['Date:', 'Time:'].map((label) => (
          <View key={label} style={{ height: PANEL_ROW_HEIGHT }}>
            <Text style={{ fontFamily: FONT_REGULAR, fontSize: 12 }}>{label}</Text>
          </View>
        ))}
    </View>
  )
}
