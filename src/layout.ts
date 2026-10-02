import { FRONT_MATTER_PAGES, START_PAGE_NUMBER, introWarnings, type BookConfig } from './config.ts'
import { maxPagesFor, resolveTrim } from './kdpLimits.ts'

export const INCH = 72

const MARGIN_OUTER = 0.5 * INCH
const MARGIN_TOP = 0.5 * INCH
const MARGIN_BOTTOM = 0.75 * INCH
const INNER_SAFETY = 0.125 * INCH
const GRID_GAP = 0.3 * INCH
/** Tolleranza sull'altezza: evita che arrotondamenti facciano traboccare il contenuto su una pagina in più. */
const HEIGHT_SLACK = 2

/**
 * Spessori delle linee della griglia, in punti. Fino a una griglia di 300 pt sono quelli pieni;
 * sotto scalano in proporzione al lato (con un minimo, per restare visibili in stampa).
 */
const LINE_REFERENCE_SIDE = 300
const LINES_FULL = { outer: 2.5, block: 2, cell: 0.75 }
const LINES_MIN = { outer: 1.25, block: 1, cell: 0.5 }

export interface LineWidths {
  /** Bordo esterno. */
  outer: number
  /** Divisori dei blocchi 3×3. */
  block: number
  /** Linee tra le celle. */
  cell: number
}

export function lineWidths(side: number): LineWidths {
  const scale = Math.min(1, side / LINE_REFERENCE_SIDE)
  return {
    outer: Math.max(LINES_MIN.outer, LINES_FULL.outer * scale),
    block: Math.max(LINES_MIN.block, LINES_FULL.block * scale),
    cell: Math.max(LINES_MIN.cell, LINES_FULL.cell * scale),
  }
}

// Titolo sopra la griglia (usato dalle soluzioni e, se conviene, dai puzzle).
const PUZZLE_TITLE_HEIGHT = 30
const PUZZLE_FOOTER_HEIGHT = 28
const SOLUTION_TITLE_HEIGHT = 16

// Pannello a lato della griglia (titolo e Date/Time; il resto resta bianco).
const PANEL_GAP = 14
const PANEL_MIN_WIDTH = 130
export const PANEL_TITLE_HEIGHT = 36
/** Altezza di un blocco Date/Time: etichetta, spazio per scrivere e riga, più un po' di stacco dal blocco successivo. */
export const PANEL_ROW_HEIGHT = 52

/** Rapporto cifra/cella. Nelle soluzioni è più alto perché le celle sono piccole. */
const PUZZLE_DIGIT_RATIO = 0.6
/**
 * Con il pannello a lato l'altezza è il vincolo: le cifre restano quelle calcolate al 60% della cella
 * massima, ma la cella si rimpicciolisce fino a questo rapporto cifra/cella e lo spazio avanzato
 * diventa aria sopra, tra e sotto i puzzle.
 */
const PUZZLE_SIDE_CELL_RATIO = 0.66
/** Nelle soluzioni le cifre della traccia (date) sono più piccole di quelle risolte (a mano). */
const SOLUTION_DIGIT_RATIO = 0.72
const SOLUTION_SOLVED_DIGIT_RATIO = 0.85
const PUZZLE_DIGIT_MIN = 22
const SOLUTION_DIGIT_MIN = 11

const KDP_MIN_PAGES = 24
/** [pagine massime, margine interno minimo in pollici] */
const KDP_INNER_MARGINS: readonly (readonly [number, number])[] = [
  [150, 0.375],
  [300, 0.5],
  [500, 0.625],
  [700, 0.75],
  [828, 0.875],
]

export interface PageMargins {
  top: number
  bottom: number
  left: number
  right: number
}

export interface GridLayout {
  /** `above`: titolo sopra la griglia. `side`: pannello accanto, dal lato del margine interno. */
  arrangement: 'above' | 'side'
  cols: number
  rows: number
  /** Lato della griglia. */
  side: number
  /** Larghezza di uno slot: `side` con titolo sopra, griglia + pannello con pannello a lato. */
  slotWidth: number
  /** Larghezza del pannello (0 con titolo sopra). */
  panelWidth: number
  panelGap: number
  cellSize: number
  digitSize: number
  /** Dimensione delle cifre risolte nelle soluzioni (uguale a `digitSize` altrove). */
  solvedDigitSize: number
  /** Spazio tra colonne. */
  gap: number
  /** Spazio tra righe di slot. */
  rowGap: number
  titleHeight: number
  footerHeight: number
  /** Spazio sopra il primo slot. */
  offsetY: number
}

