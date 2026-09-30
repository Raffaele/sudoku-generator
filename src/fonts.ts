import { Font } from '@react-pdf/renderer'

// I font devono essere incorporati nel PDF (requisito KDP): mai Helvetica/Times/Courier.
export const FONT_REGULAR = 'Roboto'
export const FONT_BOLD = 'Roboto-Bold'
/** Cifre risolte nelle soluzioni: aspetto scritto a mano, per distinguerle da quelle pre-stampate. */
export const FONT_HANDWRITTEN = 'PatrickHand'

const base = import.meta.env.BASE_URL

Font.register({ family: FONT_REGULAR, src: `${base}fonts/Roboto-Regular.ttf` })
Font.register({ family: FONT_BOLD, src: `${base}fonts/Roboto-Bold.ttf` })
Font.register({ family: FONT_HANDWRITTEN, src: `${base}fonts/PatrickHand-Regular.ttf` })
Font.registerHyphenationCallback((word) => [word])
