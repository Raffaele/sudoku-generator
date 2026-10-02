import { Text, View } from '@react-pdf/renderer'
import { FONT_BOLD, FONT_REGULAR } from '../fonts.ts'
import type { Labels } from '../locales/index.ts'
import { PANEL_ROW_HEIGHT, PANEL_TITLE_HEIGHT } from '../layout.ts'

const LINE_COLOR = '#555'
/** Lunghezza della riga di Date e Time to solve (il pannello è più largo: il resto resta bianco). */
const LINE_WIDTH = 130

interface PuzzlePanelProps {
  number: number
  labels: Labels
  width: number
  /** Altezza del pannello: uguale al lato della griglia. */
  height: number
  showDateTime: boolean
}

/** Titolo e Date/Time accanto alla griglia, ciascuno con la riga su cui scrivere sotto l'etichetta. Il resto resta bianco. */
export function PuzzlePanel({ number, labels, width, height, showDateTime }: PuzzlePanelProps) {
  return (
    <View style={{ width, height }}>
      <View style={{ height: PANEL_TITLE_HEIGHT }}>
        <Text style={{ fontFamily: FONT_BOLD, fontSize: 18 }}>{labels.puzzleTitle} {number}</Text>
      </View>
      {showDateTime &&
        [`${labels.date}:`, `${labels.timeToSolve}:`].map((label) => (
          <View key={label} style={{ height: PANEL_ROW_HEIGHT }}>
            <Text style={{ fontFamily: FONT_REGULAR, fontSize: 15 }}>{label}</Text>
            <View style={{ width: LINE_WIDTH, flexGrow: 1, marginBottom: 6, borderBottomWidth: 0.75, borderBottomColor: LINE_COLOR }} />
          </View>
        ))}
    </View>
  )
}