export interface BookLayout {
  puzzlePages: number
  dividerPages: number
  solutionPages: number
  /** Pagine di questo PDF. */
  pdfPages: number
  /** Dimensioni della pagina, dal formato (`trimSize`). */
  pageWidth: number
  pageHeight: number
  /** Pagine fisiche che precedono questo PDF nel libro finale. */
  frontMatterPages: number
  /** Numero stampato sulla prima pagina di questo PDF. */
  startPageNumber: number
  /** Pagine del libro finale, introduzione compresa. */
  bookPages: number
  innerMargin: number
  contentWidth: number
  contentHeight: number
  puzzleGrid: GridLayout
  solutionGrid: GridLayout
  warnings: string[]
}

function kdpMinInnerMargin(bookPages: number, maxPages: number): number {
  if (bookPages > maxPages) {
    throw new Error(`Il libro ha ${bookPages} pagine: il massimo per questo formato è ${maxPages}`)
  }
  const row = KDP_INNER_MARGINS.find(([maxPages]) => bookPages <= maxPages)
  return (row ? row[1] : KDP_INNER_MARGINS[0][1]) * INCH
}

/** La parità si basa sulla pagina fisica nel libro finale: dispari = pagina destra, margine interno a sinistra. */
export function pageMargins(physicalPage: number, innerMargin: number): PageMargins {
  const odd = physicalPage % 2 === 1
  return {
    top: MARGIN_TOP,
    bottom: MARGIN_BOTTOM,
    left: odd ? innerMargin : MARGIN_OUTER,
    right: odd ? MARGIN_OUTER : innerMargin,
  }
}

interface GridOptions {
  n: number
  contentWidth: number
  contentHeight: number
  titleHeight: number
  footerHeight: number
  digitRatio: number
  /** Rapporto cifra/cella delle cifre risolte (default: `digitRatio`). */
  solvedDigitRatio?: number
  /** Se impostato, con il pannello a lato la cella si rimpicciolisce fino a questo rapporto cifra/cella. */
  sideCellRatio?: number
  /** Se true prova anche la disposizione con il pannello a lato della griglia. */
  allowSidePanel: boolean
}

/** Sceglie disposizione e cols×rows (cols×rows >= n) che massimizzano il lato della griglia. */
function computeGridLayout(o: GridOptions): GridLayout {
  const { n, contentWidth, contentHeight, digitRatio } = o
  let best: GridLayout | null = null
  let bestMaxSide = 0

  const consider = (arrangement: 'above' | 'side', cols: number) => {
    const rows = Math.ceil(n / cols)
    const above = arrangement === 'above'
    const titleHeight = above ? o.titleHeight : 0
    const footerHeight = above ? o.footerHeight : 0
    const slotMax = (contentWidth - (cols - 1) * GRID_GAP) / cols
    const maxSide = Math.min(
      (contentHeight - HEIGHT_SLACK - (rows - 1) * GRID_GAP) / rows - titleHeight - footerHeight,
      above ? slotMax : slotMax - PANEL_GAP - PANEL_MIN_WIDTH,
    )
    // A parità di lato vince la disposizione provata prima (titolo sopra, meno colonne).
    if (maxSide <= 0 || maxSide <= bestMaxSide + 1e-6) return

    // Le cifre sono sempre quelle della cella massima; la cella può poi rimpicciolirsi.
    const maxOuter = lineWidths(maxSide).outer
    const digitSize = ((maxSide - maxOuter) / 9) * digitRatio
    const shrink = !above && o.sideCellRatio !== undefined
    const cellSize = shrink ? digitSize / o.sideCellRatio! : (maxSide - maxOuter) / 9
    const side = shrink ? cellSize * 9 + maxOuter : maxSide
    const slotWidth = above ? side : slotMax

    // Con la cella rimpicciolita lo spazio avanzato si divide in parti uguali sopra, tra e sotto.
    const slotsHeight = rows * (titleHeight + side + footerHeight)
    const rowGap = shrink ? (contentHeight - slotsHeight) / (rows + 1) : GRID_GAP
    const blockHeight = slotsHeight + (rows - 1) * rowGap
    const offsetY = shrink ? rowGap : Math.max(0, (contentHeight - blockHeight) / 2)
    best = {
      arrangement,
      cols,
      rows,
      side,
      slotWidth,
      panelWidth: above ? 0 : slotWidth - side - PANEL_GAP,
      panelGap: PANEL_GAP,
      cellSize,
      digitSize,
      solvedDigitSize: ((maxSide - maxOuter) / 9) * (o.solvedDigitRatio ?? digitRatio),
      gap: GRID_GAP,
      rowGap,
      titleHeight,
      footerHeight,
      offsetY,
    }
    bestMaxSide = maxSide
  }

  for (let cols = 1; cols <= n; cols++) consider('above', cols)
  if (o.allowSidePanel) for (let cols = 1; cols <= n; cols++) consider('side', cols)

  if (!best) throw new Error(`${n} griglie per pagina non entrano nell'area disponibile`)
  return best
}

