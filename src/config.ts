import { resolveTrim, TRIM_PRESETS, type TrimSize } from './kdpLimits.ts'
import { LOCALES, type LocaleId } from './locales/index.ts'

/** Pagine dell'introduzione (numero pari: il contenuto parte su una pagina destra). Costante. */
export const INTRO_PAGES = 4
/** Pagine fisiche che precedono il contenuto nel libro finale. */
export const FRONT_MATTER_PAGES = INTRO_PAGES
/** Numero stampato sulla prima pagina del contenuto (l'introduzione è in numeri romani). */
export const START_PAGE_NUMBER = 1

/** Testi variabili dell'introduzione. Vanno riprodotti alla lettera: non riformularli. */
export interface IntroConfig {
  badge: string
  title: string
  subtitle: string
  features: string
  volume: string
  author: string
  year: number
  isbn: string
  copyrightNotice: string
}

export interface BookConfig {
  /** Puzzle per pagina (1, 2, 4, 6…). */
  puzzlesPerPage: number
  /** Soluzioni per pagina (4, 6, 9, 12…). */
  solutionsPerPage: number
  trimSize: TrimSize
  locale: LocaleId
  totalPuzzles: number
  /** Celle occupate nel primo puzzle. */
  cluesStart: number
  /** Celle occupate nell'ultimo puzzle (interpolazione lineare arrotondata). */
  cluesEnd: number
  /** Solo naked/hidden singles. */
  singlesOnly: boolean
  seed: number
  /** Righe "Date" e "Time" per ogni puzzle. */
  showDateTime: boolean
  /** Pagina "Solutions" prima delle soluzioni. */
  solutionsDivider: boolean
  /** Genera le pagine introduttive. */
  includeIntro: boolean
  intro: IntroConfig
}

export const DEFAULT_CONFIG: BookConfig = {
  puzzlesPerPage: 2,
  solutionsPerPage: 6,
  trimSize: 'letter',
  locale: 'en',
  totalPuzzles: 306,
  cluesStart: 45,
  cluesEnd: 36,
  singlesOnly: true,
  seed: 2026,
  showDateTime: true,
  solutionsDivider: true,
  includeIntro: true,
  intro: {
    badge: 'LARGE PRINT',
    title: 'EASY SUDOKU',
    // Segnaposto, da confermare.
    subtitle: '300+ Easy Puzzles for Adults & Seniors',
    features: '2 Puzzles per Page · Gradually Increasing Difficulty · Every Puzzle Verified · Solutions Included',
    volume: 'Volume 1',
    author: '',
    year: 2026,
    isbn: '',
    copyrightNotice: '',
  },
}

/** Avvisi sui testi dell'introduzione mancanti (mai compilati al posto dell'utente). */
export function introWarnings(c: BookConfig): string[] {
  if (!c.includeIntro) return []
  const warnings: string[] = []
  if (!c.intro.author.trim()) warnings.push("Autore mancante: il campo resta vuoto nell'introduzione")
  if (!c.intro.isbn.trim()) warnings.push('ISBN mancante: da assegnare su KDP prima del file definitivo')
  if (!c.intro.copyrightNotice.trim()) warnings.push('Nota di copyright mancante: va fornita dall\'utente')
  return warnings
}

/** Restituisce i messaggi di errore (array vuoto se la configurazione è valida). */
export function validateConfig(c: BookConfig): string[] {
  const errors: string[] = []
  const positiveInt = (name: string, v: number, min = 1) => {
    if (!Number.isInteger(v) || v < min) errors.push(`${name} deve essere un intero >= ${min}`)
  }
  positiveInt('puzzlesPerPage', c.puzzlesPerPage)
  positiveInt('solutionsPerPage', c.solutionsPerPage)
  positiveInt('totalPuzzles', c.totalPuzzles)
  positiveInt('intro.year', c.intro.year)
  if (!(c.locale in LOCALES)) errors.push(`locale "${c.locale}" non disponibile`)
  const trim = typeof c.trimSize === 'string' ? (c.trimSize in TRIM_PRESETS ? resolveTrim(c.trimSize) : null) : c.trimSize
  if (!trim || !(trim.widthIn >= 4) || !(trim.heightIn >= 4)) {
    errors.push('trimSize non valido: preset "letter", "a4", "8x10" oppure larghezza e altezza di almeno 4"')
  }
  positiveInt('seed', c.seed, 0)
  for (const [name, v] of [['cluesStart', c.cluesStart], ['cluesEnd', c.cluesEnd]] as const) {
    if (!Number.isInteger(v) || v < 17 || v > 81) errors.push(`${name} deve essere un intero tra 17 e 81`)
  }
  return errors
}
