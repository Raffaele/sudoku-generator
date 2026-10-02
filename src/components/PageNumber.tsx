import { Text } from '@react-pdf/renderer'
import { FONT_REGULAR } from '../fonts.ts'
import { INCH, type PageMargins } from '../layout.ts'

const FONT_SIZE = 11
/** Distanza della base del testo dal bordo inferiore. */
const BASELINE_FROM_BOTTOM = 0.4 * INCH
/** La base del testo sta circa a 0,2 em sopra il fondo del box di testo. */
const BOTTOM = BASELINE_FROM_BOTTOM - FONT_SIZE * 0.2

export function PageNumber({ label, margins }: { label: string | number | null; margins: PageMargins }) {
  if (label === null) return null
  return (
    // `fixed`: il numero sta nel margine inferiore, fuori dall'area di contenuto; senza `fixed` react-pdf
    // lo sposterebbe su una pagina nuova e vuota.
    <Text
      fixed
      style={{
        position: 'absolute',
        bottom: BOTTOM,
        left: margins.left,
        right: margins.right,
        textAlign: 'center',
        fontFamily: FONT_REGULAR,
        fontSize: FONT_SIZE,
      }}
    >
      {label}
    </Text>
  )
}
