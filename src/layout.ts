import type { BookConfig } from './config.ts'

export const INCH = 72
export const PAGE_WIDTH = 8.5 * INCH
export const PAGE_HEIGHT = 11 * INCH

const MARGIN_OUTER = 0.5 * INCH
const MARGIN_TOP = 0.5 * INCH
const MARGIN_BOTTOM = 0.75 * INCH
const INNER_SAFETY = 0.125 * INCH
const GRID_GAP = 0.3 * INCH
/** Tolleranza sull'altezza: evita che arrotondamenti facciano traboccare il contenuto su una pagina in più. */
const HEIGHT_SLACK = 2

const PUZZLE_TITLE_HEIGHT = 30
const PUZZLE_FOOTER_HEIGHT = 28
const SOLUTION_TITLE_HEIGHT = 16

/** Rapporto cifra/cella. Nelle soluzioni è più alto perché le celle sono piccole. */
const PUZZLE_DIGIT_RATIO = 0.55
const SOLUTION_DIGIT_RATIO = 0.65
const PUZZLE_DIGIT_MIN = 22
const SOLUTION_DIGIT_MIN = 11

const KDP_MIN_PAGES = 24
const KDP_MAX_PAGES = 828
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
  cols: number
  rows: number
  /** Lato della griglia (e larghezza dello slot). */
  side: number
  cellSize: number
  digitSize: number
  gap: number
  titleHeight: number
  footerHeight: number
  /** Spazio sopra il primo slot, per centrare verticalmente il blocco. */
  offsetY: number
}

export interface BookLayout {
  puzzlePages: number
  dividerPages: number
  solutionPages: number
  /** Pagine di questo PDF. */
  pdfPages: number
  /** Pagine del libro finale, introduzione compresa. */
  bookPages: number
  innerMargin: number
  contentWidth: number
  contentHeight: number
  puzzleGrid: GridLayout
  solutionGrid: GridLayout
  warnings: string[]
}

function kdpMinInnerMargin(bookPages: number): number {
  if (bookPages > KDP_MAX_PAGES) {
    throw new Error(`Il libro ha ${bookPages} pagine: il massimo KDP è ${KDP_MAX_PAGES}`)
  }
  const row = KDP_INNER_MARGINS.find(([maxPages]) => bookPages <= maxPages)
  return (row ? row[1] : KDP_INNER_MARGINS[0][1]) * INCH
}

/** La parità si basa sul numero di pagina reale: dispari = pagina destra, margine interno a sinistra. */
export function pageMargins(pageNumber: number, innerMargin: number): PageMargins {
  const odd = pageNumber % 2 === 1
  return {
    top: MARGIN_TOP,
    bottom: MARGIN_BOTTOM,
    left: odd ? innerMargin : MARGIN_OUTER,
    right: odd ? MARGIN_OUTER : innerMargin,
  }
}

/** Sceglie cols×rows (cols×rows >= n) che massimizza il lato della griglia. */
function computeGridLayout(
  n: number,
  contentWidth: number,
  contentHeight: number,
  titleHeight: number,
  footerHeight: number,
  digitRatio: number,
): GridLayout {
  let best: GridLayout | null = null
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols)
    const side = Math.min(
      (contentWidth - (cols - 1) * GRID_GAP) / cols,
      (contentHeight - HEIGHT_SLACK - (rows - 1) * GRID_GAP) / rows - titleHeight - footerHeight,
    )
    if (side <= 0) continue
    const better =
      !best ||
      side > best.side + 1e-6 ||
      (Math.abs(side - best.side) <= 1e-6 && Math.abs(cols - rows) < Math.abs(best.cols - best.rows))
    if (better) {
      const cellSize = side / 9
      const blockHeight = rows * (titleHeight + side + footerHeight) + (rows - 1) * GRID_GAP
      best = {
        cols,
        rows,
        side,
        cellSize,
        digitSize: cellSize * digitRatio,
        gap: GRID_GAP,
        titleHeight,
        footerHeight,
        offsetY: Math.max(0, (contentHeight - blockHeight) / 2),
      }
    }
  }
  if (!best) throw new Error(`${n} griglie per pagina non entrano nell'area disponibile`)
  return best
}

export function computeBookLayout(config: BookConfig): BookLayout {
  const puzzlePages = Math.ceil(config.totalPuzzles / config.puzzlesPerPage)
  const solutionPages = Math.ceil(config.totalPuzzles / config.solutionsPerPage)
  const dividerPages = config.solutionsDivider ? 1 : 0
  const pdfPages = puzzlePages + dividerPages + solutionPages
  const bookPages = config.startPageNumber - 1 + pdfPages

  const innerMargin = kdpMinInnerMargin(bookPages) + INNER_SAFETY
  const contentWidth = PAGE_WIDTH - innerMargin - MARGIN_OUTER
  const contentHeight = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM

  const puzzleGrid = computeGridLayout(
    config.puzzlesPerPage,
    contentWidth,
    contentHeight,
    PUZZLE_TITLE_HEIGHT,
    config.showDateTime ? PUZZLE_FOOTER_HEIGHT : 0,
    PUZZLE_DIGIT_RATIO,
  )
  const solutionGrid = computeGridLayout(
    config.solutionsPerPage,
    contentWidth,
    contentHeight,
    SOLUTION_TITLE_HEIGHT,
    0,
    SOLUTION_DIGIT_RATIO,
  )

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
  if (config.startPageNumber % 2 === 0) {
    warnings.push('startPageNumber è pari: di norma un contenuto inizia su una pagina dispari')
  }
  if (bookPages < KDP_MIN_PAGES) {
    warnings.push(`Il libro ha ${bookPages} pagine: il minimo KDP è ${KDP_MIN_PAGES}`)
  }

  return {
    puzzlePages,
    dividerPages,
    solutionPages,
    pdfPages,
    bookPages,
    innerMargin,
    contentWidth,
    contentHeight,
    puzzleGrid,
    solutionGrid,
    warnings,
  }
}