export function computeBookLayout(config: BookConfig): BookLayout {
  const puzzlePages = Math.ceil(config.totalPuzzles / config.puzzlesPerPage)
  const solutionPages = Math.ceil(config.totalPuzzles / config.solutionsPerPage)
  const dividerPages = config.solutionsDivider ? 1 : 0
  const pdfPages = puzzlePages + dividerPages + solutionPages
  const frontMatterPages = FRONT_MATTER_PAGES
  const startPageNumber = START_PAGE_NUMBER
  const bookPages = frontMatterPages + pdfPages

  const trim = resolveTrim(config.trimSize)
  const pageWidth = trim.widthIn * INCH
  const pageHeight = trim.heightIn * INCH
  const maxPages = maxPagesFor(config.trimSize)

  const innerMargin = kdpMinInnerMargin(bookPages, maxPages.max) + INNER_SAFETY
  const contentWidth = pageWidth - innerMargin - MARGIN_OUTER
  const contentHeight = pageHeight - MARGIN_TOP - MARGIN_BOTTOM

  const puzzleGrid = computeGridLayout({
    n: config.puzzlesPerPage,
    contentWidth,
    contentHeight,
    titleHeight: PUZZLE_TITLE_HEIGHT,
    footerHeight: config.showDateTime ? PUZZLE_FOOTER_HEIGHT : 0,
    digitRatio: PUZZLE_DIGIT_RATIO,
    sideCellRatio: PUZZLE_SIDE_CELL_RATIO,
    allowSidePanel: true,
  })
  const solutionGrid = computeGridLayout({
    n: config.solutionsPerPage,
    contentWidth,
    contentHeight,
    titleHeight: SOLUTION_TITLE_HEIGHT,
    footerHeight: 0,
    digitRatio: SOLUTION_DIGIT_RATIO,
    solvedDigitRatio: SOLUTION_SOLVED_DIGIT_RATIO,
    allowSidePanel: false,
  })

  if (solutionGrid.digitSize < SOLUTION_DIGIT_MIN) {
    throw new Error(
      `Con ${config.solutionsPerPage} soluzioni per pagina le cifre sono di ${solutionGrid.digitSize.toFixed(1)} pt ` +
        `(minimo ${SOLUTION_DIGIT_MIN} pt): riduci solutionsPerPage`,
    )
  }

  const warnings: string[] = []
  if (puzzleGrid.digitSize < PUZZLE_DIGIT_MIN) {
    warnings.push(
      `Cifre dei puzzle di ${puzzleGrid.digitSize.toFixed(1)} pt (sotto ${PUZZLE_DIGIT_MIN} pt): ` +
        `si perde il posizionamento "large print"`,
    )
  }
  if (!maxPages.verified) {
    warnings.push(
      `Limite di pagine KDP per questo formato non compilato in src/kdpLimits.ts: uso ${maxPages.max}`,
    )
  }
  warnings.push(...introWarnings(config))
  if (bookPages < KDP_MIN_PAGES) {
    warnings.push(`Il libro ha ${bookPages} pagine: il minimo KDP è ${KDP_MIN_PAGES}`)
  }

  return {
    puzzlePages,
    dividerPages,
    solutionPages,
    pdfPages,
    pageWidth,
    pageHeight,
    frontMatterPages,
    startPageNumber,
    bookPages,
    innerMargin,
    contentWidth,
    contentHeight,
    puzzleGrid,
    solutionGrid,
    warnings,
  }
}

/** Dove sta una pagina: formato, margine interno, pagina fisica (decide i margini specchiati) e numero stampato. */
export interface PageSpec {
  width: number
  height: number
  innerMargin: number
  /** Posizione nel libro finale, da 1. */
  physicalPage: number
  /** Numero stampato; `null` = nessuno. */
  label: string | number | null
}

export function pageSpec(layout: BookLayout, index: number, label: PageSpec['label']): PageSpec {
  return {
    width: layout.pageWidth,
    height: layout.pageHeight,
    innerMargin: layout.innerMargin,
    physicalPage: layout.frontMatterPages + index + 1,
    label,
  }
}
